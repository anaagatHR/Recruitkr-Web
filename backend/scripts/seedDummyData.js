import mongoose from 'mongoose';

import { connectDb } from '../src/config/db.js';
import { Application } from '../src/models/Application.js';
import { BlogPost } from '../src/models/BlogPost.js';
import { CandidateProfile } from '../src/models/CandidateProfile.js';
import { ClientProfile } from '../src/models/ClientProfile.js';
import { ContactMessage } from '../src/models/ContactMessage.js';
import { JobRequirement } from '../src/models/JobRequirement.js';
import { Resume } from '../src/models/Resume.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/utils/security.js';

const PASSWORD = 'Password@123';

const dropStaleIndexes = async () => {
  const users = mongoose.connection.db.collection('users');
  const indexes = await users.indexes();
  const staleUserIdIndex = indexes.find((index) => index.name === 'id_1' && index.key?.id === 1);

  if (staleUserIdIndex) {
    await users.dropIndex('id_1');
    console.log('Dropped stale users.id_1 index.');
  }
};

const ensureUser = async ({ email, mobile, role }) => {
  const passwordHash = await hashPassword(PASSWORD);

  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        role,
        email,
        mobile,
        passwordHash,
        passwordChangedAt: new Date(),
      },
      $unset: {
        refreshTokenHash: '',
        refreshTokenJti: '',
        refreshTokenExpiresAt: '',
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

const seed = async () => {
  await connectDb();
  await dropStaleIndexes();

  const [candidate, candidateTwo, client, admin] = await Promise.all([
    ensureUser({
      role: 'candidate',
      email: 'candidate@recruitkr.test',
      mobile: '9876543210',
    }),
    ensureUser({
      role: 'candidate',
      email: 'candidate2@recruitkr.test',
      mobile: '9876543211',
    }),
    ensureUser({
      role: 'client',
      email: 'client@recruitkr.test',
      mobile: '9876543220',
    }),
    ensureUser({
      role: 'admin',
      email: 'admin@recruitkr.test',
      mobile: '9876543230',
    }),
  ]);

  await Promise.all([
    CandidateProfile.findOneAndUpdate(
      { userId: candidate._id },
      {
        $set: {
          userId: candidate._id,
          fullName: 'Aarav Sharma',
          dateOfBirth: new Date('1998-03-12'),
          gender: 'Male',
          address: 'Sector 62, Noida',
          pincode: '201301',
          highestQualification: 'B.Tech Computer Science',
          experienceStatus: 'experienced',
          experienceDetails: {
            currentCompany: 'PixelForge Labs',
            designation: 'Frontend Developer',
            totalExperience: '3 years',
            industry: 'Information Technology',
            currentCtcLpa: 7,
            expectedCtcLpa: 11,
            minimumCtcLpa: 9,
            noticePeriod: '30 days',
          },
          preferences: {
            preferredLocation: 'Bengaluru',
            preferredIndustry: 'SaaS',
            preferredRole: 'React Developer',
            workModes: ['Hybrid', 'Remote'],
          },
          summary: 'React developer with strong UI, API integration, and dashboard experience.',
          skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'REST APIs'],
          about: 'React developer with strong UI, API integration, and dashboard experience.',
          city: 'Bengaluru',
          currentCity: 'Noida',
          email: candidate.email,
          isActive: true,
          mobile: candidate.mobile,
          name: 'Aarav Sharma',
          phone: candidate.mobile,
          preferredIndustry: 'SaaS',
          preferredLocation: 'Bengaluru',
          preferredRole: 'React Developer',
          resumePath: 'generated',
          workModes: ['Hybrid', 'Remote'],
          declarationAccepted: true,
          representationAuthorized: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
    CandidateProfile.findOneAndUpdate(
      { userId: candidateTwo._id },
      {
        $set: {
          userId: candidateTwo._id,
          fullName: 'Priya Mehta',
          gender: 'Female',
          highestQualification: 'MBA Human Resources',
          experienceStatus: 'fresher',
          preferences: {
            preferredLocation: 'Pune',
            preferredIndustry: 'Human Resources',
            preferredRole: 'HR Executive',
            workModes: ['On-site', 'Hybrid'],
          },
          summary: 'Entry-level HR candidate with internship experience in recruitment operations.',
          skills: ['Recruitment', 'Excel', 'Communication', 'Screening'],
          about: 'Entry-level HR candidate with internship experience in recruitment operations.',
          city: 'Pune',
          currentCity: 'Pune',
          email: candidateTwo.email,
          isActive: true,
          mobile: candidateTwo.mobile,
          name: 'Priya Mehta',
          phone: candidateTwo.mobile,
          preferredIndustry: 'Human Resources',
          preferredLocation: 'Pune',
          preferredRole: 'HR Executive',
          workModes: ['On-site', 'Hybrid'],
          declarationAccepted: true,
          representationAuthorized: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
    ClientProfile.findOneAndUpdate(
      { userId: client._id },
      {
        $set: {
          userId: client._id,
          companyName: 'NovaTech Solutions',
          industry: 'Software Services',
          companyWebsite: 'https://novatech.example.com',
          companySize: '51-200',
          companyType: 'Private Limited',
          spoc: {
            name: 'Rohan Kapoor',
            designation: 'Talent Acquisition Lead',
            mobile: client.mobile,
            email: client.email,
          },
          commercial: {
            recruitmentModel: 'Contingency',
            replacementPeriod: '60 days',
            paymentTerms: '30 days after joining',
          },
          billing: {
            billingCompanyName: 'NovaTech Solutions Pvt Ltd',
            gstNumber: '09ABCDE1234F1Z5',
            billingAddress: 'Cyber City, Gurugram',
            billingEmail: 'billing@novatech.example.com',
          },
          city: 'Gurugram',
          company: 'NovaTech Solutions',
          contactName: 'Rohan Kapoor',
          description: 'A software services company hiring for product and delivery teams.',
          email: client.email,
          location: 'Gurugram',
          mobile: client.mobile,
          name: 'Rohan Kapoor',
          phone: client.mobile,
          requirements: 'Frontend, backend, QA, and HR hiring support.',
          website: 'https://novatech.example.com',
          declarationAccepted: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
  ]);

  await Resume.findOneAndUpdate(
    { candidateUserId: candidate._id },
    {
      $set: {
        candidateUserId: candidate._id,
        resumeType: 'generated',
        resumeData: {
          name: 'Aarav Sharma',
          summary: 'React developer focused on clean dashboards and API-driven products.',
          skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js'],
          education: [
            {
              degree: 'B.Tech Computer Science',
              institution: 'Delhi Technical Campus',
              year: '2019',
              description: 'Graduated with software engineering specialization.',
            },
          ],
          experience: [
            {
              title: 'Frontend Developer',
              company: 'PixelForge Labs',
              duration: '2021 - Present',
              description: 'Built hiring dashboards, profile flows, and reusable UI components.',
            },
          ],
        },
      },
      $unset: {
        resumeUrl: '',
        resumeFileId: '',
        resumeFileName: '',
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const jobs = await Promise.all([
    JobRequirement.findOneAndUpdate(
      { clientId: client._id, jobTitle: 'Frontend Developer' },
      {
        $set: {
          clientId: client._id,
          title: 'Frontend Developer',
          company: 'NovaTech Solutions',
          location: 'Bengaluru',
          type: 'Full-time',
          category: 'Engineering',
          qualification: 'B.Tech / MCA / equivalent',
          experience: '2-4 years',
          salary: { min: 800000, max: 1400000, currency: 'INR' },
          requirements: ['Strong React skills', 'API integration experience', 'Responsive UI knowledge'],
          responsibilities: ['Build dashboard screens', 'Integrate backend APIs', 'Improve UI performance'],
          skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
          contactEmail: client.email,
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          jobTitle: 'Frontend Developer',
          openings: 3,
          department: 'Engineering',
          jobLocation: 'Bengaluru',
          employmentType: 'Full-time',
          experienceRequired: '2-4 years',
          minCtcLpa: 8,
          maxCtcLpa: 14,
          preferredIndustryBackground: 'SaaS / Product Engineering',
          genderPreference: 'No Preference',
          workModes: ['Hybrid', 'Remote'],
          jobDescription:
            'Build and maintain React-based user interfaces for hiring and analytics products.',
          urgencyLevel: 'High',
          expectedJoiningDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          status: 'active',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
    JobRequirement.findOneAndUpdate(
      { clientId: client._id, jobTitle: 'HR Executive' },
      {
        $set: {
          clientId: client._id,
          title: 'HR Executive',
          company: 'NovaTech Solutions',
          location: 'Pune',
          type: 'Full-time',
          category: 'Human Resources',
          qualification: 'MBA HR / Graduate',
          experience: '0-2 years',
          salary: { min: 300000, max: 500000, currency: 'INR' },
          requirements: ['Good communication', 'Candidate screening', 'MS Excel basics'],
          responsibilities: ['Screen candidates', 'Coordinate interviews', 'Maintain hiring reports'],
          skills: ['Recruitment', 'Communication', 'Excel'],
          contactEmail: client.email,
          applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          jobTitle: 'HR Executive',
          openings: 2,
          department: 'Human Resources',
          jobLocation: 'Pune',
          employmentType: 'Full-time',
          experienceRequired: '0-2 years',
          minCtcLpa: 3,
          maxCtcLpa: 5,
          preferredIndustryBackground: 'Recruitment / Staffing',
          genderPreference: 'No Preference',
          workModes: ['On-site', 'Hybrid'],
          jobDescription:
            'Support recruitment operations, candidate screening, and interview coordination.',
          urgencyLevel: 'Medium',
          expectedJoiningDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'active',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
    JobRequirement.findOneAndUpdate(
      { clientId: client._id, jobTitle: 'Backend Developer' },
      {
        $set: {
          clientId: client._id,
          title: 'Backend Developer',
          company: 'NovaTech Solutions',
          location: 'Hyderabad',
          type: 'Full-time',
          category: 'Engineering',
          qualification: 'B.Tech / MCA / equivalent',
          experience: '3-5 years',
          salary: { min: 1000000, max: 1800000, currency: 'INR' },
          requirements: ['Node.js experience', 'MongoDB knowledge', 'REST API design'],
          responsibilities: ['Build APIs', 'Optimize database queries', 'Own backend reliability'],
          skills: ['Node.js', 'Express', 'MongoDB', 'JWT'],
          contactEmail: client.email,
          applicationDeadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
          jobTitle: 'Backend Developer',
          openings: 2,
          department: 'Engineering',
          jobLocation: 'Hyderabad',
          employmentType: 'Full-time',
          experienceRequired: '3-5 years',
          minCtcLpa: 10,
          maxCtcLpa: 18,
          preferredIndustryBackground: 'SaaS / API Platforms',
          genderPreference: 'No Preference',
          workModes: ['Hybrid'],
          jobDescription:
            'Design and build reliable Node.js APIs for recruitment platform workflows.',
          urgencyLevel: 'High',
          expectedJoiningDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'active',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
  ]);

  await Promise.all([
    Application.findOneAndUpdate(
      { candidateId: candidate._id, jobId: jobs[0]._id },
      {
        $set: {
          candidateId: candidate._id,
          clientId: client._id,
          jobId: jobs[0]._id,
          sourceJobSnapshot: {
            jobTitle: jobs[0].jobTitle,
            jobLocation: jobs[0].jobLocation,
            employmentType: jobs[0].employmentType,
            companyName: jobs[0].company,
          },
          fullName: 'Aarav Sharma',
          email: candidate.email,
          phone: candidate.mobile,
          qualification: 'B.Tech Computer Science',
          college: 'Delhi Technical Campus',
          currentCity: 'Noida',
          experience: [{ jobProfile: 'Frontend Developer' }],
          resumePath: 'generated',
          hasCustomResume: false,
          submittedAt: new Date(),
          notes: 'Seeded candidate application for dashboard testing.',
          appliedFor: jobs[0].jobTitle,
          status: 'interview',
          statusNote: 'Interview scheduled by seeded client.',
          statusUpdatedAt: new Date(),
          interviewDetails: {
            scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            timezone: 'Asia/Kolkata',
            mode: 'google-meet',
            meetingLink: 'https://meet.google.com/demo-seed-link',
            contactPerson: 'Rohan Kapoor',
            contactEmail: client.email,
            contactPhone: client.mobile,
            notes: 'Seed interview round for frontend role.',
          },
          timeline: [
            {
              status: 'applied',
              note: 'Application submitted successfully.',
              changedByRole: 'candidate',
              changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
            {
              status: 'interview',
              note: 'Interview scheduled by employer.',
              changedByRole: 'client',
              changedAt: new Date(),
            },
          ],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
    Application.findOneAndUpdate(
      { candidateId: candidateTwo._id, jobId: jobs[1]._id },
      {
        $set: {
          candidateId: candidateTwo._id,
          clientId: client._id,
          jobId: jobs[1]._id,
          sourceJobSnapshot: {
            jobTitle: jobs[1].jobTitle,
            jobLocation: jobs[1].jobLocation,
            employmentType: jobs[1].employmentType,
            companyName: jobs[1].company,
          },
          fullName: 'Priya Mehta',
          email: candidateTwo.email,
          phone: candidateTwo.mobile,
          qualification: 'MBA Human Resources',
          college: 'Pune Business School',
          currentCity: 'Pune',
          experience: [{ jobProfile: 'HR Intern' }],
          resumePath: '',
          hasCustomResume: false,
          submittedAt: new Date(),
          notes: 'Seeded fresher HR application.',
          appliedFor: jobs[1].jobTitle,
          status: 'under-review',
          statusNote: 'Profile shortlisted for recruiter review.',
          statusUpdatedAt: new Date(),
          timeline: [
            {
              status: 'applied',
              note: 'Application submitted successfully.',
              changedByRole: 'candidate',
              changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
              status: 'under-review',
              note: 'Application moved to review.',
              changedByRole: 'client',
              changedAt: new Date(),
            },
          ],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
  ]);

  await BlogPost.findOneAndUpdate(
    { slug: 'how-to-prepare-for-a-frontend-interview' },
    {
      $set: {
        title: 'How to Prepare for a Frontend Interview',
        slug: 'how-to-prepare-for-a-frontend-interview',
        excerpt: 'A practical checklist for candidates preparing for React and frontend roles.',
        authorName: 'RecruitKr Editorial',
        content: [
          'Start with fundamentals: semantic HTML, layout, state management, and browser behavior.',
          'Practice explaining tradeoffs clearly. Hiring teams value reasoning as much as syntax.',
          'Prepare two real projects where you can discuss decisions, constraints, and outcomes.',
        ],
        contentHtml:
          '<p>Start with fundamentals: semantic HTML, layout, state management, and browser behavior.</p><p>Practice explaining tradeoffs clearly. Hiring teams value reasoning as much as syntax.</p>',
        tags: ['Career', 'Interview', 'Frontend'],
        readingTime: '4 min read',
        status: 'published',
        publishedAt: new Date(),
        authorId: admin._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await Promise.all([
    ContactMessage.findOneAndUpdate(
      { email: 'founder@example.com', message: 'Need hiring support for five frontend roles.' },
      {
        $set: {
          name: 'Neha Founder',
          email: 'founder@example.com',
          mobile: '9876500011',
          message: 'Need hiring support for five frontend roles.',
          status: 'unread',
          readAt: null,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
    ContactMessage.findOneAndUpdate(
      { email: 'candidate.help@example.com', message: 'Please help me update my candidate profile.' },
      {
        $set: {
          name: 'Vikram Candidate',
          email: 'candidate.help@example.com',
          mobile: '9876500022',
          message: 'Please help me update my candidate profile.',
          status: 'read',
          readAt: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
  ]);

  const summary = {
    users: await User.countDocuments({
      email: {
        $in: [
          'candidate@recruitkr.test',
          'candidate2@recruitkr.test',
          'client@recruitkr.test',
          'admin@recruitkr.test',
        ],
      },
    }),
    candidateProfiles: await CandidateProfile.countDocuments({
      userId: { $in: [candidate._id, candidateTwo._id] },
    }),
    clientProfiles: await ClientProfile.countDocuments({ userId: client._id }),
    jobs: await JobRequirement.countDocuments({ clientId: client._id }),
    applications: await Application.countDocuments({ clientId: client._id }),
    blogPosts: await BlogPost.countDocuments({ slug: 'how-to-prepare-for-a-frontend-interview' }),
    contactMessages: await ContactMessage.countDocuments({
      email: { $in: ['founder@example.com', 'candidate.help@example.com'] },
    }),
  };

  console.log('Dummy data seeded successfully.');
  console.table(summary);
  console.log('Test login password for all seeded accounts:', PASSWORD);
  console.log('Candidate:', candidate.email);
  console.log('Candidate 2:', candidateTwo.email);
  console.log('Client:', client.email);
  console.log('Admin:', admin.email);
};

seed()
  .catch((error) => {
    console.error('Failed to seed dummy data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
