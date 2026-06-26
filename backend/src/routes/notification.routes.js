import { Router } from 'express';
import notificationService from '../services/notification.service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await notificationService.getByUser(req.user.uid, req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user.uid);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.uid);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
