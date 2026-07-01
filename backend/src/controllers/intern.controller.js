import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

import { Department } from '../models/Department.js';
import { InternMessage } from '../models/InternMessage.js';
import { InternProfile } from '../models/InternProfile.js';
import { InternTask } from '../models/InternTask.js';
import { User } from '../models/User.js';
import { uploadBufferToImageKit } from '../services/imagekit.js';
import { emitToUser } from '../services/liveUpdate.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializeProfile = (profile, user) => {
  if (!profile) {
    // No internship yet — the candidate can request one.
    return { status: 'none', email: user?.email || '' };
  }
  return {
    id: profile._id.toString(),
    status: profile.status,
    email: user?.email || '',
    department: profile.department || '',
    departmentId: profile.departmentId ? profile.departmentId.toString() : null,
    designation: profile.designation || '',
    startDate: profile.startDate || null,
    endDate: profile.endDate || null,
    stipend: profile.stipend || '',
    requestNote: profile.requestNote || '',
    requestedAt: profile.requestedAt || null,
    decidedAt: profile.decidedAt || null,
    departmentHead: {
      id: profile.departmentHeadId ? profile.departmentHeadId.toString() : null,
      name: profile.departmentHeadName || '',
    },
  };
};

const serializeTask = (task) => ({
  id: task._id.toString(),
  title: task.title,
  description: task.description || '',
  dueDate: task.dueDate || null,
  priority: task.priority || 'medium',
  status: task.status || 'assigned',
  assignedByName: task.assignedByName || '',
  submissions: (task.submissions || []).map((s) => ({
    url: s.url,
    name: s.name,
    type: s.type,
    size: s.size,
    uploadedAt: s.uploadedAt,
  })),
  submissionNote: task.submissionNote || '',
  submittedAt: task.submittedAt || null,
  reviewNote: task.reviewNote || '',
  reviewedAt: task.reviewedAt || null,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const serializeMessage = (msg, userId) => ({
  id: msg._id.toString(),
  senderRole: msg.senderRole,
  mine: msg.senderId.toString() === String(userId),
  body: msg.body || '',
  readAt: msg.readAt || null,
  createdAt: msg.createdAt,
});

/** Require the requesting user to have an ACTIVE internship; else 403. */
const requireActiveInternship = async (userId) => {
  const profile = await InternProfile.findOne({ userId }).exec();
  if (!profile || profile.status !== 'active') {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Your internship is not active yet. Tasks and chat unlock after your Department Head approves.',
    );
  }
  return profile;
};

/** GET /interns/me — the candidate's internship status + details. */
export const getMe = asyncHandler(async (req, res) => {
  const [profile, user] = await Promise.all([
    InternProfile.findOne({ userId: req.user.id }).exec(),
    User.findById(req.user.id).select('email').lean().exec(),
  ]);
  res.json({ success: true, data: serializeProfile(profile, user) });
});

/** GET /interns/departments — active departments a candidate can request. */
export const listDepartments = asyncHandler(async (_req, res) => {
  const departments = await Department.find({ isActive: true })
    .select('name description headName')
    .sort({ name: 1 })
    .lean()
    .exec();

  res.json({
    success: true,
    data: departments.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      description: d.description || '',
      headName: d.headName || '',
    })),
  });
});

/**
 * POST /interns/request — candidate requests to intern under a department.
 * Body: { departmentId, note? }. Creates a pending InternProfile whose head is
 * the department's fixed head. The head approves it from the admin panel.
 */
export const requestInternship = asyncHandler(async (req, res) => {
  const departmentId = typeof req.body?.departmentId === 'string' ? req.body.departmentId : '';
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';

  if (!isValidId(departmentId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Please choose a valid department');
  }

  const department = await Department.findOne({ _id: departmentId, isActive: true }).exec();
  if (!department) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Department not found');
  }

  const existing = await InternProfile.findOne({ userId: req.user.id }).exec();
  if (existing && (existing.status === 'pending' || existing.status === 'active')) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      existing.status === 'active'
        ? 'You are already an active intern.'
        : 'You already have a pending internship request.',
    );
  }

  // Reuse the record if the candidate was previously rejected/finished.
  const profile = existing || new InternProfile({ userId: req.user.id });
  profile.departmentId = department._id;
  profile.department = department.name;
  profile.departmentHeadId = department.headId;
  profile.departmentHeadName = department.headName;
  profile.status = 'pending';
  profile.requestNote = note;
  profile.requestedAt = new Date();
  profile.decidedAt = undefined;
  await profile.save();

  // Notify the head (best-effort live update).
  if (department.headId) {
    emitToUser({
      userId: department.headId,
      event: 'intern-request',
      payload: { internId: req.user.id, department: department.name },
    });
  }

  const user = await User.findById(req.user.id).select('email').lean().exec();
  res.status(StatusCodes.CREATED).json({ success: true, data: serializeProfile(profile, user) });
});

/** GET /interns/tasks — tasks assigned to this intern (active only). */
export const listTasks = asyncHandler(async (req, res) => {
  await requireActiveInternship(req.user.id);
  const tasks = await InternTask.find({ internId: req.user.id }).sort({ createdAt: -1 }).exec();
  res.json({ success: true, data: tasks.map(serializeTask) });
});

/** POST /interns/tasks/:id/submit — upload completed work for a task. */
export const submitTask = asyncHandler(async (req, res) => {
  await requireActiveInternship(req.user.id);

  const { id } = req.params;
  if (!isValidId(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid task id');
  }

  const task = await InternTask.findOne({ _id: id, internId: req.user.id }).exec();
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Please attach a file to submit');
  }

  const asset = await uploadBufferToImageKit({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    folder: '/recruitkr/intern-tasks',
  });

  task.submissions.push({
    url: asset.url,
    fileId: asset.fileId,
    name: asset.name || req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
    uploadedAt: new Date(),
  });

  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
  if (note) task.submissionNote = note;
  task.status = 'submitted';
  task.submittedAt = new Date();
  await task.save();

  if (task.assignedById) {
    emitToUser({
      userId: task.assignedById,
      event: 'intern-task-submitted',
      payload: { taskId: task._id.toString(), internId: req.user.id },
    });
  }

  res.status(StatusCodes.CREATED).json({ success: true, data: serializeTask(task) });
});

/** GET /interns/messages — the intern↔head chat thread (active only). */
export const listMessages = asyncHandler(async (req, res) => {
  await requireActiveInternship(req.user.id);

  const messages = await InternMessage.find({ internId: req.user.id }).sort({ createdAt: 1 }).exec();
  await InternMessage.updateMany(
    { internId: req.user.id, senderRole: 'head', readAt: null },
    { $set: { readAt: new Date() } },
  );
  res.json({ success: true, data: messages.map((m) => serializeMessage(m, req.user.id)) });
});

/** POST /interns/messages — intern sends a message to their Department Head. */
export const sendMessage = asyncHandler(async (req, res) => {
  const profile = await requireActiveInternship(req.user.id);

  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!body) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Message cannot be empty');
  }

  const message = await InternMessage.create({
    internId: req.user.id,
    senderId: req.user.id,
    senderRole: 'intern',
    body,
  });

  if (profile.departmentHeadId) {
    emitToUser({
      userId: profile.departmentHeadId,
      event: 'intern-message',
      payload: { internId: req.user.id, message: serializeMessage(message, profile.departmentHeadId) },
    });
  }

  res.status(StatusCodes.CREATED).json({ success: true, data: serializeMessage(message, req.user.id) });
});
