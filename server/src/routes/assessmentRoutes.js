import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAssessments,
  getAssessmentById,
  createAssessment,
  cancelAssessmentHandler,
  getAssessmentFindings,
  compareAssessments
} from '../controllers/assessmentController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { scanLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth);

router.get('/', getAssessments);
router.get('/compare', compareAssessments);

router.post(
  '/',
  scanLimiter,
  [body('targetId').notEmpty().withMessage('Target ID is required')],
  validate,
  createAssessment
);

router.get('/:id', getAssessmentById);
router.post('/:id/cancel', cancelAssessmentHandler);
router.get('/:id/findings', getAssessmentFindings);

export default router;
