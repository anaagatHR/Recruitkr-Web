// Seed the departments (each with a fixed head) that candidates choose from in
// the Intern tab. Idempotent (safe to re-run) — it upserts by department name.
//
//   Local test DB:   node scripts/seedDepartments.js
//   Live / Atlas DB: node scripts/seedDepartments.js --force
//
// SAFETY: without --force the script refuses to run against a non-local
// MONGODB_URI, so you can't seed production by accident. When you DO run it on
// live, first set real head emails/names in DEPARTMENTS below (or better, add a
// "Departments" screen in the admin panel and manage them there). Heads are
// created as admin users with a default password only if they don't exist yet —
// change that password after first login.

import mongoose from 'mongoose';

import { env } from '../src/config/env.js';
import { Department } from '../src/models/Department.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/utils/security.js';

// Edit these before seeding a live DB so the heads are your real people.
const DEPARTMENTS = [
  { name: 'Marketing', description: 'Social media, content, and brand campaigns.', headEmail: 'head.marketing@recruitkr.com', headName: 'Marketing Head' },
  { name: 'Engineering', description: 'Web, backend, and product development.', headEmail: 'head.engineering@recruitkr.com', headName: 'Engineering Head' },
  { name: 'Human Resources', description: 'Recruitment, onboarding, and people ops.', headEmail: 'head.hr@recruitkr.com', headName: 'HR Head' },
  { name: 'Sales', description: 'Client outreach, demos, and closing.', headEmail: 'head.sales@recruitkr.com', headName: 'Sales Head' },
];

const DEFAULT_HEAD_PASSWORD = 'ChangeMe@12345';

const run = async () => {
  const isLocal = /127\.0\.0\.1|localhost/.test(env.MONGODB_URI);
  const forced = process.argv.includes('--force');

  if (!isLocal && !forced) {
    throw new Error(
      `Refusing to seed a non-local database (${env.MONGODB_URI}).\n` +
        'Re-run with --force ONLY after setting real head emails/names in DEPARTMENTS.',
    );
  }

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected to', mongoose.connection.name, isLocal ? '(local)' : '(REMOTE — forced)');

  for (const dept of DEPARTMENTS) {
    // Reuse an existing user with this email as the head; else create one.
    let head = await User.findOne({ email: dept.headEmail }).select('_id');
    if (!head) {
      head = await User.create({
        role: 'admin',
        email: dept.headEmail,
        passwordHash: await hashPassword(DEFAULT_HEAD_PASSWORD),
        passwordChangedAt: new Date(),
      });
      console.log(`   created head user ${dept.headEmail} (password: ${DEFAULT_HEAD_PASSWORD} — change it)`);
    }

    await Department.findOneAndUpdate(
      { name: dept.name },
      { name: dept.name, description: dept.description, headId: head._id, headName: dept.headName, isActive: true },
      { upsert: true, new: true },
    );
    console.log(`✅ Department ready: ${dept.name} (head: ${dept.headName})`);
  }

  console.log('\nDone. Departments seeded with fixed heads.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
