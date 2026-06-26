import { Router } from 'express';
import shopService from '../services/shop.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const shop = await shopService.create(req.user.uid, req.body);
    res.status(201).json({ success: true, data: shop });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const result = await shopService.getAll(req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/my-shops', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const shops = await shopService.getByOwnerId(req.user.uid);
    res.json({ success: true, data: shops });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const shop = await shopService.getById(req.params.id);
    res.json({ success: true, data: shop });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const shop = await shopService.update(req.params.id, req.user.uid, req.body);
    res.json({ success: true, data: shop });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await shopService.delete(req.params.id, req.user.uid);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/:id/customers', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await shopService.getCustomers(req.params.id, req.user.uid, req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
