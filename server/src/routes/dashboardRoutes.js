import { Router } from 'express';
import {
  getDashboardSummary,
  getDashboardTrends,
  getAiStatus,
  testAiConnectionHandler
} from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', getDashboardSummary);
router.get('/trends', getDashboardTrends);
router.get('/ai-status', getAiStatus);
router.post('/ai-test', testAiConnectionHandler);

export default router;
