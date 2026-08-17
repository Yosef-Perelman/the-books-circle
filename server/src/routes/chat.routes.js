import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { handleChatCtrl } from '../controllers/chat.controller.js';

const router = express.Router();

router.use(requireAuth);
router.post('/', handleChatCtrl);

export default router;
