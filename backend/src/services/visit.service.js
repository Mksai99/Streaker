import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

class VisitService {
  async recordVisit(shopId, userId, shopOwnerId) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) throw new AppError('Shop not found.', 404);
    const shop = shopDoc.data();
    if (shop.ownerId !== shopOwnerId) throw new AppError('Not authorized.', 403);

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) throw new AppError('Customer not found.', 404);
    const user = userDoc.data();
    if (user.role !== 'customer') throw new AppError('Can only record visits for customers.', 400);

    const today = new Date().toISOString().split('T')[0];
    const existingVisits = await db.collection('visits')
      .where('userId', '==', userId).where('shopId', '==', shopId).where('visitDate', '==', today).get();
    if (!existingVisits.empty) throw new AppError('Visit already recorded for today.', 400);

    const visitId = uuidv4();
    const visit = { visitId, userId, shopId, shopName: shop.name, customerName: user.displayName,
      customerEmail: user.email, visitDate: today, visitTime: new Date().toISOString(), verified: true, createdAt: new Date().toISOString() };
    await db.collection('visits').doc(visitId).set(visit);

    const streakResult = await this.updateStreak(userId, shop.streakRules);
    await db.collection('users').doc(userId).update({
      totalVisits: (user.totalVisits || 0) + 1, currentStreak: streakResult.currentStreak,
      longestStreak: Math.max(user.longestStreak || 0, streakResult.currentStreak),
      loyaltyLevel: this.calculateLoyaltyLevel(streakResult.currentStreak), updatedAt: new Date().toISOString()
    });
    await db.collection('shops').doc(shopId).update({ 'stats.totalVisits': (shop.stats?.totalVisits || 0) + 1, updatedAt: new Date().toISOString() });

    const rewards = await this.checkRewards(userId, shopId, streakResult.currentStreak);
    if (streakResult.isNewMilestone) {
      await db.collection('notifications').add({ userId, type: 'streak_milestone',
        title: `🔥 ${streakResult.currentStreak} Day Streak!`, message: `You've maintained a ${streakResult.currentStreak}-day streak at ${shop.name}!`,
        read: false, createdAt: new Date().toISOString() });
    }
    await db.collection('analytics').add({ type: 'visit', shopId, userId, date: today, streak: streakResult.currentStreak, createdAt: new Date().toISOString() });
    return { visit, streak: streakResult, rewards, message: `Visit recorded! Streak: ${streakResult.currentStreak} days` };
  }

  async updateStreak(userId, streakRules = {}) {
    const streakDoc = await db.collection('streaks').doc(userId).get();
    const existing = streakDoc.exists ? streakDoc.data() : null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let currentStreak = 1, isNewMilestone = false, streakReset = false;

    if (existing?.lastVisitDate) {
      const lastVisit = new Date(existing.lastVisitDate); lastVisit.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastVisit) / 86400000);
      const grace = streakRules.gracePeriodDays || 0;
      if (daysDiff === 0) currentStreak = existing.currentStreak;
      else if (daysDiff === 1) currentStreak = (existing.currentStreak || 0) + 1;
      else if (daysDiff <= grace + 1) currentStreak = (existing.currentStreak || 0) + 1;
      else { currentStreak = 1; streakReset = true; }
    }
    isNewMilestone = [3,5,7,10,14,21,30,50,100].includes(currentStreak);
    const longestStreak = Math.max(currentStreak, existing?.longestStreak || 0);
    await db.collection('streaks').doc(userId).set({
      userId, currentStreak, longestStreak, lastVisitDate: today.toISOString(),
      streakStartDate: streakReset || !existing?.streakStartDate ? today.toISOString() : existing.streakStartDate,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return { currentStreak, longestStreak, isNewMilestone, streakReset };
  }

  async checkRewards(userId, shopId, currentStreak) {
    const snapshot = await db.collection('rewards').where('shopId', '==', shopId).where('active', '==', true).get();
    const eligible = [];
    for (const doc of snapshot.docs) {
      const reward = doc.data();
      if (currentStreak >= reward.requiredStreak) {
        const claims = await db.collection('rewardClaims').where('userId', '==', userId).where('rewardId', '==', reward.rewardId).get();
        if (claims.empty) {
          eligible.push(reward);
          await db.collection('notifications').add({ userId, type: 'reward_unlocked',
            title: `🎁 Reward: ${reward.name}!`, message: `You earned "${reward.name}" with your ${currentStreak}-day streak!`,
            read: false, createdAt: new Date().toISOString() });
        }
      }
    }
    return eligible;
  }

  calculateLoyaltyLevel(streak) {
    if (streak >= 100) return 'diamond'; if (streak >= 50) return 'platinum';
    if (streak >= 30) return 'gold'; if (streak >= 14) return 'silver'; return 'bronze';
  }

  async getVisitsByUser(userId, { page = 1, limit = 10, period }) {
    let query = db.collection('visits').where('userId', '==', userId);
    if (period) {
      const now = new Date(); let start;
      if (period === 'weekly') start = new Date(now.setDate(now.getDate() - 7));
      else if (period === 'monthly') start = new Date(now.setMonth(now.getMonth() - 1));
      else if (period === 'yearly') start = new Date(now.setFullYear(now.getFullYear() - 1));
      if (start) query = query.where('visitDate', '>=', start.toISOString().split('T')[0]);
    }
    const snapshot = await query.get();
    let visits = snapshot.docs.map(d => d.data()).sort((a, b) => new Date(b.visitTime) - new Date(a.visitTime));
    const total = visits.length; const startIdx = (page - 1) * limit;
    return { visits: visits.slice(startIdx, startIdx + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getVisitsByShop(shopId, { page = 1, limit = 10, date }) {
    let query = db.collection('visits').where('shopId', '==', shopId);
    if (date) query = query.where('visitDate', '==', date);
    const snapshot = await query.get();
    let visits = snapshot.docs.map(d => d.data()).sort((a, b) => new Date(b.visitTime) - new Date(a.visitTime));
    const total = visits.length; const startIdx = (page - 1) * limit;
    return { visits: visits.slice(startIdx, startIdx + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async scanQRCode(qrData, shopId, shopOwnerId) {
    const parts = qrData.split('_');
    if (parts.length < 2 || parts[0] !== 'STREAKIFY') throw new AppError('Invalid QR code.', 400);
    return this.recordVisit(shopId, parts[1], shopOwnerId);
  }
}

export default new VisitService();
