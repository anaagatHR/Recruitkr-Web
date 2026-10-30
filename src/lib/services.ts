import type { LucideIcon } from "lucide-react";
import { Briefcase, Building2, Crown, GraduationCap, ShieldCheck, UserCheck, Users, Wallet } from "lucide-react";

export type LabeledItem = { label: string; description: string };

export type ServiceBlock =
  | { title: string; kind: "labeled"; items: LabeledItem[] }
  | { title: string; kind: "bullets"; items: string[] }
  | { title: string; kind: "steps"; items: string[] }
  | { title: string; kind: "paragraphs"; paragraphs: string[] };

export type Service = {
  id: string;
  icon: LucideIcon;
  cardTitle: string;
  cardDescription: string;
  /** Unique <meta name="description"> for /services/<id>. */
  metaDescription: string;
  /** City landing pages (slugs from lib/locations) linked from this service page. */
  cities: string[];
  title: string;
  subtitle: string;
  intro: string[];
  blocks: ServiceBlock[];
  closing?: string[];
};

export const services: Service[] = [
  {
    id: "recruitment",
    icon: Users,
    cardTitle: "Recruitment",
    cardDescription: "Tailored hiring for startups, Small Business MSMEs, and corporates across 12+ sectors.",
    metaDescription:
      "Recruitment services from RecruitKr: permanent, startup, bulk and industry-specific hiring for SMBs and corporates across India, from sourcing to onboarding.",
    cities: ["jaipur", "delhi", "gurugram", "mumbai", "bengaluru"],
    title: "Recruitment Services",
    subtitle: "Tailored Hiring Solutions for Startups, SMBs, and Corporates Across 12+ Industries",
    intro: [
      "RecruitKr provides professional recruitment services designed to help organizations hire the right talent quickly and efficiently. We specialize in tailored hiring solutions for startups, small and medium businesses (SMBs), and large corporates across more than 12 industries.",
      "Finding skilled professionals can be challenging and time-consuming. Our recruitment experts simplify the hiring process by sourcing, screening, and shortlisting qualified candidates who match your business requirements and company culture.",
      "With our extensive candidate network and industry expertise, RecruitKr helps businesses reduce hiring time, lower recruitment costs, and build high-performing teams.",
    ],
    blocks: [
      {
        title: "Our Recruitment Expertise",
        kind: "labeled",
        items: [
          {
            label: "Permanent Recruitment",
            description:
              "We help businesses hire full-time professionals who contribute to long-term organizational success. Our recruiters identify candidates with the right experience, skills, and cultural fit.",
          },
          {
            label: "Startup Hiring Solutions",
            description:
              "Startups require fast and flexible hiring support. RecruitKr helps founders and growing companies build strong teams by connecting them with skilled professionals across key roles.",
          },
          {
            label: "Bulk & Volume Hiring",
            description:
              "For companies expanding rapidly, we manage large-scale recruitment drives while maintaining quality and efficiency.",
          },
          {
            label: "Industry-Specific Recruitment",
            description:
              "Our team understands the hiring requirements of different industries and delivers specialized talent accordingly.",
          },
        ],
      },
      {
        title: "Industries We Serve",
        kind: "bullets",
        items: [
          "Information Technology (IT)",
          "Sales and Marketing",
          "Finance and Accounting",
          "Human Resources",
          "Customer Support",
          "Manufacturing",
          "Retail and E-commerce",
          "Logistics and Supply Chain",
          "Healthcare",
          "Education",
          "Hospitality",
          "Operations and Administration",
        ],
      },
      {
        title: "Our Recruitment Process",
        kind: "steps",
        items: [
          "Understanding your hiring requirements and job roles",
          "Candidate sourcing through multiple talent channels",
          "Skill evaluation and candidate screening",
          "Shortlisting the most suitable professionals",
          "Interview coordination and selection support",
          "Smooth onboarding assistance",
        ],
      },
      {
        title: "Why Choose RecruitKr?",
        kind: "bullets",
        items: [
          "Access to a large database of trained candidates",
          "Faster hiring with efficient recruitment processes",
          "Reduced hiring and training costs",
          "Dedicated hiring support for startups and growing companies",
          "Industry expertise across multiple sectors",
        ],
      },
    ],
    closing: [
      "At RecruitKr, we focus on connecting businesses with the right talent so they can grow faster and operate more efficiently.",
      "Partner with RecruitKr today and discover a smarter way to hire skilled professionals for your organization.",
    ],
  },
  {
    id: "payroll",
    icon: Wallet,
    cardTitle: "Payroll Management",
    cardDescription: "Accurate, compliant payroll processing so you focus on growth.",
    metaDescription:
      "Outsourced payroll management by RecruitKr: salary processing, PF, ESI and TDS compliance, payslips and employee records for growing Indian businesses.",
    cities: ["jaipur", "noida", "pune", "hyderabad"],
    title: "Payroll Management",
    subtitle: "Accurate and Compliant Payroll Processing So You Can Focus on Business Growth",
    intro: [
      "RecruitKr provides reliable and compliant payroll management services for startups, small and medium businesses (SMBs), and large organizations. Our payroll solutions are designed to simplify salary processing, ensure statutory compliance, and reduce administrative workload for your HR and finance teams.",
      "Managing payroll involves multiple responsibilities including salary calculations, tax deductions, compliance with government regulations, and maintaining accurate employee records. Our experienced payroll specialists handle the entire process efficiently so your organization can focus on core business operations and growth.",
    ],
    blocks: [
      {
        title: "Our Payroll Services Include",
        kind: "labeled",
        items: [
          {
            label: "Salary Processing",
            description:
              "Accurate calculation and timely processing of employee salaries including bonuses, incentives, and reimbursements.",
          },
          {
            label: "Statutory Compliance Management",
            description:
              "We ensure compliance with payroll regulations including PF, ESI, TDS, and other statutory requirements to help businesses avoid penalties.",
          },
          {
            label: "Employee Payslip & Reports",
            description: "Automated generation of payslips and payroll reports for employees and management.",
          },
          {
            label: "Payroll Outsourcing",
            description:
              "Complete payroll outsourcing solutions that reduce administrative burden and improve operational efficiency.",
          },
          {
            label: "Employee Record Management",
            description: "Maintaining secure and accurate employee payroll data and documentation.",
          },
        ],
      },
      {
        title: "Benefits of Our Payroll Management Services",
        kind: "bullets",
        items: [
          "Accurate and timely salary processing",
          "Compliance with statutory regulations",
          "Reduced administrative workload",
          "Improved payroll transparency and reporting",
          "Scalable payroll solutions for growing businesses",
        ],
      },
      {
        title: "How a Monthly Payroll Cycle Works",
        kind: "steps",
        items: [
          "You share attendance, leave, new joiners, exits and any salary changes for the month",
          "We calculate gross pay, deductions, reimbursements and net salary for every employee",
          "You review and approve the payroll summary before anything is paid",
          "Salaries are processed and payslips are issued to employees",
          "We file and deposit PF, ESI, professional tax and TDS on time and share the challans",
          "Monthly reports and year-end Form 16 support close the cycle",
        ],
      },
      {
        title: "Why Choose RecruitKr for Payroll Services?",
        kind: "paragraphs",
        paragraphs: [
          "RecruitKr combines technology, expertise, and industry knowledge to deliver efficient payroll solutions for businesses across multiple sectors. Whether you are a startup building your first team or a growing company managing a large workforce, our payroll services are designed to support your operational efficiency and compliance needs.",
        ],
      },
    ],
    closing: [
      "Our payroll management services ensure that your organization maintains financial accuracy, legal compliance, and employee satisfaction.",
      "Partner with RecruitKr for professional payroll management and streamline your workforce administration with confidence.",
    ],
  },
  {
    id: "staffing",
    icon: UserCheck,
    cardTitle: "Staffing Solutions",
    cardDescription: "Flexible workforce on demand - scale up or down as needed.",
    metaDescription:
      "Temporary, contract and permanent staffing solutions from RecruitKr. Scale your workforce up or down with pre-screened candidates across India.",
    cities: ["jaipur", "jodhpur", "bhilwara", "delhi", "pune"],
    title: "Staffing Solutions",
    subtitle: "Flexible Workforce on Demand - Scale Your Team as Needed",
    intro: [
      "RecruitKr provides flexible and reliable staffing solutions that help businesses access skilled professionals whenever they need them. Our workforce solutions are designed for startups, small and medium businesses (SMBs), and large organizations that require a scalable workforce to meet changing business demands.",
      "In today's competitive market, companies often need to respond quickly to new projects, seasonal workloads, or sudden growth opportunities. Our staffing services allow organizations to hire qualified professionals quickly while maintaining flexibility and cost efficiency.",
      "With RecruitKr's staffing solutions, businesses can focus on productivity and growth while we manage the process of sourcing, screening, and deploying the right talent.",
    ],
    blocks: [
      {
        title: "Comprehensive Workforce Solutions",
        kind: "labeled",
        items: [
          {
            label: "Temporary Staffing",
            description:
              "Hire skilled professionals for short-term roles, seasonal projects, or temporary workforce needs without long-term commitments.",
          },
          {
            label: "Contract Staffing",
            description:
              "Access experienced professionals for specific projects or contract-based assignments while maintaining operational flexibility.",
          },
          {
            label: "Permanent Staffing Support",
            description:
              "We assist companies in identifying and hiring full-time employees who align with their long-term business objectives.",
          },
          {
            label: "Project-Based Hiring",
            description:
              "Organizations working on specialized projects can quickly build dedicated teams with the required skills and expertise.",
          },
          {
            label: "Workforce Expansion Support",
            description:
              "For companies experiencing rapid growth, we provide scalable staffing solutions to help expand teams efficiently.",
          },
        ],
      },
      {
        title: "Benefits of Flexible Staffing",
        kind: "bullets",
        items: [
          "Faster access to qualified candidates",
          "Reduced recruitment and administrative costs",
          "Ability to scale workforce according to business needs",
          "Access to pre-screened and trained professionals",
          "Improved operational flexibility and productivity",
        ],
      },
      {
        title: "Our Staffing Process",
        kind: "steps",
        items: [
          "Understanding workforce requirements and job roles",
          "Sourcing candidates from our extensive talent network",
          "Skill assessment and candidate screening",
          "Shortlisting qualified professionals",
          "Interview coordination and candidate deployment",
          "Continuous workforce support and management",
        ],
      },
      {
        title: "Why Businesses Choose RecruitKr",
        kind: "paragraphs",
        paragraphs: [
          "RecruitKr combines recruitment expertise, industry knowledge, and an extensive candidate database to deliver efficient staffing solutions. Our goal is to help businesses build flexible teams that support operational efficiency and long-term growth.",
          "Whether you need a temporary workforce, contract professionals, or support for large-scale hiring, RecruitKr ensures that you get the right talent at the right time.",
        ],
      },
    ],
  },
  {
    id: "gig",
    icon: Briefcase,
    cardTitle: "Gig Worker Placement",
    cardDescription: "Contract and freelance talent pool for project-based needs.",
    metaDescription:
      "Hire freelance and contract gig workers through RecruitKr for project-based work in IT, digital marketing, sales, support and e-commerce operations.",
    cities: ["remote", "bengaluru", "hyderabad", "jaipur"],
    title: "Gig Worker Placement",
    subtitle: "Access Skilled Contract and Freelance Talent for Project-Based Work",
    intro: [
      "RecruitKr provides reliable gig worker placement services that help businesses access skilled freelance and contract professionals for short-term and project-based assignments. Our gig workforce solutions are designed to help startups, SMBs, and corporates quickly find specialized talent without the need for long-term employment commitments.",
      "As businesses increasingly adopt flexible work models, the demand for gig workers and freelance professionals continues to grow. RecruitKr helps organizations tap into a curated talent pool of experienced professionals who can contribute to projects, temporary roles, or specialized tasks.",
      "Our gig workforce solutions allow companies to remain agile, manage costs effectively, and complete projects faster with the right expertise.",
    ],
    blocks: [
      {
        title: "Our Gig Workforce Services",
        kind: "labeled",
        items: [
          {
            label: "Freelance Talent Placement",
            description:
              "We connect businesses with experienced freelancers who can deliver specialized skills for short-term assignments.",
          },
          {
            label: "Contract-Based Professionals",
            description:
              "Hire skilled professionals for fixed-duration contracts to support project execution and operational needs.",
          },
          {
            label: "Project-Based Hiring",
            description:
              "Build dedicated project teams with professionals who have the specific expertise required to achieve your business objectives.",
          },
          {
            label: "On-Demand Workforce",
            description:
              "Access a flexible pool of gig workers who can be deployed quickly for urgent or high-demand projects.",
          },
        ],
      },
      {
        title: "Benefits of Gig Worker Placement",
        kind: "bullets",
        items: [
          "Access to specialized talent on demand",
          "Reduced long-term hiring commitments",
          "Faster project execution and delivery",
          "Cost-effective workforce solutions",
          "Flexibility to scale teams based on project requirements",
        ],
      },
      {
        title: "Industries Using Gig Talent",
        kind: "bullets",
        items: [
          "Information Technology",
          "Digital Marketing",
          "Creative and Design",
          "Sales and Business Development",
          "Customer Support",
          "Finance and Accounting",
          "E-commerce Operations",
          "Logistics and Supply Chain",
        ],
      },
      {
        title: "How Gig Placement Works",
        kind: "steps",
        items: [
          "You describe the project, the skills needed, the duration and the budget",
          "We shortlist freelancers and contract professionals with relevant past work",
          "You interview or brief the shortlisted people and choose who to engage",
          "We agree the scope, timelines and payment terms in writing",
          "We stay in touch through the engagement and help replace anyone who cannot continue",
        ],
      },
      {
        title: "Why Choose RecruitKr for Gig Talent?",
        kind: "paragraphs",
        paragraphs: [
          "RecruitKr combines industry expertise, advanced sourcing strategies, and an extensive professional network to connect businesses with the right freelance and contract professionals. Our goal is to help organizations complete projects efficiently while maintaining workforce flexibility and cost control.",
        ],
      },
    ],
    closing: ["Partner with RecruitKr to access a reliable gig workforce that supports innovation, productivity, and business growth."],
  },
  {
    id: "hr",
    icon: ShieldCheck,
    cardTitle: "End-to-End HR",
    cardDescription: "From recruitment to retention to replacement - we cover it all.",
    metaDescription:
      "End-to-end HR outsourcing from RecruitKr: recruitment, onboarding, payroll, performance, retention and replacement support from a single partner.",
    cities: ["jaipur", "gurugram", "noida", "mumbai"],
    title: "End-to-End HR Solutions",
    subtitle: "Complete HR Support - From Recruitment to Retention to Replacement",
    intro: [
      "RecruitKr offers comprehensive end-to-end HR solutions designed to help businesses manage their entire employee lifecycle efficiently. From hiring the right talent to managing workforce performance and replacing roles when required, our HR services support organizations at every stage of workforce management.",
      "Managing human resources can be complex and time-consuming, especially for startups and growing companies. Our end-to-end HR services simplify HR operations by combining recruitment expertise, workforce management, and HR process support into a single integrated solution.",
      "With RecruitKr as your HR partner, you can focus on growing your business while we handle the complete HR ecosystem.",
    ],
    blocks: [
      {
        title: "Our End-to-End HR Services Include",
        kind: "labeled",
        items: [
          {
            label: "Recruitment & Talent Acquisition",
            description:
              "We help businesses identify and hire skilled professionals who match the organization's requirements and culture.",
          },
          {
            label: "Employee Onboarding Support",
            description:
              "Smooth onboarding processes that help new employees integrate quickly and become productive members of your team.",
          },
          {
            label: "Payroll & HR Administration",
            description:
              "Accurate payroll processing, employee record management, and compliance with statutory regulations.",
          },
          {
            label: "Performance & Workforce Management",
            description: "Support for managing employee performance, productivity, and workforce efficiency.",
          },
          {
            label: "Employee Retention Strategies",
            description: "HR solutions designed to improve employee engagement, satisfaction, and retention.",
          },
          {
            label: "Replacement & Workforce Continuity",
            description:
              "Quick replacement hiring and workforce continuity support to ensure minimal disruption to business operations.",
          },
        ],
      },
      {
        title: "Benefits of End-to-End HR Management",
        kind: "bullets",
        items: [
          "Simplified HR operations through a single partner",
          "Reduced HR administrative workload",
          "Faster hiring and workforce management",
          "Improved employee productivity and retention",
          "Compliance with labor laws and statutory requirements",
        ],
      },
      {
        title: "Who Can Benefit from Our HR Solutions?",
        kind: "bullets",
        items: [
          "Startups building their first teams",
          "Small and medium businesses expanding operations",
          "Companies looking to outsource HR management",
          "Organizations needing scalable workforce support",
        ],
      },
      {
        title: "Why Choose RecruitKr as Your HR Partner?",
        kind: "paragraphs",
        paragraphs: [
          "RecruitKr combines industry knowledge, HR expertise, and a strong candidate network to provide reliable HR management solutions. Our goal is to help businesses build strong teams, improve workforce productivity, and maintain smooth HR operations.",
        ],
      },
    ],
    closing: ["Partner with RecruitKr for complete HR support and create a workforce strategy that drives long-term business success."],
  },
  {
    id: "career",
    icon: GraduationCap,
    cardTitle: "Career Counselling",
    cardDescription: "Guidance for job seekers, aspirants, and college students.",
    metaDescription:
      "Career counselling for students, freshers and job seekers: career planning, resume building, interview preparation and job search guidance from RecruitKr.",
    cities: ["jaipur", "kota", "udaipur", "ajmer", "remote"],
    title: "Career Counselling",
    subtitle: "Professional Career Guidance for Job Seekers, Aspirants, and College Students",
    intro: [
      "RecruitKr provides professional career counselling services designed to help job seekers, fresh graduates, and aspiring professionals make informed career decisions. Our career guidance programs help individuals identify the right career path, improve employability skills, and prepare for successful job opportunities.",
      "Choosing the right career can be challenging in today's competitive job market. Our experienced career advisors provide personalized guidance to help candidates understand their strengths, explore industry opportunities, and develop a clear career roadmap.",
      "Through structured counselling sessions, RecruitKr supports individuals in building confidence, improving job readiness, and navigating their professional journey effectively.",
    ],
    blocks: [
      {
        title: "Our Career Counselling Services",
        kind: "labeled",
        items: [
          {
            label: "Career Guidance for Students",
            description:
              "We help college students and fresh graduates explore career options, identify suitable industries, and plan their professional journey.",
          },
          {
            label: "Job Search Guidance",
            description:
              "Support for job seekers in understanding job market trends, improving their job search strategy, and identifying the right opportunities.",
          },
          {
            label: "Resume and Profile Building",
            description:
              "Expert guidance to create professional resumes, optimize LinkedIn profiles, and present skills effectively to employers.",
          },
          {
            label: "Interview Preparation",
            description:
              "Training and mock interviews to build confidence, improve communication skills, and prepare for job interviews successfully.",
          },
          {
            label: "Career Transition Support",
            description:
              "Guidance for professionals looking to switch industries, upskill, or explore new career opportunities.",
          },
        ],
      },
      {
        title: "Benefits of Career Counselling",
        kind: "bullets",
        items: [
          "Clarity in career choices and industry opportunities",
          "Improved employability skills and job readiness",
          "Stronger resumes and professional profiles",
          "Better interview performance and confidence",
          "Personalized career roadmap and guidance",
        ],
      },
      {
        title: "Who Can Benefit from Our Career Counselling?",
        kind: "bullets",
        items: [
          "College students planning their careers",
          "Fresh graduates entering the job market",
          "Professionals looking to change industries",
          "Job seekers struggling to find the right opportunities",
        ],
      },
      {
        title: "Start Your Career Journey with RecruitKr",
        kind: "paragraphs",
        paragraphs: [
          "At RecruitKr, we believe that the right guidance can transform careers. Our career counselling services help individuals discover their potential and connect them with opportunities that match their aspirations.",
          "Connect with RecruitKr today and take the first step toward building a successful and fulfilling career.",
        ],
      },
    ],
  },
  {
    id: "executive-search",
    icon: Crown,
    cardTitle: "Executive Search",
    cardDescription: "Confidential, research-led hiring for leadership and senior roles.",
    metaDescription:
      "Executive search by RecruitKr: confidential, research-led hiring of CXOs, functional heads, plant heads and regional leaders for Indian businesses.",
    cities: ["jaipur", "delhi", "gurugram", "mumbai", "bengaluru"],
    title: "Executive Search",
    subtitle: "Confidential, Research-Led Hiring for Leadership and Senior Roles",
    intro: [
      "Senior hires shape a company for years. A wrong appointment at the leadership level costs far more than salary: it slows decisions, unsettles teams and can set strategy back by a full business cycle. RecruitKr's executive search practice helps founders, promoters and boards find leaders who fit both the role and the way the business actually runs.",
      "The best senior candidates are rarely looking at job boards. They are busy running teams elsewhere, and they will only consider a move when someone presents a credible opportunity in confidence. Our search is therefore research-led: we map the market, identify the people doing the job well today, and approach them directly and discreetly.",
      "We work on a small number of mandates at a time, so every search gets a dedicated consultant who stays with it from the first briefing to the candidate's first months in the role.",
    ],
    blocks: [
      {
        title: "Roles We Search For",
        kind: "labeled",
        items: [
          {
            label: "CXO and Leadership Roles",
            description:
              "Chief executives, business heads, CFOs, COOs and CHROs for growing companies, family businesses moving to professional management, and new ventures.",
          },
          {
            label: "Functional Heads",
            description:
              "Heads of sales, marketing, finance, human resources, operations, technology and supply chain who can build and lead their own teams.",
          },
          {
            label: "Plant and Operations Leadership",
            description:
              "Plant heads, production managers and quality leaders for manufacturing, power and process industries, where technical depth matters as much as people skills.",
          },
          {
            label: "Regional and Branch Heads",
            description:
              "Leaders who run a state, region or branch network for banking, insurance, retail, FMCG and logistics companies expanding across India.",
          },
        ],
      },
      {
        title: "Our Executive Search Process",
        kind: "steps",
        items: [
          "Briefing: we agree the role, the results expected in the first year, the team the leader will inherit and the compensation range",
          "Market mapping: we research the companies and individuals where suitable leaders work today",
          "Confidential outreach: we approach shortlisted leaders directly and explain the opportunity without revealing your name until they show genuine interest",
          "In-depth assessment: structured interviews on track record, leadership style and cultural fit, plus discreet reference checks",
          "Shortlist presentation: a small set of candidates, each with a detailed report on strengths, risks and motivation",
          "Offer and onboarding: support with negotiation, notice-period management and check-ins during the first months",
        ],
      },
      {
        title: "Confidentiality at Every Stage",
        kind: "bullets",
        items: [
          "Your company name is shared only with serious, pre-screened candidates",
          "Candidate identities are shared with you only with their consent",
          "Replacement searches can run without alerting the current role holder",
          "Search records are kept on a need-to-know basis within our team",
        ],
      },
      {
        title: "Why Leadership Hiring Needs a Different Approach",
        kind: "paragraphs",
        paragraphs: [
          "Hiring a frontline team member is largely about skills and availability. Hiring a leader is about judgement, credibility and fit with the promoters and the board. That is why we spend more time understanding your business, the decisions the new leader will face and the culture they must work within, before we speak to a single candidate.",
        ],
      },
    ],
    closing: [
      "Planning a senior appointment? Talk to RecruitKr about a confidential executive search.",
    ],
  },
  {
    id: "campus-recruitment",
    icon: GraduationCap,
    cardTitle: "Campus Recruitment",
    cardDescription: "Fresher hiring drives with colleges, from planning to joining.",
    metaDescription:
      "Campus recruitment by RecruitKr: plan and run fresher hiring drives with engineering, management, commerce and ITI colleges, from assessments to joining.",
    cities: ["jaipur", "kota", "ajmer", "udaipur", "jodhpur"],
    title: "Campus Recruitment",
    subtitle: "Fresher Hiring Drives With Colleges, From Planning to Joining",
    intro: [
      "Freshers bring energy, new skills and long-term loyalty when they are hired well. But running campus drives takes time: building relationships with colleges, managing hundreds of applicants on a single day, and making sure the students who accept your offer actually join. RecruitKr's campus recruitment service handles that work for you.",
      "We work with engineering, management, commerce, science and ITI or diploma colleges, with a strong network across Rajasthan, including Jaipur, Kota, Ajmer, Udaipur and Jodhpur. For companies hiring at scale, we combine on-campus, off-campus and pooled drives so you reach the right students without visiting every college yourself.",
      "We also work with the students: preparing them for assessments and interviews and helping them understand the role, so you meet better-prepared candidates and fewer offers go unaccepted.",
    ],
    blocks: [
      {
        title: "What We Handle",
        kind: "labeled",
        items: [
          {
            label: "Drive Planning and College Outreach",
            description:
              "We choose the right colleges for your roles, agree dates with placement cells and manage registrations, eligibility checks and logistics.",
          },
          {
            label: "Pre-Placement Talks",
            description:
              "We help you present the company, the role, the salary and the growth path clearly, so students apply with realistic expectations.",
          },
          {
            label: "Assessments and Group Discussions",
            description:
              "Aptitude, technical and communication assessments, plus group discussions, to shortlist students fairly and quickly.",
          },
          {
            label: "Interviews and Selection",
            description:
              "Interview scheduling, panel coordination and consolidated results, so selection decisions can be made on the same day.",
          },
          {
            label: "Offer and Joining Management",
            description:
              "Offer letters, document collection and regular follow-up until joining day, which keeps drop-offs between offer and joining low.",
          },
        ],
      },
      {
        title: "Roles Companies Hire From Campus",
        kind: "bullets",
        items: [
          "Graduate engineer trainees",
          "Management trainees",
          "Sales and business development trainees",
          "Customer support associates",
          "Accounts and finance freshers",
          "ITI and diploma technicians",
          "Software and IT trainees",
          "Retail and operations trainees",
        ],
      },
      {
        title: "Our Campus Hiring Process",
        kind: "steps",
        items: [
          "Understanding the number of hires, roles, eligibility and joining timelines",
          "Selecting colleges and agreeing drive dates with placement cells",
          "Pre-placement talk and student registrations",
          "Assessments, group discussions and interviews",
          "Final selection, offer letters and documentation",
          "Joining follow-up and early feedback from new hires",
        ],
      },
      {
        title: "For Colleges and Students",
        kind: "paragraphs",
        paragraphs: [
          "Placement cells can invite RecruitKr to bring employers to their campus, and students can create a free RecruitKr profile to be considered for fresher roles all year round, not just during campus season. Candidates never pay any fee to be placed through RecruitKr.",
        ],
      },
    ],
    closing: ["Planning your next fresher intake? Talk to RecruitKr about a campus hiring drive."],
  },
  {
    id: "workforce-solutions",
    icon: Building2,
    cardTitle: "Workforce Solutions",
    cardDescription: "Managed and outsourced workforce on our payroll, with compliance handled.",
    metaDescription:
      "Workforce solutions from RecruitKr: outsourced and third-party payroll staff, bulk deployment, seasonal teams and statutory compliance managed for you.",
    cities: ["jaipur", "bhilwara", "jodhpur", "noida", "pune"],
    title: "Workforce Solutions",
    subtitle: "Managed and Outsourced Workforce, With Compliance Handled",
    intro: [
      "Many roles are essential to your operations but do not need to sit on your own payroll: retail and store staff, warehouse and logistics teams, customer support, field sales and shop-floor workers. RecruitKr's workforce solutions let you run these teams at the size you need, while we take care of hiring, payroll, compliance and replacement.",
      "Under a managed workforce arrangement, RecruitKr hires and deploys the people, pays them, and handles statutory requirements such as PF, ESI and labour-law documentation. You direct the day-to-day work; we keep the team staffed and compliant. This reduces the administrative load on your HR team and makes headcount far easier to scale up for peak seasons, new sites or new contracts.",
      "Our workforce teams support businesses in Rajasthan's industrial centres such as Jaipur, Jodhpur and Bhilwara, and in other major cities across India.",
    ],
    blocks: [
      {
        title: "Our Workforce Services",
        kind: "labeled",
        items: [
          {
            label: "Workforce Outsourcing",
            description:
              "Complete teams hired, deployed and managed by RecruitKr for functions you want to outsource, with agreed service levels.",
          },
          {
            label: "Third-Party Payroll",
            description:
              "People you select are placed on RecruitKr's payroll, so you get flexibility in headcount without adding to your permanent rolls.",
          },
          {
            label: "Bulk and Volume Deployment",
            description:
              "Fast hiring and deployment of large teams for new plants, stores, warehouses or service contracts.",
          },
          {
            label: "Seasonal and Project Teams",
            description:
              "Extra staff for festive peaks, harvest seasons, inventory audits and time-bound projects, released when the work is done.",
          },
          {
            label: "Compliance and Attendance Management",
            description:
              "PF, ESI, statutory registers, attendance and leave records maintained for every deployed worker.",
          },
        ],
      },
      {
        title: "Roles We Commonly Deploy",
        kind: "bullets",
        items: [
          "Retail store staff and promoters",
          "Warehouse, packing and delivery associates",
          "Customer support and back-office executives",
          "Field sales and collection executives",
          "Machine operators and shop-floor helpers",
          "Hospitality and front-office staff",
          "Data entry and administrative assistants",
          "Security and facility support staff",
        ],
      },
      {
        title: "How a Workforce Engagement Works",
        kind: "steps",
        items: [
          "We agree roles, headcount, locations, shifts and service levels",
          "We source, screen and verify candidates for each role",
          "Selected workers are onboarded on RecruitKr's payroll and deployed to your site",
          "We run monthly payroll, statutory compliance and attendance records",
          "We replace exits quickly to keep the team at the agreed strength",
          "We review performance and headcount with you every month",
        ],
      },
      {
        title: "Why Outsource Your Workforce to RecruitKr?",
        kind: "paragraphs",
        paragraphs: [
          "You get a team that scales with demand, one invoice instead of hundreds of payroll entries, and a partner who is accountable for keeping positions filled and compliant. Your managers spend their time running operations rather than chasing hiring, documents and attendance.",
        ],
      },
    ],
    closing: ["Need a team that scales with your business? Talk to RecruitKr about a managed workforce."],
  },
];

export const getService = (id: string) => services.find((s) => s.id === id);

