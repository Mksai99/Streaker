import { Router } from 'express';
import adminService from '../services/admin.service.js';
import analyticsService from '../services/analytics.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const adminAuth = [authenticate, authorize('admin')];

router.get('/users', ...adminAuth, async (req, res, next) => {
  try { res.json({ success: true, data: await adminService.getAllUsers(req.query) }); } catch (err) { next(err); }
});

router.put('/users/:id/suspend', ...adminAuth, async (req, res, next) => {
  try { res.json({ success: true, data: await adminService.suspendUser(req.params.id) }); } catch (err) { next(err); }
});

router.put('/users/:id/unsuspend', ...adminAuth, async (req, res, next) => {
  try { res.json({ success: true, data: await adminService.unsuspendUser(req.params.id) }); } catch (err) { next(err); }
});

router.delete('/users/:id', ...adminAuth, async (req, res, next) => {
  try { res.json({ success: true, data: await adminService.deleteUser(req.params.id) }); } catch (err) { next(err); }
});

router.get('/shops', ...adminAuth, async (req, res, next) => {
  try { res.json({ success: true, data: await adminService.getAllShops(req.query) }); } catch (err) { next(err); }
});

router.put('/shops/:id/approve', ...adminAuth, async (req, res, next) => {
  try { res.json({ success: true, data: await adminService.approveShop(req.params.id) }); } catch (err) { next(err); }
});

router.put('/shops/:id/suspend', ...adminAuth, async (req, res, next) => {
  try { res.json({ success: true, data: await adminService.suspendShop(req.params.id) }); } catch (err) { next(err); }
});

router.get('/analytics', ...adminAuth, async (req, res, next) => {
  try { res.json({ success: true, data: await analyticsService.getPlatformAnalytics() }); } catch (err) { next(err); }
});

router.get('/logs', ...adminAuth, async (req, res, next) => {
  try { res.json({ success: true, data: await adminService.getSystemLogs(req.query) }); } catch (err) { next(err); }
});

export default router;
