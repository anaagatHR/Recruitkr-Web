import { Router } from 'express';

import {
  getMe,
  listDepartments,
  listMessages,
  listTasks,
  requestInternship,
  sendMessage,
  submitTask,
} from '../controllers/intern.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { internTaskUpload } from '../middlewares/upload.js';

const router = Router();

// The intern portal lives inside the candidate dashboard, so a logged-in
// candidate uses it: they choose a department, request an internship, and (once
// their Department Head approves) see tasks and chat.
router.use(requireAuth, requireRole('candidate'));

// Internship status + request flow.
router.get('/me', getMe);
router.get('/departments', listDepartments);
router.post('/request', requestInternship);

// Assigned tasks + submitting completed work against a task (active interns).
router.get('/tasks', listTasks);
router.post('/tasks/:id/submit', internTaskUpload.single('file'), submitTask);

// Chat with the Department Head (active interns).
router.get('/messages', listMessages);
router.post('/messages', sendMessage);

export default router;
