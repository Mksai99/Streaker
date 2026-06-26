import { Router } from 'express';
import reviewService from '../services/review.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Create a review (Customer only)
router.post('/:shopId', authenticate, authorize('customer'), async (req, res, next) => {
  try {
    const review = await reviewService.addReview(req.params.shopId, req.user.uid, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

// Get reviews for a shop (Public)
router.get('/shop/:shopId', async (req, res, next) => {
  try {
    const result = await reviewService.getShopReviews(req.params.shopId, req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Update a review (Customer only)
router.put('/:reviewId', authenticate, authorize('customer'), async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(req.params.reviewId, req.user.uid, req.body);
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
});

// Reply to a review (Shop Owner only)
router.put('/:reviewId/reply/:shopId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const review = await reviewService.replyToReview(req.params.reviewId, req.params.shopId, req.user.uid, req.body.reply);
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
});

export default router;
