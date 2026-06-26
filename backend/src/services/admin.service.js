import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';

class AdminService {
  async getAllUsers({ page = 1, limit = 10, role, search, suspended }) {
    let query = db.collection('users');
    if (role) query = query.where('role', '==', role);
    if (suspended !== undefined) query = query.where('suspended', '==', suspended === 'true');
    const snapshot = await query.get();
    let users = snapshot.docs.map(d => { const u = d.data(); const { password, ...safe } = u; return safe; });
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u => u.displayName?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
    }
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = users.length; const start = (page - 1) * limit;
    return { users: users.slice(start, start + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async suspendUser(userId) {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) throw new AppError('User not found.', 404);
    await db.collection('users').doc(userId).update({ suspended: true, updatedAt: new Date().toISOString() });
    await db.collection('systemLogs').add({ type: 'user_suspended', userId, createdAt: new Date().toISOString() });
    return { message: 'User suspended.' };
  }

  async unsuspendUser(userId) {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) throw new AppError('User not found.', 404);
    await db.collection('users').doc(userId).update({ suspended: false, updatedAt: new Date().toISOString() });
    return { message: 'User unsuspended.' };
  }

  async deleteUser(userId) {
    await db.collection('users').doc(userId).delete();
    await db.collection('streaks').doc(userId).delete();
    await db.collection('systemLogs').add({ type: 'user_deleted', userId, createdAt: new Date().toISOString() });
    return { message: 'User deleted.' };
  }

  async getAllShops({ page = 1, limit = 10, approved, suspended, search }) {
    const snapshot = await db.collection('shops').get();
    let shops = snapshot.docs.map(d => d.data());
    if (approved !== undefined) shops = shops.filter(s => s.approved === (approved === 'true'));
    if (suspended !== undefined) shops = shops.filter(s => s.suspended === (suspended === 'true'));
    if (search) { const s = search.toLowerCase(); shops = shops.filter(sh => sh.name.toLowerCase().includes(s)); }
    const total = shops.length; const start = (page - 1) * limit;
    return { shops: shops.slice(start, start + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async approveShop(shopId) {
    await db.collection('shops').doc(shopId).update({ approved: true, updatedAt: new Date().toISOString() });
    return { message: 'Shop approved.' };
  }

  async suspendShop(shopId) {
    await db.collection('shops').doc(shopId).update({ suspended: true, updatedAt: new Date().toISOString() });
    return { message: 'Shop suspended.' };
  }

  async getSystemLogs({ page = 1, limit = 20 }) {
    const snapshot = await db.collection('systemLogs').get();
    let logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = logs.length; const start = (page - 1) * limit;
    return { logs: logs.slice(start, start + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}

export default new AdminService();
