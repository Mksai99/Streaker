import { Router } from 'express';
import productService from '../services/product.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// --- CATEGORIES ---
router.post('/categories/:shopId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await productService.createCategory(req.params.shopId, req.user.uid, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/categories/:shopId', async (req, res, next) => {
  try {
    const result = await productService.getCategories(req.params.shopId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.put('/categories/:id', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await productService.updateCategory(req.params.id, req.user.uid, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.delete('/categories/:id', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await productService.deleteCategory(req.params.id, req.user.uid);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// --- PRODUCTS ---
router.post('/:shopId', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await productService.createProduct(req.params.shopId, req.user.uid, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/shop/:shopId', async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.params.shopId, req.query.categoryId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await productService.updateProduct(req.params.id, req.user.uid, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('shopOwner'), async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id, req.user.uid);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
