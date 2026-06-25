import { Router } from 'express';

import {
  createConversation,
  createDirectConversation,
  getMessages,
  listConversations,
  markConversationRead,
  scheduleInterview,
  sendMessage,
  sendTyping,
} from '../controllers/message.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { messageFileUpload } from '../middlewares/upload.js';

const router = Router();

// Only the two human roles take part in messaging.
router.use(requireAuth, requireRole('candidate', 'client'));

router.get('/', listConversations);
router.post('/', createConversation);
// Recruiter → candidate direct chat from search (no application needed).
router.post('/direct', createDirectConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', messageFileUpload.single('file'), sendMessage);
router.post('/:id/typing', sendTyping);
router.post('/:id/read', markConversationRead);
router.post('/:id/interview', scheduleInterview);

export default router;
