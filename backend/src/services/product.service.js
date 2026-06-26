import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadBase64Image, uploadImageArray } from '../utils/storage.js';

class ProductService {
  // --- CATEGORIES ---
  async createCategory(shopId, ownerId, data) {
    // Verify shop ownership
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists || shopDoc.data().ownerId !== ownerId) {
      throw new AppError('Unauthorized', 403);
    }

    const categoryId = uuidv4();
    const uploadedImage = await uploadBase64Image(data.image, 'images', `categories/${shopId}`);

    const category = {
      categoryId,
      shopId,
      name: data.name,
      image: uploadedImage,
      order: data.order || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('categories').doc(categoryId).set(category);
    return category;
  }

  async getCategories(shopId) {
    const snapshot = await db.collection('categories')
      .where('shopId', '==', shopId)
      .orderBy('order', 'asc')
      .get();
    return snapshot.docs.map(doc => doc.data());
  }

  async updateCategory(categoryId, ownerId, updates) {
    const docRef = db.collection('categories').doc(categoryId);
    const doc = await docRef.get();
    
    if (!doc.exists) throw new AppError('Category not found', 404);
    
    const shopDoc = await db.collection('shops').doc(doc.data().shopId).get();
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Unauthorized', 403);

    const safeUpdates = {
      name: updates.name,
      order: updates.order,
      updatedAt: new Date().toISOString()
    };
    if (updates.image !== undefined) {
      safeUpdates.image = await uploadBase64Image(updates.image, 'images', `categories/${doc.data().shopId}`);
    }
    
    // clean undefined
    Object.keys(safeUpdates).forEach(key => safeUpdates[key] === undefined && delete safeUpdates[key]);

    await docRef.update(safeUpdates);
    return { ...doc.data(), ...safeUpdates };
  }

  async deleteCategory(categoryId, ownerId) {
    const docRef = db.collection('categories').doc(categoryId);
    const doc = await docRef.get();
    if (!doc.exists) throw new AppError('Category not found', 404);
    
    const shopDoc = await db.collection('shops').doc(doc.data().shopId).get();
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Unauthorized', 403);

    await docRef.delete();
    return { success: true };
  }

  // --- PRODUCTS ---
  async createProduct(shopId, ownerId, data) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists || shopDoc.data().ownerId !== ownerId) {
      throw new AppError('Unauthorized', 403);
    }

    const productId = uuidv4();
    const uploadedImages = await uploadImageArray(data.images || [], 'images', `products/${shopId}`);
    const uploadedImage = uploadedImages.length > 0 ? uploadedImages[0] : (await uploadBase64Image(data.image, 'images', `products/${shopId}`));

    const product = {
      productId,
      shopId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description || '',
      price: Number(data.price),
      image: uploadedImage,
      images: uploadedImages,
      sku: data.sku || '',
      tags: data.tags || [],
      status: data.status || 'Available', // Available, Out of Stock, Temporarily Unavailable
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('products').doc(productId).set(product);
    return product;
  }

  async getProducts(shopId, categoryId = null) {
    let query = db.collection('products').where('shopId', '==', shopId);
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());
  }

  async updateProduct(productId, ownerId, updates) {
    const docRef = db.collection('products').doc(productId);
    const doc = await docRef.get();
    
    if (!doc.exists) throw new AppError('Product not found', 404);
    
    const shopDoc = await db.collection('shops').doc(doc.data().shopId).get();
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Unauthorized', 403);

    const safeUpdates = {
      categoryId: updates.categoryId,
      name: updates.name,
      description: updates.description,
      price: updates.price !== undefined ? Number(updates.price) : undefined,
      sku: updates.sku,
      tags: updates.tags,
      status: updates.status,
      updatedAt: new Date().toISOString()
    };
    
    if (updates.images !== undefined) {
      safeUpdates.images = await uploadImageArray(updates.images, 'images', `products/${doc.data().shopId}`);
      if (safeUpdates.images.length > 0) {
        safeUpdates.image = safeUpdates.images[0];
      }
    } else if (updates.image !== undefined) {
      safeUpdates.image = await uploadBase64Image(updates.image, 'images', `products/${doc.data().shopId}`);
    }
    
    Object.keys(safeUpdates).forEach(key => safeUpdates[key] === undefined && delete safeUpdates[key]);

    await docRef.update(safeUpdates);
    return { ...doc.data(), ...safeUpdates };
  }

  async deleteProduct(productId, ownerId) {
    const docRef = db.collection('products').doc(productId);
    const doc = await docRef.get();
    if (!doc.exists) throw new AppError('Product not found', 404);
    
    const shopDoc = await db.collection('shops').doc(doc.data().shopId).get();
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Unauthorized', 403);

    await docRef.delete();
    return { success: true };
  }
}

export default new ProductService();
