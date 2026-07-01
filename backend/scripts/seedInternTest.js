// One-off seed for LOCAL intern-portal testing (new flow).
//
// Creates:
//   - departments with fixed heads (via seedDepartments logic)
//   - a candidate 'cand.test@recruitkr.local' / 'Cand@12345'
//   - an ACTIVE internship for that candidate under Marketing (so tasks/chat
//     show immediately), plus sample tasks and a welcome message.
//
//   node scripts/seedInternTest.js
//
// Never point this at a production DB — it is meant for mongodb://127.0.0.1.

import mongoose from 'mongoose';

import { env } from '../src/config/env.js';
import { Department } from '../src/models/Department.js';
import { InternMessage } from '../src/models/InternMessage.js';
import { InternProfile } from '../src/models/InternProfile.js';
import { InternTask } from '../src/models/InternTask.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/utils/security.js';

const CAND_EMAIL = 'cand.test@recruitkr.local';
const CAND_PASSWORD = 'Cand@12345';

const run = async () => {
  if (!/127\.0\.0\.1|localhost/.test(env.MONGODB_URI)) {
    throw new Error(`Refusing to seed: MONGODB_URI is not local (${env.MONGODB_URI}).`);
  }

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected to', mongoose.connection.name);

  // Ensure the Marketing department + head exist (seedDepartments creates the
  // full set; here we just make sure Marketing is present for this test).
  let head = await User.findOne({ email: 'head.marketing@recruitkr.local' }).select('_id');
  if (!head) {
    head = await User.create({
      role: 'admin',
      email: 'head.marketing@recruitkr.local',
      passwordHash: await hashPassword('Head@12345'),
      passwordChangedAt: new Date(),
    });
  }
  const dept = await Department.findOneAndUpdate(
    { name: 'Marketing' },
    { name: 'Marketing', description: 'Social media, content, and brand campaigns.', headId: head._id, headName: 'Priya Verma', isActive: true },
    { upsert: true, new: true },
  );

  // Candidate login.
  let cand = await User.findOne({ email: CAND_EMAIL }).select('_id');
  if (!cand) {
    cand = await User.create({
      role: 'candidate',
      email: CAND_EMAIL,
      passwordHash: await hashPassword(CAND_PASSWORD),
      passwordChangedAt: new Date(),
    });
  }

  // Clear this candidate's prior internship data, then make an ACTIVE internship.
  await InternTask.deleteMany({ internId: cand._id });
  await InternMessage.deleteMany({ internId: cand._id });
  await InternProfile.deleteMany({ userId: cand._id });

  await InternProfile.create({
    userId: cand._id,
    departmentId: dept._id,
    department: dept.name,
    departmentHeadId: head._id,
    departmentHeadName: dept.headName,
    status: 'active',
    designation: 'Marketing Intern',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-08-31'),
    stipend: '₹8,000 / month',
    requestedAt: new Date('2026-05-25'),
    decidedAt: new Date('2026-05-27'),
  });

  await InternTask.create([
    {
      internId: cand._id,
      assignedById: head._id,
      assignedByName: dept.headName,
      title: 'Design Instagram poster for launch',
      description: 'Create a 1080x1080 poster for the product launch. Use brand colours.',
      dueDate: new Date('2026-07-10'),
      priority: 'high',
      status: 'assigned',
    },
    {
      internId: cand._id,
      assignedById: head._id,
      assignedByName: dept.headName,
      title: 'Write a 500-word blog draft',
      description: 'Topic: "How RecruitKr helps freshers". Keep it simple and friendly.',
      dueDate: new Date('2026-07-15'),
      priority: 'medium',
      status: 'assigned',
    },
  ]);

  await InternMessage.create({
    internId: cand._id,
    senderId: head._id,
    senderRole: 'head',
    body: 'Welcome to the Marketing team! Check your assigned tasks and reach out anytime.',
  });

  console.log('\n✅ Seed complete. Log in as a CANDIDATE:');
  console.log('   Email   :', CAND_EMAIL);
  console.log('   Password:', CAND_PASSWORD);
  console.log('   Then open the "Intern" tab — an ACTIVE internship with tasks + chat is ready.');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
