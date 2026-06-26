import { Router } from 'express';
import galleryService from '../services/gallery.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Add image to gallery (Shop Owner only)
router.post('/:shopId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const image = await galleryService.addImage(req.params.shopId, req.user.uid, req.body);
    res.status(201).json({ success: true, data: image });
  } catch (err) { next(err); }
});

// Get gallery images for a shop (Public)
router.get('/:shopId', async (req, res, next) => {
  try {
    const gallery = await galleryService.getGallery(req.params.shopId);
    res.json({ success: true, data: gallery });
  } catch (err) { next(err); }
});

// Update image details (caption, display order)
router.put('/:shopId/:imageId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const image = await galleryService.updateImage(req.params.shopId, req.params.imageId, req.user.uid, req.body);
    res.json({ success: true, data: image });
  } catch (err) { next(err); }
});

// Delete image
router.delete('/:shopId/:imageId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await galleryService.deleteImage(req.params.shopId, req.params.imageId, req.user.uid);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
