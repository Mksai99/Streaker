import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

class OfferService {
  async create(shopId, ownerId, data) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists || shopDoc.data().ownerId !== ownerId) {
      throw new AppError('Unauthorized', 403);
    }

    const offerId = uuidv4();
    const offer = {
      offerId,
      shopId,
      title: data.title,
      description: data.description || '',
      banner: data.banner || '',
      couponCode: data.couponCode || '',
      terms: data.terms || '',
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || null,
      status: data.status || 'Active', // Active, Scheduled, Expired
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('offers').doc(offerId).set(offer);
    return offer;
  }

  async getOffers(shopId) {
    const snapshot = await db.collection('offers').where('shopId', '==', shopId).get();
    return snapshot.docs.map(doc => doc.data());
  }

  async update(offerId, ownerId, updates) {
    const docRef = db.collection('offers').doc(offerId);
    const doc = await docRef.get();
    
    if (!doc.exists) throw new AppError('Offer not found', 404);
    
    const shopDoc = await db.collection('shops').doc(doc.data().shopId).get();
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Unauthorized', 403);

    const safeUpdates = {
      title: updates.title,
      description: updates.description,
      banner: updates.banner,
      couponCode: updates.couponCode,
      terms: updates.terms,
      startDate: updates.startDate,
      endDate: updates.endDate,
      status: updates.status,
      updatedAt: new Date().toISOString()
    };
    Object.keys(safeUpdates).forEach(key => safeUpdates[key] === undefined && delete safeUpdates[key]);

    await docRef.update(safeUpdates);
    return { ...doc.data(), ...safeUpdates };
  }

  async delete(offerId, ownerId) {
    const docRef = db.collection('offers').doc(offerId);
    const doc = await docRef.get();
    if (!doc.exists) throw new AppError('Offer not found', 404);
    
    const shopDoc = await db.collection('shops').doc(doc.data().shopId).get();
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Unauthorized', 403);

    await docRef.delete();
    return { success: true };
  }
}

export default new OfferService();
