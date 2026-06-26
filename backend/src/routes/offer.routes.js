import { Router } from 'express';
import offerService from '../services/offer.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/:shopId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await offerService.create(req.params.shopId, req.user.uid, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/shop/:shopId', async (req, res, next) => {
  try {
    const result = await offerService.getOffers(req.params.shopId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await offerService.update(req.params.id, req.user.uid, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await offerService.delete(req.params.id, req.user.uid);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
