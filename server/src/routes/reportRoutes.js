import { Router } from 'express';
import { getAssessmentJsonReport, getAssessmentPdfReport } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/:assessmentId/json', getAssessmentJsonReport);
router.get('/:assessmentId/pdf', getAssessmentPdfReport);

export default router;
