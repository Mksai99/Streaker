import { db, FieldValue } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

class ReviewService {
  async addReview(shopId, userId, data) {
    // Check if user already reviewed this shop
    const existing = await db.collection('reviews')
      .where('shopId', '==', shopId)
      .where('userId', '==', userId)
      .get();
      
    if (!existing.empty) {
      throw new AppError('You have already reviewed this shop.', 400);
    }

    // Verify user visited the shop
    const visits = await db.collection('visits')
      .where('shopId', '==', shopId)
      .where('userId', '==', userId)
      .get();
      
    if (visits.empty) {
      throw new AppError('You must visit this shop before reviewing.', 403);
    }

    const reviewId = uuidv4();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};

    const review = {
      reviewId,
      shopId,
      userId,
      customerName: userData.displayName || 'Anonymous',
      customerAvatar: userData.avatar || '',
      rating: Number(data.rating) || 5,
      title: data.title || '',
      comment: data.comment || '',
      images: data.images || [], // Array of base64 strings
      verifiedVisit: true,
      ownerReply: null,
      ownerReplyAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('reviews').doc(reviewId).set(review);
    
    // Update shop analytics
    this._updateShopRating(shopId);

    return review;
  }

  async getShopReviews(shopId, { page = 1, limit = 10, sort = 'recent' }) {
    let query = db.collection('reviews').where('shopId', '==', shopId);

    const snapshot = await query.get();
    let reviews = snapshot.docs.map(doc => doc.data());

    if (sort === 'highest') reviews.sort((a, b) => b.rating - a.rating);
    else if (sort === 'lowest') reviews.sort((a, b) => a.rating - b.rating);
    else reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = reviews.length;
    const startIndex = (page - 1) * limit;
    const paginated = reviews.slice(startIndex, startIndex + limit);

    return {
      reviews: paginated,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateReview(reviewId, userId, data) {
    const reviewRef = db.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();
    
    if (!reviewDoc.exists) throw new AppError('Review not found', 404);
    if (reviewDoc.data().userId !== userId) throw new AppError('Not authorized', 403);

    const updates = {
      rating: Number(data.rating) || reviewDoc.data().rating,
      title: data.title !== undefined ? data.title : reviewDoc.data().title,
      comment: data.comment !== undefined ? data.comment : reviewDoc.data().comment,
      images: data.images !== undefined ? data.images : reviewDoc.data().images,
      updatedAt: new Date().toISOString()
    };

    await reviewRef.update(updates);
    
    this._updateShopRating(reviewDoc.data().shopId);

    return { ...reviewDoc.data(), ...updates };
  }

  async replyToReview(reviewId, shopId, ownerId, replyText) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists || shopDoc.data().ownerId !== ownerId) {
      throw new AppError('Not authorized', 403);
    }

    const reviewRef = db.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();
    if (!reviewDoc.exists || reviewDoc.data().shopId !== shopId) {
      throw new AppError('Review not found', 404);
    }

    const updates = {
      ownerReply: replyText,
      ownerReplyAt: new Date().toISOString()
    };

    await reviewRef.update(updates);
    return { ...reviewDoc.data(), ...updates };
  }

  async _updateShopRating(shopId) {
    const snapshot = await db.collection('reviews').where('shopId', '==', shopId).get();
    const reviews = snapshot.docs.map(doc => doc.data());
    
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;

    await db.collection('shops').doc(shopId).update({
      'stats.averageRating': Number(avgRating.toFixed(1)),
      'stats.totalReviews': totalReviews
    });
  }
}

export default new ReviewService();
