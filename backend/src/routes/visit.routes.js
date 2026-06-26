import { Router } from 'express';
import visitService from '../services/visit.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/scan', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const { qrData, shopId } = req.body;
    const result = await visitService.scanQRCode(qrData, shopId, req.user.uid);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/record', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const { shopId, userId } = req.body;
    const result = await visitService.recordVisit(shopId, userId, req.user.uid);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/user/:userId', authenticate, async (req, res, next) => {
  try {
    const result = await visitService.getVisitsByUser(req.params.userId, req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/shop/:shopId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await visitService.getVisitsByShop(req.params.shopId, req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
