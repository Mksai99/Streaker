import { Router } from 'express';
import analyticsService from '../services/analytics.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/shop/:shopId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const analytics = await analyticsService.getShopAnalytics(req.params.shopId, req.user.uid);
    res.json({ success: true, data: analytics });
  } catch (err) { next(err); }
});

router.get('/customer', authenticate, async (req, res, next) => {
  try {
    const analytics = await analyticsService.getCustomerAnalytics(req.user.uid);
    res.json({ success: true, data: analytics });
  } catch (err) { next(err); }
});

router.get('/platform', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const analytics = await analyticsService.getPlatformAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) { next(err); }
});

export default router;
