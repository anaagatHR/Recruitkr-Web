import mongoose from 'mongoose';

/**
 * A department a candidate can request to intern under. Each department has ONE
 * fixed Department Head (a User, usually admin/client). When a candidate picks a
 * department, their internship request goes to that department's head, who
 * approves it and then manages the intern (dates, stipend, status, tasks, chat).
 *
 * Departments are managed from the admin panel; a seed script creates a starter
 * set for local testing.
 */
const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, unique: true },
    // Optional short description shown to the candidate when choosing.
    description: { type: String, trim: true, default: '' },

    // The fixed head of this department.
    headId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    headName: { type: String, trim: true, default: '' },

    // Hide a department from the chooser without deleting it.
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Department = mongoose.model('Department', departmentSchema);
