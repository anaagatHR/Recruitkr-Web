import { StatusCodes } from 'http-status-codes';

import { env } from '../config/env.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { Conversation } from '../models/Conversation.js';
import { Department } from '../models/Department.js';
import { InternProfile } from '../models/InternProfile.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword } from '../utils/security.js';

/**
 * POST /internal/interns/provision — called by the RecruitKr CRM when a
 * candidate is promoted to intern ("Make Intern"). Creates everything the
 * intern needs to sign in on THIS site and land on an already-approved
 * internship: a candidate User (with this backend's peppered password hash),
 * a CandidateProfile (which assigns the RecruitKr ID), and an ACTIVE
 * InternProfile in the given department.
 *
 * Guarded by the shared INTERNAL_PROVISION_KEY header — the CRM and this
 * backend must agree on it. Idempotent: re-provisioning the same email
 * updates the password and re-activates the internship.
 */
export const provisionIntern = asyncHandler(async (req, res) => {
  if (!env.INTERNAL_PROVISION_KEY) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      'Intern provisioning is not configured (INTERNAL_PROVISION_KEY missing)',
    );
  }
  if (req.get('x-internal-key') !== env.INTERNAL_PROVISION_KEY) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid internal key');
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const departmentName = typeof req.body?.department === 'string' ? req.body.department.trim() : '';

  if (!email || !name || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'name, email and password are required');
  }

  // The `users` collection is shared with the CRM, so the doc may already
  // exist (the CRM writes its own snake_case fields to it). Layer the fields
  // this backend needs on top instead of failing on the unique email index.
  const passwordHash = await hashPassword(password);
  let user = await User.findOne({ email }).select('+passwordHash').exec();
  if (user) {
    if (user.role === 'client' || user.role === 'admin') {
      throw new ApiError(StatusCodes.CONFLICT, 'Email belongs to a non-candidate account');
    }
    await User.updateOne(
      { _id: user._id },
      { $set: { role: 'candidate', authProvider: 'local', passwordHash } },
    ).exec();
  } else {
    user = await User.create({ role: 'candidate', email, passwordHash });
  }

  let profile = await CandidateProfile.findOne({ userId: user._id }).exec();
  if (!profile) {
    profile = new CandidateProfile({ userId: user._id, fullName: name, name, email });
  } else if (!profile.fullName) {
    profile.fullName = name;
  }
  await profile.save(); // pre-save hook assigns recruitkrId if missing

  const department = departmentName
    ? await Department.findOne({ name: new RegExp(`^${departmentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).exec()
    : null;

  const internFields = {
    status: 'active',
    department: department?.name || departmentName,
    departmentId: department?._id || null,
    departmentHeadId: department?.headId || null,
    departmentHeadName: department?.headName || '',
    designation: 'Intern',
    decidedAt: new Date(),
  };
  let intern = await InternProfile.findOne({ userId: user._id }).exec();
  if (intern) {
    Object.assign(intern, internFields);
    if (!intern.startDate) intern.startDate = new Date();
    await intern.save();
  } else {
    intern = await InternProfile.create({
      userId: user._id,
      ...internFields,
      startDate: new Date(),
      requestNote: 'Provisioned from CRM (Make Intern)',
    });
  }

  // Drop the credentials into the intern's website inbox (dashboard → Messages)
  // as a normal chat message from the RecruitKr admin, so they keep an
  // in-dashboard copy. Best-effort: provisioning already succeeded.
  let inboxSent = false;
  let inboxError = '';
  try {
    const sender = await User.findOne({ role: 'admin' }).select('_id').lean().exec();
    if (!sender) throw new Error('no admin account to send from');
    const loginUrl = `${env.FRONTEND_URL}/login`;
    const body = [
      `Welcome to RecruitKr${intern.department ? ` — ${intern.department} internship` : ''}! Your account is ready.`,
      profile.recruitkrId ? `RecruitKr ID: ${profile.recruitkrId}` : null,
      `Email: ${email}`,
      `Password: ${password}`,
      intern.department ? `Department: ${intern.department}` : null,
      `Sign in: ${loginUrl}`,
      'Open the Intern tab in your dashboard to see your tasks and chat.',
    ].filter(Boolean).join('\n');

    const now = new Date();
    let conversation = await Conversation.findOne({
      candidateId: user._id,
      clientId: sender._id,
      applicationId: null,
    }).exec();
    if (!conversation) {
      conversation = await Conversation.create({
        candidateId: user._id,
        clientId: sender._id,
        jobTitle: 'Internship',
        companyName: 'RecruitKr Team',
        candidateName: name,
        systemSeeded: true,
      });
    }
    await Message.create({
      conversationId: conversation._id,
      senderId: sender._id,
      senderRole: 'client',
      messageType: 'text',
      body,
      deliveredAt: now,
    });
    await Conversation.updateOne(
      { _id: conversation._id },
      {
        $set: { lastMessage: body, lastMessageAt: now, lastSenderRole: 'client' },
        $inc: { unreadForCandidate: 1 },
      },
    );
    inboxSent = true;
  } catch (error) {
    inboxError = error?.message || 'inbox message failed';
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      userId: user._id.toString(),
      recruitkrId: profile.recruitkrId || '',
      email,
      department: intern.department || '',
      status: intern.status,
      inboxSent,
      inboxError,
    },
  });
});
