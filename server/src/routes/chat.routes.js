import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { handleChatCtrl, getChatToolsCtrl } from '../controllers/chat.controller.js';

const router = express.Router();

router.use(requireAuth);
router.post('/', handleChatCtrl);
router.get('/tools', getChatToolsCtrl);

export default router;
