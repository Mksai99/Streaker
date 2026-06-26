import { db } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';

class NotificationService {
  async getByUser(userId, { page = 1, limit = 20, unreadOnly = false }) {
    let query = db.collection('notifications').where('userId', '==', userId);
    if (unreadOnly) query = query.where('read', '==', false);
    const snapshot = await query.get();
    let notifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = notifications.length;
    const start = (page - 1) * limit;
    const unreadCount = notifications.filter(n => !n.read).length;
    return { notifications: notifications.slice(start, start + limit), unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async markAsRead(notificationId, userId) {
    const snapshot = await db.collection('notifications').where('userId', '==', userId).get();
    const doc = snapshot.docs.find(d => d.id === notificationId);
    if (!doc) throw new AppError('Notification not found.', 404);
    await db.collection('notifications').doc(notificationId).update({ read: true, readAt: new Date().toISOString() });
    return { message: 'Marked as read.' };
  }

  async markAllAsRead(userId) {
    const snapshot = await db.collection('notifications').where('userId', '==', userId).where('read', '==', false).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.update(doc.ref || db.collection('notifications').doc(doc.id), { read: true, readAt: new Date().toISOString() }));
    await batch.commit();
    return { message: `${snapshot.size} notifications marked as read.` };
  }

  async create({ userId, type, title, message, data = {} }) {
    const ref = await db.collection('notifications').add({
      userId, type, title, message, data, read: false, createdAt: new Date().toISOString()
    });
    return { id: ref.id, userId, type, title, message, data, read: false };
  }
}

export default new NotificationService();
