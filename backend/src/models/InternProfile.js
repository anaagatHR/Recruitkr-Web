import mongoose from 'mongoose';

/**
 * Internship record attached to a CANDIDATE user. A candidate does not get a
 * separate account/login to intern — instead they log in normally, open the
 * "Intern" tab, choose a department, and send a request. The department's fixed
 * head then approves it and manages the internship (dates, stipend, status),
 * assigns tasks (InternTask), and chats with the intern (InternMessage).
 *
 * One record per user (a user is an intern in at most one department at a time).
 */
const internProfileSchema = new mongoose.Schema(
  {
    // The candidate this internship belongs to (User with role 'candidate').
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
      index: true,
    },

    // --- Department + head (chosen by the candidate, head is fixed per dept) ---
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    department: { type: String, trim: true, default: '' },
    departmentHeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    departmentHeadName: { type: String, trim: true, default: '' },

    // --- Lifecycle ---
    // pending  = candidate requested, waiting for the head to approve
    // active   = head approved; intern can see tasks and chat
    // rejected = head declined the request
    // completed/paused/terminated = head-managed states after approval
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'completed', 'paused', 'terminated'],
      default: 'pending',
      index: true,
    },

    // --- Details the HEAD manages after approving ---
    designation: { type: String, trim: true, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    stipend: { type: String, trim: true, default: '' },

    // Free-text note the candidate can add when requesting.
    requestNote: { type: String, trim: true, default: '' },
    // Timestamps for the request/decision.
    requestedAt: { type: Date, default: Date.now },
    decidedAt: { type: Date },
  },
  { timestamps: true },
);

export const InternProfile = mongoose.model('InternProfile', internProfileSchema);
