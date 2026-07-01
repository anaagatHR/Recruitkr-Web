import { Router } from 'express';

import { downloadResumeById } from '../controllers/resume.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

import adminInternRoutes from './adminIntern.routes.js';
import assistantRoutes from './assistant.routes.js';
import authRoutes from './auth.routes.js';
import blogRoutes from './blog.routes.js';
import contactRoutes from './contact.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import internRoutes from './intern.routes.js';
import jobsRoutes from './jobs.routes.js';
import messageRoutes from './message.routes.js';
import resumeRoutes from './resume.routes.js';
import searchRoutes from './search.routes.js';
import uploadRoutes from './upload.routes.js';
import videoRoutes from './video.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Recruitkr API is running' });
});
router.get('/ping', (_req, res) => {
  res.json({ success: true, message: 'pong' });
});
router.get(
  '/resume/download/:id',
  requireAuth,
  requireRole('candidate', 'client', 'admin'),
  downloadResumeById,
);

router.use('/auth', authRoutes);
router.use('/assistant', assistantRoutes);
router.use('/blogs', blogRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobsRoutes);
router.use('/search', searchRoutes);
router.use('/videos', videoRoutes);
router.use('/resumes', resumeRoutes);
router.use('/dashboards', dashboardRoutes);
router.use('/interns', internRoutes);
router.use('/admin/interns', adminInternRoutes);
router.use('/contact', contactRoutes);
router.use('/conversations', messageRoutes);
router.use('/uploads', uploadRoutes);

export default router;
