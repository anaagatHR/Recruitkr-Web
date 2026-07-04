import { Router } from 'express';

import {
  adminAssignTask,
  adminDeactivateDepartment,
  adminListDepartments,
  adminListInterns,
  adminSendMessage,
  adminUpdateIntern,
  adminUpsertDepartment,
} from '../controllers/adminIntern.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

// Department + intern management is for admins, super admins, and department heads.
router.use(requireAuth, requireRole('admin', 'super_admin', 'department_head'));

// Departments.
router.get('/departments', adminListDepartments);
router.post('/departments', adminUpsertDepartment);
router.delete('/departments/:id', adminDeactivateDepartment);

// Interns / requests.
router.get('/', adminListInterns);
router.patch('/:userId', adminUpdateIntern);
router.post('/:userId/tasks', adminAssignTask);
router.post('/:userId/messages', adminSendMessage);

export default router;
