import { Router } from 'express';
import authService from '../services/auth.service.js';
import otpService from '../services/otp.service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const result = await authService.registerWithEmail(req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const result = await authService.loginWithEmail(req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Login/Register with Google
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid: { type: string }
 *               email: { type: string }
 *               displayName: { type: string }
 *               avatar: { type: string }
 *               role: { type: string, enum: [customer, shopOwner] }
 */
router.post('/google', async (req, res, next) => {
  try {
    const { uid, email, displayName, avatar, role } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ success: false, error: 'Google user info is required' });
    }
    const result = await authService.loginWithGoogle({ uid, email, displayName, avatar, role });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.uid, req.user.role);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const profile = await authService.updateProfile(req.user.uid, req.user.role, req.body);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.uid, req.user.role, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
