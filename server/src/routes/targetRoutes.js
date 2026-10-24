import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTargets,
  getTargetById,
  createTarget,
  updateTarget,
  deleteTarget
} from '../controllers/targetController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', getTargets);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Target name is required').isLength({ max: 120 }),
    body('baseUrl').trim().notEmpty().withMessage('Base URL is required'),
    body('environment').optional().isIn(['development', 'staging', 'production', 'other']),
    body('authorizationConfirmed').isBoolean().custom(val => val === true).withMessage('Explicit authorization confirmation is required')
  ],
  validate,
  createTarget
);

router.get('/:id', getTargetById);

router.patch(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('environment').optional().isIn(['development', 'staging', 'production', 'other'])
  ],
  validate,
  updateTarget
);

router.delete('/:id', deleteTarget);

export default router;
