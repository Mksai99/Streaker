import { db, FieldValue } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadBase64Image } from '../utils/storage.js';

class ShopService {
  async create(ownerId, shopData) {
    const existingShops = await this.getByOwnerId(ownerId);
    if (existingShops && existingShops.length > 0) {
      throw new AppError('You can only create one shop per account.', 400);
    }

    const shopId = uuidv4();
    const uploadedLogo = await uploadBase64Image(shopData.logo, 'images', `shops/${shopId}/logo`);
    const uploadedCover = await uploadBase64Image(shopData.coverImage, 'images', `shops/${shopId}/cover`);
    
    const shop = {
      shopId,
      ownerId,
      // Basic Info
      name: shopData.name,
      logo: uploadedLogo || '',
      coverImage: uploadedCover || '',
      description: shopData.description || '',
      category: shopData.category,
      gstNumber: shopData.gstNumber || '',
      yearEstablished: shopData.yearEstablished || '',
      
      // Owner Info
      ownerName: shopData.ownerName || '',
      ownerEmail: shopData.ownerEmail || '',
      ownerMobile: shopData.ownerMobile || '',
      alternateContact: shopData.alternateContact || '',
      
      // Shop Location
      location: shopData.location || { lat: 0, lng: 0 },
      address: shopData.address || '',
      landmark: shopData.landmark || '',
      city: shopData.city || '',
      state: shopData.state || '',
      country: shopData.country || '',
      pincode: shopData.pincode || '',
      
      // Online Presence
      website: shopData.website || '',
      instagram: shopData.instagram || '',
      facebook: shopData.facebook || '',
      whatsappNumber: shopData.whatsappNumber || '',
      
      // Business Information
      openingTime: shopData.openingTime || '09:00',
      closingTime: shopData.closingTime || '21:00',
      weeklyHolidays: shopData.weeklyHolidays || [],
      averageCapacity: shopData.averageCapacity || '',

      streakRules: {
        gracePeriodDays: shopData.gracePeriodDays || 0,
        maxVisitsPerDay: 1,
        minTimeBetweenVisits: 12, // hours
      },
      stats: {
        totalCustomers: 0,
        totalVisits: 0,
        activeStreaks: 0,
        rewardsRedeemed: 0,
        totalProducts: 0
      },
      approved: true,
      suspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('shops').doc(shopId).set(shop);

    // Log activity
    await db.collection('systemLogs').add({
      type: 'shop_created',
      shopId,
      userId: ownerId,
      message: `Shop "${shop.name}" was created`,
      createdAt: new Date().toISOString()
    });

    return shop;
  }

  async getById(shopId) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      throw new AppError('Shop not found.', 404);
    }
    return shopDoc.data();
  }

  async getByOwnerId(ownerId) {
    const shopsSnapshot = await db.collection('shops')
      .where('ownerId', '==', ownerId)
      .get();
    
    return shopsSnapshot.docs.map(doc => doc.data());
  }

  async getAll({ page = 1, limit = 10, category, search }) {
    let query = db.collection('shops').where('suspended', '==', false);
    
    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    let shops = snapshot.docs.map(doc => doc.data());
    
    if (search) {
      const searchLower = search.toLowerCase();
      shops = shops.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.category.toLowerCase().includes(searchLower)
      );
    }

    const total = shops.length;
    const startIndex = (page - 1) * limit;
    const paginatedShops = shops.slice(startIndex, startIndex + limit);

    return {
      shops: paginatedShops,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async update(shopId, ownerId, updates) {
    const shop = await this.getById(shopId);
    
    if (shop.ownerId !== ownerId) {
      throw new AppError('Not authorized to update this shop.', 403);
    }

    const allowedFields = [
      'name', 'logo', 'coverImage', 'description', 'category', 'gstNumber', 'yearEstablished',
      'ownerName', 'ownerEmail', 'ownerMobile', 'alternateContact',
      'location', 'address', 'landmark', 'city', 'state', 'country', 'pincode',
      'website', 'instagram', 'facebook', 'whatsappNumber',
      'openingTime', 'closingTime', 'weeklyHolidays', 'averageCapacity', 'streakRules'
    ];
    const filteredUpdates = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }
    
    if (updates.logo) {
      filteredUpdates.logo = await uploadBase64Image(updates.logo, 'images', `shops/${shopId}/logo`);
    }
    if (updates.coverImage) {
      filteredUpdates.coverImage = await uploadBase64Image(updates.coverImage, 'images', `shops/${shopId}/cover`);
    }
    
    filteredUpdates.updatedAt = new Date().toISOString();

    await db.collection('shops').doc(shopId).update(filteredUpdates);
    return { ...shop, ...filteredUpdates };
  }

  async delete(shopId, ownerId) {
    const shop = await this.getById(shopId);
    if (shop.ownerId !== ownerId) {
      throw new AppError('Not authorized to delete this shop.', 403);
    }
    await db.collection('shops').doc(shopId).delete();
    return { message: 'Shop deleted successfully.' };
  }

  async getCustomers(shopId, ownerId, { page = 1, limit = 10, search }) {
    const shop = await this.getById(shopId);
    if (shop.ownerId !== ownerId) {
      throw new AppError('Not authorized.', 403);
    }

    const visitsSnapshot = await db.collection('visits')
      .where('shopId', '==', shopId)
      .get();

    // Get unique customer IDs
    const customerMap = {};
    visitsSnapshot.docs.forEach(doc => {
      const visit = doc.data();
      if (!customerMap[visit.userId]) {
        customerMap[visit.userId] = {
          userId: visit.userId,
          totalVisits: 0,
          lastVisit: visit.visitDate,
          displayName: visit.customerName || 'Unknown',
          email: visit.customerEmail || ''
        };
      }
      customerMap[visit.userId].totalVisits++;
      if (visit.visitDate > customerMap[visit.userId].lastVisit) {
        customerMap[visit.userId].lastVisit = visit.visitDate;
      }
    });

    let customers = Object.values(customerMap);
    
    // Enrich with streak data
    for (const customer of customers) {
      try {
        const streakDoc = await db.collection('streaks').doc(customer.userId).get();
        if (streakDoc.exists) {
          customer.currentStreak = streakDoc.data().currentStreak || 0;
        }
      } catch { customer.currentStreak = 0; }
      
      try {
        const userDoc = await db.collection('users').doc(customer.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          customer.displayName = userData.displayName;
          customer.email = userData.email;
          customer.loyaltyLevel = userData.loyaltyLevel;
        }
      } catch {}
    }

    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c => 
        c.displayName?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower)
      );
    }

    const total = customers.length;
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = customers.slice(startIndex, startIndex + limit);

    return {
      customers: paginatedCustomers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }
}

export default new ShopService();
