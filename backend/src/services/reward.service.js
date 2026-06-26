import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

class RewardService {
  async create(shopId, ownerId, data) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) throw new AppError('Shop not found.', 404);
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Not authorized.', 403);

    const rewardId = uuidv4();
    const reward = {
      rewardId, shopId, shopName: shopDoc.data().name, name: data.name,
      description: data.description || '', requiredStreak: parseInt(data.requiredStreak),
      rewardType: data.rewardType, value: data.value || '',
      image: data.image || '', maxClaims: data.maxClaims ? parseInt(data.maxClaims) : null,
      active: data.active !== undefined ? data.active : true, totalClaimed: 0,
      expiresAt: data.expiresAt || null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    await db.collection('rewards').doc(rewardId).set(reward);
    return reward;
  }

  async getByShop(shopId, { page = 1, limit = 10 }) {
    const snapshot = await db.collection('rewards').where('shopId', '==', shopId).get();
    let rewards = snapshot.docs.map(d => d.data()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = rewards.length; const start = (page - 1) * limit;
    return { rewards: rewards.slice(start, start + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getById(rewardId) {
    const doc = await db.collection('rewards').doc(rewardId).get();
    if (!doc.exists) throw new AppError('Reward not found.', 404);
    return doc.data();
  }

  async update(rewardId, ownerId, updates) {
    const reward = await this.getById(rewardId);
    const shopDoc = await db.collection('shops').doc(reward.shopId).get();
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Not authorized.', 403);

    const allowed = ['name', 'description', 'requiredStreak', 'rewardType', 'value', 'image', 'maxClaims', 'active', 'expiresAt'];
    const filtered = {};
    allowed.forEach(f => { if (updates[f] !== undefined) filtered[f] = updates[f]; });
    filtered.updatedAt = new Date().toISOString();
    await db.collection('rewards').doc(rewardId).update(filtered);
    return { ...reward, ...filtered };
  }

  async delete(rewardId, ownerId) {
    const reward = await this.getById(rewardId);
    const shopDoc = await db.collection('shops').doc(reward.shopId).get();
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Not authorized.', 403);
    await db.collection('rewards').doc(rewardId).delete();
    return { message: 'Reward deleted.' };
  }

  async claim(rewardId, userId) {
    const reward = await this.getById(rewardId);
    if (!reward.active) throw new AppError('Reward is no longer active.', 400);
    if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) throw new AppError('Reward has expired.', 400);

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) throw new AppError('User not found.', 404);
    const user = userDoc.data();

    if ((user.currentStreak || 0) < reward.requiredStreak) {
      throw new AppError(`Need ${reward.requiredStreak} day streak. Current: ${user.currentStreak || 0}.`, 400);
    }

    const existingClaims = await db.collection('rewardClaims')
      .where('userId', '==', userId).where('rewardId', '==', rewardId).where('status', '==', 'claimed').get();
    if (!existingClaims.empty) throw new AppError('Already claimed this reward.', 400);

    const claimId = uuidv4();
    const claim = {
      claimId, rewardId, userId, shopId: reward.shopId, rewardName: reward.name,
      rewardType: reward.rewardType, value: reward.value,
      status: 'claimed', claimedAt: new Date().toISOString()
    };
    await db.collection('rewardClaims').doc(claimId).set(claim);
    await db.collection('rewards').doc(rewardId).update({ totalClaimed: (reward.totalClaimed || 0) + 1 });
    await db.collection('users').doc(userId).update({ totalRewards: (user.totalRewards || 0) + 1, updatedAt: new Date().toISOString() });

    await db.collection('notifications').add({
      userId, type: 'reward_claimed', title: `✅ Reward Claimed!`,
      message: `You've claimed "${reward.name}" from ${reward.shopName}!`,
      read: false, createdAt: new Date().toISOString()
    });
    return claim;
  }

  async getUserRewards(userId) {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) throw new AppError('User not found.', 404);
    const currentStreak = userDoc.data().currentStreak || 0;

    // Get unique shops the user has visited
    const visitsSnapshot = await db.collection('visits').where('userId', '==', userId).get();
    const visitedShopIds = [...new Set(visitsSnapshot.docs.map(d => d.data().shopId))];

    if (visitedShopIds.length === 0) {
      return []; // Return empty if no visits
    }

    // Fetch rewards only for visited shops
    const rewardPromises = visitedShopIds.map(shopId => 
      db.collection('rewards').where('shopId', '==', shopId).where('active', '==', true).get()
    );
    const snapshots = await Promise.all(rewardPromises);
    const activeRewards = snapshots.flatMap(snap => snap.docs.map(d => d.data()));

    const claimsSnapshot = await db.collection('rewardClaims').where('userId', '==', userId).get();
    const claimedIds = new Set(claimsSnapshot.docs.map(d => d.data().rewardId));

    return activeRewards.map(r => {
      return { ...r, progress: Math.min(100, Math.round((currentStreak / r.requiredStreak) * 100)),
        claimed: claimedIds.has(r.rewardId), eligible: currentStreak >= r.requiredStreak && !claimedIds.has(r.rewardId) };
    });
  }

  async getClaimsByShop(shopId, ownerId, { page = 1, limit = 10, status }) {
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists || shopDoc.data().ownerId !== ownerId) throw new AppError('Not authorized.', 403);

    let query = db.collection('rewardClaims').where('shopId', '==', shopId);
    if (status) query = query.where('status', '==', status);
    const snapshot = await query.get();
    let claims = snapshot.docs.map(d => d.data()).sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt));
    const total = claims.length; const start = (page - 1) * limit;
    return { claims: claims.slice(start, start + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async approveClaim(claimId, ownerId) {
    const claimDoc = await db.collection('rewardClaims').doc(claimId).get();
    if (!claimDoc.exists) throw new AppError('Claim not found.', 404);
    const claim = claimDoc.data();
    const shopDoc = await db.collection('shops').doc(claim.shopId).get();
    if (shopDoc.data().ownerId !== ownerId) throw new AppError('Not authorized.', 403);

    await db.collection('rewardClaims').doc(claimId).update({ status: 'approved', approvedAt: new Date().toISOString() });
    await db.collection('notifications').add({
      userId: claim.userId, type: 'reward_approved', title: `🎉 Reward Approved!`,
      message: `Your reward "${claim.rewardName}" has been approved!`, read: false, createdAt: new Date().toISOString()
    });
    return { ...claim, status: 'approved' };
  }
}

export default new RewardService();
