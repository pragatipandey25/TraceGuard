import { Router } from 'express';
import { getDashboardSummary, getDashboardTrends } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', getDashboardSummary);
router.get('/trends', getDashboardTrends);

export default router;
