import { Router } from 'express';
import rewardService from '../services/reward.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/:shopId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const reward = await rewardService.create(req.params.shopId, req.user.uid, req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (err) { next(err); }
});

router.get('/shop/:shopId', async (req, res, next) => {
  try {
    const result = await rewardService.getByShop(req.params.shopId, req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/user/available', authenticate, async (req, res, next) => {
  try {
    const rewards = await rewardService.getUserRewards(req.user.uid);
    res.json({ success: true, data: rewards });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const reward = await rewardService.getById(req.params.id);
    res.json({ success: true, data: reward });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const reward = await rewardService.update(req.params.id, req.user.uid, req.body);
    res.json({ success: true, data: reward });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await rewardService.delete(req.params.id, req.user.uid);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/:id/claim', authenticate, authorize('customer'), async (req, res, next) => {
  try {
    const claim = await rewardService.claim(req.params.id, req.user.uid);
    res.status(201).json({ success: true, data: claim });
  } catch (err) { next(err); }
});

router.get('/claims/:shopId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await rewardService.getClaimsByShop(req.params.shopId, req.user.uid, req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.put('/claims/:claimId/approve', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await rewardService.approveClaim(req.params.claimId, req.user.uid);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
