// Seed a starter set of departments (each with a fixed head) for LOCAL testing
// of the intern portal. Heads are created as admin users. Safe to re-run.
//
//   node scripts/seedDepartments.js
//
// In production these departments + heads come from the admin panel.

import mongoose from 'mongoose';

import { env } from '../src/config/env.js';
import { Department } from '../src/models/Department.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/utils/security.js';

const DEPARTMENTS = [
  { name: 'Marketing', description: 'Social media, content, and brand campaigns.', headEmail: 'head.marketing@recruitkr.local', headName: 'Priya Verma' },
  { name: 'Engineering', description: 'Web, backend, and product development.', headEmail: 'head.engineering@recruitkr.local', headName: 'Rahul Sharma' },
  { name: 'Human Resources', description: 'Recruitment, onboarding, and people ops.', headEmail: 'head.hr@recruitkr.local', headName: 'Anjali Mehta' },
  { name: 'Sales', description: 'Client outreach, demos, and closing.', headEmail: 'head.sales@recruitkr.local', headName: 'Vikram Singh' },
];

const run = async () => {
  if (!/127\.0\.0\.1|localhost/.test(env.MONGODB_URI)) {
    throw new Error(`Refusing to seed: MONGODB_URI is not local (${env.MONGODB_URI}).`);
  }

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected to', mongoose.connection.name);

  for (const dept of DEPARTMENTS) {
    // Ensure the head user exists.
    let head = await User.findOne({ email: dept.headEmail }).select('_id');
    if (!head) {
      head = await User.create({
        role: 'admin',
        email: dept.headEmail,
        passwordHash: await hashPassword('Head@12345'),
        passwordChangedAt: new Date(),
      });
    }

    // Upsert the department with its fixed head.
    await Department.findOneAndUpdate(
      { name: dept.name },
      {
        name: dept.name,
        description: dept.description,
        headId: head._id,
        headName: dept.headName,
        isActive: true,
      },
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
