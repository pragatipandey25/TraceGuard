import { Router } from 'express';
import { body } from 'express-validator';
import {
  getFindings,
  getFindingById,
  updateFindingStatus,
  addFindingNote,
  explainFindingHandler
} from '../controllers/findingController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', getFindings);
router.get('/:id', getFindingById);

router.patch(
  '/:id/status',
  [
    body('status').isIn(['Open', 'In Progress', 'Fixed', 'Accepted Risk', 'False Positive']),
    body('reason').optional().isString()
  ],
  validate,
  updateFindingStatus
);

router.post(
  '/:id/notes',
  [body('content').trim().notEmpty().withMessage('Note content cannot be empty').isLength({ max: 1000 })],
  validate,
  addFindingNote
);

router.post('/:id/explain', explainFindingHandler);

export default router;
