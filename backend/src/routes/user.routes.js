import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { db } from '../config/firebase.js';

const router = Router();

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'User not found' });
    const { password, ...user } = doc.data();
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.get('/:id/streak', authenticate, async (req, res, next) => {
  try {
    const doc = await db.collection('streaks').doc(req.params.id).get();
    res.json({ success: true, data: doc.exists ? doc.data() : { currentStreak: 0, longestStreak: 0 } });
  } catch (err) { next(err); }
});

export default router;
