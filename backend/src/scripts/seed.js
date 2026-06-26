import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/firebase.js';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create Admin
  const adminId = uuidv4();
  const adminPassword = await bcrypt.hash('admin123', 12);
  await db.collection('users').doc(adminId).set({
    uid: adminId, email: 'admin@streakify.com', displayName: 'Super Admin', role: 'admin',
    password: adminPassword, phone: '+1234567890', avatar: '', qrCode: `STREAKIFY_${adminId}`,
    loyaltyLevel: 'diamond', totalVisits: 0, totalRewards: 0, currentStreak: 0, longestStreak: 0,
    suspended: false, darkMode: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });
  console.log('✅ Admin created: admin@streakify.com / admin123');

  // Create Shop Owner
  const ownerId = uuidv4();
  const ownerPassword = await bcrypt.hash('owner123', 12);
  await db.collection('users').doc(ownerId).set({
    uid: ownerId, email: 'owner@coffeehouse.com', displayName: 'John Coffee', role: 'shopOwner',
    password: ownerPassword, phone: '+1987654321', avatar: '', qrCode: `STREAKIFY_${ownerId}`,
    loyaltyLevel: 'gold', totalVisits: 0, totalRewards: 0, currentStreak: 0, longestStreak: 0,
    suspended: false, darkMode: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });
  console.log('✅ Shop Owner created: owner@coffeehouse.com / owner123');

  // Create Shop
  const shopId = uuidv4();
  await db.collection('shops').doc(shopId).set({
    shopId, ownerId, name: 'The Daily Grind', description: 'Premium artisan coffee & pastries',
    category: 'cafe', address: '123 Main St, Downtown', phone: '+1555555555',
    email: 'hello@dailygrind.com', logo: '', website: 'https://dailygrind.com',
    businessHours: {
      monday: { open: '07:00', close: '20:00', closed: false },
      tuesday: { open: '07:00', close: '20:00', closed: false },
      wednesday: { open: '07:00', close: '20:00', closed: false },
      thursday: { open: '07:00', close: '20:00', closed: false },
      friday: { open: '07:00', close: '22:00', closed: false },
      saturday: { open: '08:00', close: '22:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: false }
    },
    streakRules: { gracePeriodDays: 1, maxVisitsPerDay: 1, minTimeBetweenVisits: 12 },
    stats: { totalCustomers: 3, totalVisits: 45, activeStreaks: 2, rewardsRedeemed: 5 },
    approved: true, suspended: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });

  // Create second shop
  const shop2Id = uuidv4();
  await db.collection('shops').doc(shop2Id).set({
    shopId: shop2Id, ownerId, name: 'FitZone Gym', description: 'Your ultimate fitness destination',
    category: 'gym', address: '456 Fitness Ave, Uptown', phone: '+1555666777',
    email: 'info@fitzone.com', logo: '', website: '',
    businessHours: {
      monday: { open: '05:00', close: '23:00', closed: false },
      tuesday: { open: '05:00', close: '23:00', closed: false },
      wednesday: { open: '05:00', close: '23:00', closed: false },
      thursday: { open: '05:00', close: '23:00', closed: false },
      friday: { open: '05:00', close: '23:00', closed: false },
      saturday: { open: '07:00', close: '21:00', closed: false },
      sunday: { open: '08:00', close: '20:00', closed: false }
    },
    streakRules: { gracePeriodDays: 0, maxVisitsPerDay: 1, minTimeBetweenVisits: 12 },
    stats: { totalCustomers: 2, totalVisits: 30, activeStreaks: 1, rewardsRedeemed: 2 },
    approved: true, suspended: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });

  // Create Customers
  const customers = [];
  for (let i = 1; i <= 3; i++) {
    const custId = uuidv4();
    const custPassword = await bcrypt.hash('customer123', 12);
    const streak = [15, 7, 3][i - 1];
    await db.collection('users').doc(custId).set({
      uid: custId, email: `customer${i}@example.com`, displayName: ['Sarah Johnson', 'Mike Chen', 'Emma Wilson'][i - 1],
      role: 'customer', password: custPassword, phone: '', avatar: '', qrCode: `STREAKIFY_${custId}_${Date.now()}`,
      loyaltyLevel: ['silver', 'bronze', 'bronze'][i - 1], totalVisits: [15, 7, 3][i - 1],
      totalRewards: [2, 1, 0][i - 1], currentStreak: streak, longestStreak: streak,
      suspended: false, darkMode: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    await db.collection('streaks').doc(custId).set({
      userId: custId, currentStreak: streak, longestStreak: streak,
      lastVisitDate: new Date().toISOString(), streakStartDate: new Date(Date.now() - streak * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    });
    customers.push(custId);
    console.log(`✅ Customer ${i}: customer${i}@example.com / customer123 (Streak: ${streak})`);
  }

  // Create Rewards
  const rewardConfigs = [
    { name: 'Free Coffee', desc: 'Get a free coffee of your choice', streak: 7, type: 'free_product', value: 'Any coffee' },
    { name: '20% Off', desc: '20% discount on your next order', streak: 14, type: 'percentage_discount', value: '20' },
    { name: 'Free Pastry', desc: 'Enjoy a complimentary pastry', streak: 5, type: 'free_product', value: 'Any pastry' },
    { name: '$5 Cashback', desc: '$5 cashback on orders over $15', streak: 21, type: 'cashback', value: '5' },
    { name: 'Free Month', desc: 'Get one month free membership', streak: 30, type: 'free_product', value: 'Monthly membership' },
  ];

  for (const rc of rewardConfigs) {
    const rwId = uuidv4();
    const sid = rc.name === 'Free Month' ? shop2Id : shopId;
    await db.collection('rewards').doc(rwId).set({
      rewardId: rwId, shopId: sid, shopName: rc.name === 'Free Month' ? 'FitZone Gym' : 'The Daily Grind',
      name: rc.name, description: rc.desc, requiredStreak: rc.streak, rewardType: rc.type,
      value: rc.value, active: true, totalClaimed: 0, expiresAt: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
  }
  console.log('✅ Rewards created');

  // Create sample visits
  for (let i = 0; i < 15; i++) {
    const date = new Date(); date.setDate(date.getDate() - i);
    const visitId = uuidv4();
    await db.collection('visits').doc(visitId).set({
      visitId, userId: customers[0], shopId, shopName: 'The Daily Grind',
      customerName: 'Sarah Johnson', customerEmail: 'customer1@example.com',
      visitDate: date.toISOString().split('T')[0], visitTime: date.toISOString(),
      verified: true, createdAt: date.toISOString()
    });
  }

  for (let i = 0; i < 7; i++) {
    const date = new Date(); date.setDate(date.getDate() - i);
    const visitId = uuidv4();
    await db.collection('visits').doc(visitId).set({
      visitId, userId: customers[1], shopId, shopName: 'The Daily Grind',
      customerName: 'Mike Chen', customerEmail: 'customer2@example.com',
      visitDate: date.toISOString().split('T')[0], visitTime: date.toISOString(),
      verified: true, createdAt: date.toISOString()
    });
  }
  console.log('✅ Visits created');

  // Notifications
  const notifTypes = [
    { type: 'welcome', title: '🎉 Welcome to Streakify!', message: 'Start building your streak today!' },
    { type: 'streak_milestone', title: '🔥 7 Day Streak!', message: 'Amazing! Keep it going!' },
    { type: 'reward_unlocked', title: '🎁 Reward Unlocked!', message: 'You earned Free Coffee!' },
  ];
  for (const n of notifTypes) {
    await db.collection('notifications').add({
      userId: customers[0], ...n, read: false, createdAt: new Date().toISOString()
    });
  }
  console.log('✅ Notifications created');

  console.log('\n🎉 Seed complete! You can now log in with:');
  console.log('  Admin: admin@streakify.com / admin123');
  console.log('  Shop Owner: owner@coffeehouse.com / owner123');
  console.log('  Customer 1: customer1@example.com / customer123');
  console.log('  Customer 2: customer2@example.com / customer123');
  console.log('  Customer 3: customer3@example.com / customer123');
}

seed().catch(console.error);
