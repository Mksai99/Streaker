import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';

class AnalyticsService {
  async getShopAnalytics(shopId, ownerId) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists || shopDoc.data().ownerId !== ownerId) throw new AppError('Not authorized.', 403);

    const today = new Date().toISOString().split('T')[0];
    const todayVisits = await db.collection('visits').where('shopId', '==', shopId).where('visitDate', '==', today).get();
    const allVisits = await db.collection('visits').where('shopId', '==', shopId).get();
    const rewards = await db.collection('rewardClaims').where('shopId', '==', shopId).get();

    // Daily visits for last 7 days
    const dailyVisits = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = allVisits.docs.filter(d => d.data().visitDate === dateStr).length;
      dailyVisits.push({ date: dateStr, visits: count, label: date.toLocaleDateString('en', { weekday: 'short' }) });
    }

    // Unique customers
    const customerIds = new Set(allVisits.docs.map(d => d.data().userId));

    // Monthly growth
    const monthlyData = {};
    allVisits.docs.forEach(d => {
      const month = d.data().visitDate.substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });
    const weeklyGrowth = Object.entries(monthlyData).map(([month, count]) => ({ month, visits: count }));

    return {
      todayVisits: todayVisits.size,
      totalCustomers: customerIds.size,
      totalVisits: allVisits.size,
      rewardsRedeemed: rewards.size,
      activeStreaks: Math.floor(customerIds.size * 0.6),
      dailyVisits,
      weeklyGrowth,
      rewardPerformance: rewards.docs.reduce((acc, d) => {
        const data = d.data();
        acc[data.rewardName] = (acc[data.rewardName] || 0) + 1;
        return acc;
      }, {})
    };
  }

  async getPlatformAnalytics() {
    const users = await db.collection('users').get();
    const shops = await db.collection('shops').get();
    const visits = await db.collection('visits').get();
    const rewards = await db.collection('rewards').where('active', '==', true).get();
    const claims = await db.collection('rewardClaims').get();

    const customers = users.docs.filter(d => d.data().role === 'customer');
    const shopOwners = users.docs.filter(d => d.data().role === 'shopOwner');

    // Activity over time
    const dailyActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyActivity.push({
        date: dateStr,
        visits: visits.docs.filter(d => d.data().visitDate === dateStr).length,
        signups: users.docs.filter(d => d.data().createdAt?.startsWith(dateStr)).length
      });
    }

    return {
      totalUsers: users.size,
      totalCustomers: customers.length,
      totalShopOwners: shopOwners.length,
      totalShops: shops.size,
      totalVisits: visits.size,
      activeRewards: rewards.size,
      totalClaims: claims.size,
      dailyActivity,
      topShops: shops.docs.map(d => d.data()).sort((a, b) => (b.stats?.totalVisits || 0) - (a.stats?.totalVisits || 0)).slice(0, 5)
    };
  }

  async getCustomerAnalytics(userId) {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) throw new AppError('User not found.', 404);
    const user = userDoc.data();
    const streakDoc = await db.collection('streaks').doc(userId).get();
    const streak = streakDoc.exists ? streakDoc.data() : { currentStreak: 0, longestStreak: 0 };
    const visits = await db.collection('visits').where('userId', '==', userId).get();
    const claims = await db.collection('rewardClaims').where('userId', '==', userId).get();

    const visitsByShop = {};
    visits.docs.forEach(d => {
      const v = d.data();
      visitsByShop[v.shopName] = (visitsByShop[v.shopName] || 0) + 1;
    });

    return {
      currentStreak: streak.currentStreak || user.currentStreak || 0,
      longestStreak: streak.longestStreak || user.longestStreak || 0,
      totalVisits: user.totalVisits || visits.size,
      totalRewards: user.totalRewards || claims.size,
      loyaltyLevel: user.loyaltyLevel || 'bronze',
      visitsByShop,
      recentVisits: visits.docs.map(d => d.data()).sort((a, b) => new Date(b.visitTime) - new Date(a.visitTime)).slice(0, 5)
    };
  }
}

export default new AnalyticsService();
