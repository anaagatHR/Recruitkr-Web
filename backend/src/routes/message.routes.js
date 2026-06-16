import { Router } from 'express';

import {
  createConversation,
  getMessages,
  listConversations,
  sendMessage,
} from '../controllers/message.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { secureFileUpload } from '../middlewares/upload.js';

const router = Router();

// Only the two human roles take part in messaging.
router.use(requireAuth, requireRole('candidate', 'client'));

router.get('/', listConversations);
router.post('/', createConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', secureFileUpload.single('file'), sendMessage);

export default router;
