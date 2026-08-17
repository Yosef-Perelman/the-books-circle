import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getUserCtrl } from '../controllers/user.controller.js';

const router = express.Router();

router.use(requireAuth);
router.get('/:id', getUserCtrl);

export default router;
