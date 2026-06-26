import { db, FieldValue } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadBase64Image } from '../utils/storage.js';

class GalleryService {
  async addImage(shopId, ownerId, data) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) throw new AppError('Shop not found', 404);
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Not authorized', 403);

    const imageId = uuidv4();
    const uploadedUrl = await uploadBase64Image(data.url, 'images', `gallery/${shopId}`);

    const image = {
      imageId,
      shopId,
      url: uploadedUrl,
      caption: data.caption || '',
      displayOrder: data.displayOrder || 0,
      createdAt: new Date().toISOString()
    };

    await db.collection('shops').doc(shopId).collection('gallery').doc(imageId).set(image);
    return image;
  }

  async getGallery(shopId) {
    const snapshot = await db.collection('shops').doc(shopId).collection('gallery')
      .orderBy('displayOrder', 'asc')
      .get();
    return snapshot.docs.map(doc => doc.data());
  }

  async updateImage(shopId, imageId, ownerId, updates) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) throw new AppError('Shop not found', 404);
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Not authorized', 403);

    const imageRef = db.collection('shops').doc(shopId).collection('gallery').doc(imageId);
    const imageDoc = await imageRef.get();
    if (!imageDoc.exists) throw new AppError('Image not found', 404);

    const allowedUpdates = {};
    if (updates.caption !== undefined) allowedUpdates.caption = updates.caption;
    if (updates.displayOrder !== undefined) allowedUpdates.displayOrder = updates.displayOrder;

    await imageRef.update(allowedUpdates);
    return { ...imageDoc.data(), ...allowedUpdates };
  }

  async deleteImage(shopId, imageId, ownerId) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) throw new AppError('Shop not found', 404);
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Not authorized', 403);

    await db.collection('shops').doc(shopId).collection('gallery').doc(imageId).delete();
    return { message: 'Image deleted' };
  }
}

export default new GalleryService();
