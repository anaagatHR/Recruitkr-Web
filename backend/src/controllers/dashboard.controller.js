import { Application } from '../models/Application.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { JobRequirement } from '../models/JobRequirement.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import { fetchLegacyApplicationsForClient } from './job.controller.js';

export const candidateDashboard = asyncHandler(async (req, res) => {
  const [applications, profile] = await Promise.all([
    // Read-only: .lean() skips Mongoose document hydration for a faster load.
    Application.find({ candidateId: req.user.id }).populate('jobId').sort({ createdAt: -1 }).lean(),
    // Kept as a full document so the recruitkrId backfill below can .save().
    CandidateProfile.findOne({ userId: req.user.id }),
  ]);

  // Backfill the unique RecruitKr id for profiles created before the field
  // existed; the pre-save hook assigns it. Non-fatal if the save ever fails.
  if (profile && !profile.recruitkrId) {
    try {
      await profile.save();
    } catch (error) {
      console.warn('[dashboard] could not backfill recruitkrId:', error.message);
    }
  }

  const interviewCalls = applications.filter((a) => a.status === 'interview').length;
  const offers = applications.filter((a) => a.status === 'offer' || a.status === 'hired').length;

  res.json({
    success: true,
    data: {
      stats: {
        applicationsSent: applications.length,
        interviewCalls,
        offersReceived: offers,
        profileCompletion: profile ? 72 : 10,
      },
      applications: applications.slice(0, 10),
      profile,
    },
  });
});

export const clientDashboard = asyncHandler(async (req, res) => {
  const [jobs, applications, legacyApplications] = await Promise.all([
    JobRequirement.find({
      clientId: req.user.id,
      sourceCollection: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .lean(),
    Application.find({ clientId: req.user.id }).populate('jobId').sort({ createdAt: -1 }).lean(),
    fetchLegacyApplicationsForClient(req.user.id),
  ]);
  const allApplications = [...applications, ...legacyApplications];

  const activeRequirements = jobs.filter((j) => j.status === 'active').length;
  const interviewsScheduled = allApplications.filter((a) => a.status === 'interview').length;
  const positionsFilled = allApplications.filter((a) => a.status === 'hired').length;

  res.json({
    success: true,
    data: {
      stats: {
        activeRequirements,
        candidatesSourced: allApplications.length,
        interviewsScheduled,
        positionsFilled,
      },
      requirements: jobs.slice(0, 10),
      candidates: allApplications.slice(0, 20),
    },
  });
});

