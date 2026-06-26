// Structured website knowledge for the native RecruitKrBot. No external AI —
// answers and navigation are derived entirely from this data. Add pages/FAQs
// here as the product grows; the engine indexes them automatically.

/**
 * @typedef {Object} PageKnowledge
 * @property {string} key       stable id
 * @property {string} title     human title
 * @property {string} route     real app route (used for navigate actions)
 * @property {string} purpose   one-line purpose
 * @property {string} description longer explanation of what's on the page
 * @property {string[]} keywords aliases used to resolve "open X" / "explain X"
 * @property {{q:string,a:string}[]} [faqs] page-specific Q&A
 * @property {boolean} [auth]   true if the page requires login
 */

/** @type {PageKnowledge[]} */
export const PAGES = [
  {
    key: 'home',
    title: 'Home',
    route: '/',
    purpose: 'The RecruitKr landing page.',
    description:
      'Search jobs, see featured roles, candidate video intros, and learn how RecruitKr (Befikr Hiring) connects candidates with companies across India.',
    keywords: ['home', 'landing', 'main page', 'start'],
  },
  {
    key: 'jobs',
    title: 'Jobs',
    route: '/jobs',
    purpose: 'Browse and search verified jobs.',
    description:
      'Search jobs by title, skill, company, location, and type. Open a job to see details and apply in one tap.',
    keywords: ['jobs', 'find jobs', 'browse jobs', 'search jobs', 'openings', 'vacancies', 'careers'],
    faqs: [
      {
        q: 'How do I apply for a job?',
        a: 'Open Jobs, tap a role to view it, then press “Apply”. Your profile and resume are sent to the employer automatically and a chat thread opens so you can talk to them directly. You must be logged in as a candidate to apply.',
      },
      { q: 'How do I filter jobs?', a: 'On the Jobs page, use the search box plus the location, type, and salary filters to narrow results.' },
    ],
  },
  {
    key: 'candidates',
    title: 'For Candidates',
    route: '/candidates',
    purpose: 'How job seekers use RecruitKr.',
    description:
      'Explains one-tap apply, direct chat with employers, the smart resume, real-time application tracking, and adding a profile video.',
    keywords: ['for candidates', 'candidate', 'job seeker', 'seeker'],
  },
  {
    key: 'employers',
    title: 'For Employers',
    route: '/employers',
    purpose: 'How employers hire on RecruitKr.',
    description:
      'Explains posting jobs, searching verified candidates, instant chat, applicant pipeline, and scheduling interviews inside the chat.',
    keywords: ['for employers', 'employer', 'recruiter', 'hire', 'hiring'],
  },
  {
    key: 'assessment',
    title: 'Assessment',
    route: '/assessment',
    purpose: 'Skill assessments for hiring.',
    description: 'Role-based skill, coding and aptitude assessments that are auto-scored and ranked.',
    keywords: ['assessment', 'assessments', 'test', 'tests', 'skill test'],
  },
  {
    key: 'training',
    title: 'Training',
    route: '/training',
    purpose: 'Job-readiness training programs.',
    description: 'Industry-led training with mentorship, certification and placement support.',
    keywords: ['training', 'courses', 'learn', 'upskill', 'program', 'programs'],
  },
  {
    key: 'partners',
    title: 'Partners',
    route: '/partners',
    purpose: 'Partner with RecruitKr.',
    description: 'Staffing agencies, training institutes, colleges and channel partners can grow with RecruitKr.',
    keywords: ['partners', 'partner', 'partnership', 'agency', 'channel partner'],
  },
  {
    key: 'team',
    title: 'Our Team',
    route: '/our-team',
    purpose: 'Meet the RecruitKr team.',
    description: 'The people behind RecruitKr — recruitment, employer support and candidate success.',
    keywords: ['team', 'our team', 'people', 'staff', 'about us team'],
  },
  {
    key: 'about',
    title: 'About',
    route: '/about',
    purpose: 'About RecruitKr.',
    description: 'What RecruitKr is and the mission behind Befikr Hiring.',
    keywords: ['about', 'about us', 'company info', 'who are you'],
  },
  {
    key: 'contact',
    title: 'Contact',
    route: '/contact',
    purpose: 'Get in touch / support.',
    description: 'Reach the RecruitKr team for help, sales or support.',
    keywords: ['contact', 'support', 'help', 'reach', 'talk to us', 'customer care', 'email', 'phone'],
  },
  {
    key: 'faqs',
    title: 'FAQs',
    route: '/faqs',
    purpose: 'Frequently asked questions.',
    description: 'Common questions about using RecruitKr.',
    keywords: ['faq', 'faqs', 'questions', 'help articles'],
  },
  {
    key: 'blog',
    title: 'Blog',
    route: '/blog',
    purpose: 'Career and hiring articles.',
    description: 'Articles and tips on careers, interviews and hiring.',
    keywords: ['blog', 'articles', 'posts', 'news', 'tips'],
  },
  {
    key: 'login',
    title: 'Log in',
    route: '/login',
    purpose: 'Sign in to your account.',
    description: 'Log in as a candidate or employer.',
    keywords: ['login', 'log in', 'sign in', 'signin'],
  },
  {
    key: 'signup',
    title: 'Sign up',
    route: '/signup',
    purpose: 'Create an account.',
    description:
      'Register as a candidate or employer with just email + password; complete the rest of your profile from the dashboard.',
    keywords: ['signup', 'sign up', 'register', 'create account', 'join', 'registration'],
  },
  {
    key: 'candidateDashboard',
    title: 'Candidate Dashboard',
    route: '/dashboard/candidate',
    auth: true,
    purpose: 'Your candidate workspace.',
    description:
      'Sections: Overview, Find Jobs, My Chat (talk to employers), Profile, and My Card (your resume — upload a PDF or auto-generate one, and add an intro video). Track applications and chat all in one place.',
    keywords: [
      'candidate dashboard',
      'my dashboard',
      'dashboard',
      'my chat',
      'my card',
      'resume',
      'resume builder',
      'my profile',
      'my applications',
      'profile video',
      'intro video',
    ],
    faqs: [
      { q: 'Where do I upload my resume?', a: 'Go to your Candidate Dashboard → “My Card”. You can upload a PDF resume or let RecruitKr auto-generate one from your profile, and add a short intro video.' },
      { q: 'Where do I see my applications?', a: 'After you apply, each application becomes a conversation in your Candidate Dashboard → “My Chat”, where you can track status and talk to the employer.' },
      { q: 'How do I chat with an employer?', a: 'Open your Candidate Dashboard → “My Chat” and pick a conversation. Employers you’ve applied to (or who message you) appear there in real time.' },
    ],
  },
  {
    key: 'employerDashboard',
    title: 'Employer Dashboard',
    route: '/dashboard/client',
    auth: true,
    purpose: 'Your hiring workspace.',
    description:
      'Sections: Overview, Requirements (post jobs), Applications (applicants), Candidates (search verified talent), Messages (chat with candidates), and Company. Schedule interviews directly inside the chat.',
    keywords: [
      'employer dashboard',
      'recruiter dashboard',
      'post a job',
      'post job',
      'requirements',
      'applicants',
      'candidate search',
      'search candidates',
      'company profile',
    ],
    faqs: [
      { q: 'How do I post a job?', a: 'Go to your Employer Dashboard → “Requirements” and create a new role. Once live, it appears in Jobs and candidates can apply.' },
      { q: 'How do I search candidates?', a: 'Open your Employer Dashboard → “Candidates” and search by name, skill, experience or location. Tap “Message” to start a chat instantly.' },
      { q: 'How do I schedule an interview?', a: 'Open the candidate’s chat (Employer Dashboard → Messages), then use the schedule option to set a time and meeting link — the candidate sees it instantly.' },
    ],
  },
  {
    key: 'messages',
    title: 'Messages',
    route: '/messages',
    auth: true,
    purpose: 'Real-time chat.',
    description:
      'WhatsApp-style chat between candidates and employers with file/resume sharing, typing indicators, read receipts and online status. Interviews are scheduled here.',
    keywords: ['messages', 'chat', 'inbox', 'conversations', 'messaging'],
  },
  {
    key: 'applications',
    title: 'Applications',
    route: '/applications',
    auth: true,
    purpose: 'Your applications / applicants.',
    description: 'See your applications (candidate) or applicants (employer) as chat threads.',
    keywords: ['applications', 'applicants', 'my applications'],
  },
];

// Cross-cutting FAQs not tied to a single page. Each can carry a navigate action.
export const GLOBAL_FAQS = [
  {
    q: 'What is RecruitKr?',
    a: 'RecruitKr (Befikr Hiring) is a recruitment platform that connects candidates with companies across India. Candidates apply in one tap and chat directly with employers; employers post jobs, search verified candidates and schedule interviews — all in one place.',
    keywords: ['what is recruitkr', 'about recruitkr', 'what do you do', 'what is this site', 'befikr'],
  },
  {
    q: 'Is RecruitKr free for candidates?',
    a: 'Creating a candidate account, applying to jobs and chatting with employers is free for job seekers. For employer plans or pricing, please use the Contact page.',
    keywords: ['free', 'pricing', 'cost', 'price', 'charges', 'plans'],
    action: { type: 'navigate', to: '/contact', label: 'Contact us' },
  },
  {
    q: 'How do I create an account?',
    a: 'Tap “Sign up”, choose candidate or employer, and register with your email and a password. You can complete the rest of your profile later from your dashboard.',
    keywords: ['create account', 'register', 'sign up', 'how to join', 'make account'],
    action: { type: 'navigate', to: '/signup', label: 'Sign up' },
  },
  {
    q: 'I forgot my password.',
    a: 'On the Log in page, choose “Forgot password?” and follow the steps sent to your email.',
    keywords: ['forgot password', 'reset password', 'cant login', "can't log in", 'password reset'],
    action: { type: 'navigate', to: '/login', label: 'Go to login' },
  },
  {
    q: 'How do I contact support?',
    a: 'Use the Contact page to reach the RecruitKr team for help, sales or support.',
    keywords: ['contact support', 'help', 'support', 'customer care', 'reach you'],
    action: { type: 'navigate', to: '/contact', label: 'Contact us' },
  },
];

// Knowledge base ("RAG" corpus) — curated business/how-it-works answers the bot
// retrieves from. Same shape as FAQs; rich keywords/phrases drive matching.
export const KB = [
  {
    q: 'How does RecruitKr work?',
    a: 'RecruitKr connects candidates and employers in one place. Candidates create a profile, find verified jobs, and apply in one tap — their profile and resume go straight to the employer and a real-time chat opens. Employers post jobs, search verified candidates, chat instantly, and schedule interviews right inside the chat. Applying, chatting, interviews and tracking all happen on RecruitKr.',
    keywords: ['how it works', 'how does it work', 'how recruitkr works', 'how does recruitkr work', 'how this works', 'how the site works', 'how does this work', 'how does the business work', 'how the business works', 'business work', 'business model', 'process', 'how to use', 'explain how', 'working', 'how works', 'business'],
  },
  {
    q: 'How do I get a job on RecruitKr?',
    a: 'Step by step: 1) Sign up as a candidate (email + password). 2) Complete your profile and add a resume or auto-generate one (My Card). 3) Find jobs and apply in one tap. 4) Chat directly with the employer. 5) Attend the interview they schedule in chat. 6) Track your status until you’re hired — all from your dashboard.',
    keywords: ['get a job', 'how to get hired', 'get hired', 'candidate process', 'steps to get a job', 'how do i start', 'how to find a job', 'land a job'],
    action: { type: 'navigate', to: '/signup', label: 'Sign up' },
  },
  {
    q: 'How do I hire on RecruitKr?',
    a: 'Step by step for employers: 1) Sign up as an employer. 2) Post a role under Requirements. 3) Search verified candidates and review applicants. 4) Message candidates instantly. 5) Schedule interviews inside the chat with a meeting link. 6) Move candidates through your pipeline to an offer.',
    keywords: ['how to hire', 'hiring process', 'employer process', 'hire candidates', 'recruit', 'steps to hire', 'how do we hire', 'find talent'],
    action: { type: 'navigate', to: '/employers', label: 'For employers' },
  },
  {
    q: 'How much does RecruitKr cost for employers?',
    a: 'Job seekers use RecruitKr free — creating an account, applying and chatting cost nothing. For employer plans and pricing, please reach our team via the Contact page; they’ll share options that fit your hiring needs.',
    keywords: ['employer pricing', 'cost for employers', 'posting cost', 'plans', 'subscription', 'pricing for companies', 'how much to post a job', 'fees'],
    action: { type: 'navigate', to: '/contact', label: 'Contact us' },
  },
  {
    q: 'What are your support hours / response time?',
    a: 'You can reach the RecruitKr team through the Contact page anytime, and the team typically responds during business hours. The website, chat and job search are available 24/7.',
    keywords: ['support hours', 'timing', 'working hours', 'office hours', 'response time', 'when are you open', 'available time', '24/7', 'support time', 'business hours', 'opening time'],
    action: { type: 'navigate', to: '/contact', label: 'Contact us' },
  },
  {
    q: 'How long does it take to get a job or hear back?',
    a: 'It varies by role and employer. Because you chat with employers directly, replies are often fast. You’ll see every status change — under review, shortlisted, interview, offer — in real time in your dashboard, so you always know where you stand.',
    keywords: ['how long', 'how much time', 'time to get hired', 'how long to get a job', 'when will i hear back', 'how many days', 'how fast', 'duration', 'how soon'],
  },
  {
    q: 'How are interviews scheduled?',
    a: 'Employers schedule interviews directly inside the chat. You get the date, time, mode and a meeting link instantly, and your application moves to the Interview stage automatically.',
    keywords: ['interview', 'schedule interview', 'interview process', 'how interview works', 'meeting link', 'interview time', 'book interview'],
  },
  {
    q: 'Do I need a resume? Can I add a video?',
    a: 'A resume helps but isn’t mandatory — RecruitKr can auto-generate a clean PDF from your profile. You can also record a short intro video so employers see the real you before the interview. Both are managed under your dashboard → My Card.',
    keywords: ['need a resume', 'resume', 'cv', 'auto resume', 'generate resume', 'profile video', 'intro video', 'video', 'do i need a cv'],
    action: { type: 'navigate', to: '/dashboard/candidate', label: 'Candidate dashboard' },
  },
  {
    q: 'Are the companies and jobs verified?',
    a: 'Yes — RecruitKr focuses on verified companies with real ratings, so you can apply with confidence. If anything looks off, use the Contact page to report it.',
    keywords: ['verified', 'is it safe', 'scam', 'genuine', 'trusted', 'real jobs', 'fake jobs', 'legit', 'trust', 'fraud'],
  },
  {
    q: 'Which locations does RecruitKr cover?',
    a: 'RecruitKr connects candidates with startups, MSMEs and enterprises across India, including remote and hybrid roles. Use the location filter on the Jobs page to find roles near you.',
    keywords: ['location', 'cities', 'where', 'india', 'coverage', 'which city', 'area', 'remote', 'hybrid', 'near me'],
    action: { type: 'navigate', to: '/jobs', label: 'Browse jobs' },
  },
  {
    q: 'What does Befikr mean?',
    a: '“Befikr” means worry-free. RecruitKr — Befikr Hiring — is about making hiring and job-hunting simple and stress-free for everyone.',
    keywords: ['befikr', 'befikr hiring', 'meaning of befikr', 'what is befikr'],
  },
  {
    q: 'Is my data safe and private?',
    a: 'Your account data is private and is only shared with an employer when you apply to their job or start a chat with them. This assistant has no access to your private account data.',
    keywords: ['privacy', 'data safe', 'my data', 'personal information', 'secure', 'data security', 'is my data private'],
  },
  {
    q: 'How do I edit my profile?',
    a: 'Open your dashboard → Profile to edit your details, preferences and skills. Your resume and intro video live under My Card.',
    keywords: ['edit profile', 'update profile', 'change details', 'update resume', 'change profile', 'profile update'],
    action: { type: 'navigate', to: '/dashboard/candidate', label: 'Candidate dashboard' },
  },
  {
    q: 'How does the chat work?',
    a: 'RecruitKr has real-time chat between candidates and employers — with file and resume sharing, typing indicators, read receipts and online status. Interviews are scheduled right inside the chat.',
    keywords: ['chat', 'messaging', 'message employer', 'how chat works', 'talk to employer', 'conversation', 'dm'],
    action: { type: 'navigate', to: '/messages', label: 'Open messages' },
  },
  {
    q: 'Where do I see updates and notifications?',
    a: 'Status changes and new messages show up in real time in your dashboard (My Chat for candidates, Messages for employers), and recent activity appears on your Overview.',
    keywords: ['notification', 'notifications', 'updates', 'alerts', 'status update', 'where are my updates'],
  },
  {
    q: 'Candidate or employer account — what is the difference?',
    a: 'Choose Candidate if you’re looking for a job, or Employer if you’re hiring. Candidates apply and chat with companies; employers post jobs, search candidates and schedule interviews. Pick the right one when you sign up.',
    keywords: ['candidate vs employer', 'difference', 'which account', 'candidate or employer', 'account type', 'job seeker or recruiter', 'which one'],
    action: { type: 'navigate', to: '/signup', label: 'Sign up' },
  },
  {
    q: 'Can you generate an offer letter or certificate?',
    a: 'Document generation (offer letters, certificates, experience letters, salary slips, invoices and more) is planned for RecruitKr but not available yet. For hiring paperwork right now, please use the Contact page.',
    keywords: ['offer letter', 'certificate', 'experience letter', 'salary slip', 'invoice', 'generate document', 'quotation', 'employment contract', 'document'],
    action: { type: 'navigate', to: '/contact', label: 'Contact us' },
  },
];
