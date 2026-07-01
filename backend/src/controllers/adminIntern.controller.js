import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

import { Department } from '../models/Department.js';
import { InternMessage } from '../models/InternMessage.js';
import { InternProfile } from '../models/InternProfile.js';
import { InternTask } from '../models/InternTask.js';
import { User } from '../models/User.js';
import { emitToUser } from '../services/liveUpdate.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword } from '../utils/security.js';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializeDepartment = (d) => ({
  id: d._id.toString(),
  name: d.name,
  description: d.description || '',
  headId: d.headId ? d.headId.toString() : null,
  headName: d.headName || '',
  isActive: d.isActive !== false,
});

/** GET /admin/interns/departments — all departments (admin view). */
export const adminListDepartments = asyncHandler(async (_req, res) => {
  const departments = await Department.find({}).sort({ name: 1 }).lean().exec();
  res.json({ success: true, data: departments.map(serializeDepartment) });
});

/**
 * POST /admin/interns/departments — create/update a department + its head.
 * Body: { name, description?, headEmail, headName, isActive? }.
 * The head is an existing user with that email, or a new admin user is created
 * (with a temporary password the admin should reset).
 */
export const adminUpsertDepartment = asyncHandler(async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const headEmail = typeof req.body?.headEmail === 'string' ? req.body.headEmail.trim().toLowerCase() : '';
  const headName = typeof req.body?.headName === 'string' ? req.body.headName.trim() : '';
  const isActive = req.body?.isActive === undefined ? true : Boolean(req.body.isActive);
  const tempPassword = typeof req.body?.headPassword === 'string' && req.body.headPassword.length >= 8
    ? req.body.headPassword
    : '';

  if (!name) throw new ApiError(StatusCodes.BAD_REQUEST, 'Department name is required');
  if (!headEmail) throw new ApiError(StatusCodes.BAD_REQUEST, 'Head email is required');

  // Reuse an existing user as the head, or create a new admin user.
  let head = await User.findOne({ email: headEmail }).select('_id role').exec();
  let createdHead = false;
  if (!head) {
    if (!tempPassword) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'No user with that head email exists. Send headPassword (min 8 chars) to create the head account.',
      );
    }
    head = await User.create({
      role: 'admin',
      email: headEmail,
      passwordHash: await hashPassword(tempPassword),
      passwordChangedAt: new Date(),
    });
    createdHead = true;
  }

  const dept = await Department.findOneAndUpdate(
    { name },
    { name, description, headId: head._id, headName: headName || headEmail, isActive },
    { upsert: true, new: true },
  );

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: serializeDepartment(dept),
    meta: { createdHead },
  });
});

/** DELETE /admin/interns/departments/:id — deactivate (soft) a department. */
export const adminDeactivateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid department id');

  const dept = await Department.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();
  if (!dept) throw new ApiError(StatusCodes.NOT_FOUND, 'Department not found');

  res.json({ success: true, data: serializeDepartment(dept) });
});

const serializeInternRow = (profile, user) => ({
  id: profile._id.toString(),
  userId: profile.userId ? profile.userId.toString() : null,
  email: user?.email || '',
  status: profile.status,
  department: profile.department || '',
  designation: profile.designation || '',
  startDate: profile.startDate || null,
  endDate: profile.endDate || null,
  stipend: profile.stipend || '',
  requestNote: profile.requestNote || '',
  requestedAt: profile.requestedAt || null,
});

/**
 * GET /admin/interns — interns/requests for departments this head owns
 * (admins see all). Optional ?status=pending to filter.
 */
export const adminListInterns = asyncHandler(async (req, res) => {
  const statusFilter = typeof req.query?.status === 'string' ? req.query.status : '';
  const query = {};
  if (statusFilter) query.status = statusFilter;
  // A head only sees interns whose head is them; a plain admin sees all.
  const myDepartments = await Department.find({ headId: req.user.id }).select('_id').lean();
  if (myDepartments.length > 0) {
    query.departmentHeadId = req.user.id;
  }

  const profiles = await InternProfile.find(query).sort({ requestedAt: -1 }).limit(200).exec();
  const users = await User.find({ _id: { $in: profiles.map((p) => p.userId) } })
    .select('email')
    .lean();
  const emailById = new Map(users.map((u) => [u._id.toString(), u.email]));

  res.json({
    success: true,
    data: profiles.map((p) => serializeInternRow(p, { email: emailById.get(p.userId.toString()) })),
  });
});

/**
 * PATCH /admin/interns/:userId — approve/reject/manage an intern.
 * Body: { status, designation?, startDate?, endDate?, stipend? }.
 */
export const adminUpdateIntern = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidId(userId)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user id');

  const profile = await InternProfile.findOne({ userId }).exec();
  if (!profile) throw new ApiError(StatusCodes.NOT_FOUND, 'Internship not found');

  const allowed = ['pending', 'active', 'rejected', 'completed', 'paused', 'terminated'];
  const status = typeof req.body?.status === 'string' ? req.body.status : '';
  if (status && !allowed.includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status');
  }

  const wasActive = profile.status === 'active';
  if (status) profile.status = status;
  if (typeof req.body?.designation === 'string') profile.designation = req.body.designation.trim();
  if (typeof req.body?.stipend === 'string') profile.stipend = req.body.stipend.trim();
  if (req.body?.startDate) profile.startDate = new Date(req.body.startDate);
  if (req.body?.endDate) profile.endDate = new Date(req.body.endDate);
  if (status && status !== 'pending') profile.decidedAt = new Date();
  await profile.save();

  // Nudge the candidate's portal to refresh when they get approved.
  if (!wasActive && profile.status === 'active') {
    emitToUser({ userId: profile.userId, event: 'intern-approved', payload: {} });
  }

  res.json({ success: true, data: serializeInternRow(profile, null) });
});

/**
 * POST /admin/interns/:userId/tasks — assign a task to an intern.
 * Body: { title, description?, dueDate?, priority? }.
 */
export const adminAssignTask = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidId(userId)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user id');

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) throw new ApiError(StatusCodes.BAD_REQUEST, 'Task title is required');

  const profile = await InternProfile.findOne({ userId }).select('_id status').exec();
  if (!profile) throw new ApiError(StatusCodes.NOT_FOUND, 'Internship not found');

  const me = await User.findById(req.user.id).select('email').lean();
  const task = await InternTask.create({
    internId: userId,
    assignedById: req.user.id,
    assignedByName: typeof req.body?.assignedByName === 'string' ? req.body.assignedByName.trim() : me?.email || 'Head',
    title,
    description: typeof req.body?.description === 'string' ? req.body.description.trim() : '',
    dueDate: req.body?.dueDate ? new Date(req.body.dueDate) : undefined,
    priority: ['low', 'medium', 'high'].includes(req.body?.priority) ? req.body.priority : 'medium',
    status: 'assigned',
  });

  emitToUser({ userId, event: 'intern-task-assigned', payload: { taskId: task._id.toString() } });

  res.status(StatusCodes.CREATED).json({ success: true, data: { id: task._id.toString(), title: task.title } });
});

/** POST /admin/interns/:userId/messages — head sends a chat message to the intern. */
export const adminSendMessage = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidId(userId)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user id');

  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!body) throw new ApiError(StatusCodes.BAD_REQUEST, 'Message cannot be empty');

  const message = await InternMessage.create({
    internId: userId,
    senderId: req.user.id,
    senderRole: 'head',
    body,
  });

  emitToUser({ userId, event: 'intern-message', payload: {} });

  res.status(StatusCodes.CREATED).json({ success: true, data: { id: message._id.toString() } });
});
