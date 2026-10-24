import LegalPage, { LegalLink, LegalList, LegalSection, LegalSubheading } from "@/components/LegalPage";

/**
 * Privacy policy for the recruitkr.com website AND the RecruitKR Android app
 * (package com.recruitkr.app). The same URL is entered in Google Play Console
 * and opened from inside the app, so it must describe what BOTH collect.
 *
 * Keep this in step with the code. Whenever a new data field, SDK or third
 * party is added to the website, the app or either backend, update the matching
 * section here, bump UPDATED, and re-check the Play Console Data safety form.
 */
const UPDATED = "24 October 2026";
const PRIVACY_EMAIL = "Connect@recruitkr.com";

const sections = [
  { id: "who-we-are", title: "1. Who we are" },
  { id: "information-we-collect", title: "2. Information we collect" },
  { id: "app-permissions", title: "3. App permissions" },
  { id: "how-we-use", title: "4. How we use your information" },
  { id: "ai-features", title: "5. AI-assisted features" },
  { id: "sharing", title: "6. How we share your information" },
  { id: "cookies", title: "7. Cookies and analytics" },
  { id: "retention", title: "8. How long we keep your information" },
  { id: "deletion", title: "9. Deleting your account and data" },
  { id: "security", title: "10. How we protect your information" },
  { id: "your-rights", title: "11. Your rights" },
  { id: "children", title: "12. Children" },
  { id: "transfers", title: "13. Where your information is processed" },
  { id: "changes", title: "14. Changes to this policy" },
  { id: "contact", title: "15. Contact us and grievance officer" },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={UPDATED}
      intro={
        <>
          <p>
            This Privacy Policy explains how RecruitKr (&quot;RecruitKr&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses,
            shares, stores and deletes personal information when you use our website{" "}
            <LegalLink href="https://www.recruitkr.com">www.recruitkr.com</LegalLink> and the{" "}
            <strong>RecruitKR</strong> mobile app for Android (together, the &quot;Services&quot;).
          </p>
          <p>
            By creating an account or using the Services you agree to this policy. If you do not agree, please do not
            use the Services.
          </p>
        </>
      }
    >
      <nav aria-label="Contents" className="rounded-2xl border border-border bg-muted/40 p-5">
        <p className="mb-2 text-sm font-semibold text-foreground">Contents</p>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {sections.map((s) => (
            <li key={s.id}>
              <LegalLink href={`#${s.id}`}>{s.title}</LegalLink>
            </li>
          ))}
        </ol>
      </nav>

      <LegalSection id="who-we-are" title="1. Who we are">
        <p>
          RecruitKr is a recruitment and HR services company in India. We run a job platform that connects job
          seekers (&quot;candidates&quot;) with companies that are hiring (&quot;employers&quot;). RecruitKr is the
          data fiduciary (the party responsible for your personal data) for information collected through the
          Services.
        </p>
        <p>
          The RecruitKR app is published on Google Play under the package name <code>com.recruitkr.app</code>. You
          can reach us about privacy at <LegalLink href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</LegalLink>{" "}
          (see <LegalLink href="#contact">section 15</LegalLink>).
        </p>
      </LegalSection>

      <LegalSection id="information-we-collect" title="2. Information we collect">
        <p>We only collect information needed to run the Services. What we collect depends on how you use them.</p>

        <LegalSubheading>a) Account information (all users)</LegalSubheading>
        <LegalList>
          <li>Name, email address, mobile number and whether you are a candidate or an employer.</li>
          <li>
            Your password. It is stored only in hashed (one-way encrypted) form and we cannot read it.
          </li>
        </LegalList>

        <LegalSubheading>b) Candidate profile and job applications</LegalSubheading>
        <LegalList>
          <li>
            Profile details you choose to add: profile photo, headline or desired role, skills, work experience,
            education and qualifications, current and preferred location, preferred industry and work mode, and an
            &quot;about me&quot; summary.
          </li>
          <li>
            On the website, you may also provide your date of birth, gender, address and PIN code, LinkedIn or
            portfolio links, and upload your resume and other documents.
          </li>
          <li>
            In the app, when you attach a resume we store its file name and size. The resume file itself stays on
            your device.
          </li>
          <li>
            When you apply for a job: the name, email and mobile number on the application, your cover note, how you
            heard about the job and the name of anyone who referred you, plus the status of your application.
          </li>
        </LegalList>

        <LegalSubheading>c) Employer and company information</LegalSubheading>
        <LegalList>
          <li>
            Company name, website, description, industry, size and type, and the name, designation, email and mobile
            number of the contact person.
          </li>
          <li>Job posts you publish and the hiring requirements you send us.</li>
          <li>
            For our paid recruitment services: billing company name, GST number, billing address and billing email.
          </li>
        </LegalList>

        <LegalSubheading>d) Messages and enquiries</LegalSubheading>
        <LegalList>
          <li>Messages exchanged between candidates and employers through in-app or on-site chat.</li>
          <li>Messages you send to the RecruitKR AI assistant (see section 5).</li>
          <li>Details you submit through our contact form (name, email, mobile number and message).</li>
        </LegalList>

        <LegalSubheading>e) Information collected automatically</LegalSubheading>
        <LegalList>
          <li>
            Technical data our servers record when you use the Services, such as IP address, browser or device type,
            pages or features requested and the date and time. We use it to keep the Services secure (for example, to
            stop abuse and limit excessive requests) and to fix problems.
          </li>
          <li>On the website, cookies and similar technologies (see section 7).</li>
        </LegalList>

        <LegalSubheading>f) Information that stays on your device</LegalSubheading>
        <p>
          The app stores some data only on your phone and does not send it to us: saved jobs, recently viewed jobs,
          job alert preferences, your resume-builder draft, and your theme and language settings. Uninstalling the
          app removes this data.
        </p>

        <LegalSubheading>What we do not collect</LegalSubheading>
        <p>
          The app does not access your precise location, contacts, call logs, SMS or camera. It does not use
          advertising IDs, does not show ads and does not contain third-party analytics or advertising SDKs.
        </p>
      </LegalSection>

      <LegalSection id="app-permissions" title="3. App permissions">
        <p>The RecruitKR app asks for the following only when you use the related feature:</p>
        <LegalList>
          <li>
            <strong>Notifications</strong>: to confirm that your application was sent and to tell you about new jobs
            matching your job alerts. These notifications are created on your phone. You can turn them off at any time
            in your phone settings.
          </li>
          <li>
            <strong>Photos</strong>: only the single image you pick as your profile photo is read and uploaded. The app
            does not scan or upload your gallery.
          </li>
          <li>
            <strong>Files</strong>: only the document you pick as your resume is read.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="how-we-use" title="4. How we use your information">
        <LegalList>
          <li>To create and manage your account and let you sign in.</li>
          <li>
            To run the job platform: show jobs, let candidates apply, and let employers post jobs, review applicants
            and update application status.
          </li>
          <li>
            To provide our recruitment services: our recruitment team reviews applications, contacts candidates and
            employers, schedules interviews and supports hiring.
          </li>
          <li>To recommend relevant jobs and to power the AI-assisted features described in section 5.</li>
          <li>To enable chat between candidates and employers.</li>
          <li>
            To send you service messages, such as application confirmations, job alerts, password resets and replies to
            your enquiries.
          </li>
          <li>To keep the Services secure, prevent fraud and misuse, and fix errors.</li>
          <li>To understand how the website is used so we can improve it (see section 7).</li>
          <li>To meet legal, tax and regulatory obligations and to enforce our rights.</li>
        </LegalList>
        <p>We do not sell your personal information, and we do not use it for third-party advertising.</p>
      </LegalSection>

      <LegalSection id="ai-features" title="5. AI-assisted features">
        <p>
          Some app features use an AI model provided by Anthropic (Claude) through its API. When you use them, the
          information described below is sent to Anthropic to generate the result and is not used to train its models.
        </p>
        <LegalList>
          <li>
            <strong>Job match score and recommendations</strong> (candidates): your headline, skills, experience,
            location and &quot;about&quot; summary, together with job details.
          </li>
          <li>
            <strong>Profile auto-fill from resume</strong> (candidates): the resume text you paste into the app.
          </li>
          <li>
            <strong>AI career assistant</strong> (candidates): your recent chat messages, together with your name,
            headline, skills, experience and location. Please do not share sensitive information, such as financial or
            health details, in this chat.
          </li>
          <li>
            <strong>Applicant ranking</strong> (employers): the name, headline, skills, experience and location of
            applicants to the employer&apos;s job.
          </li>
          <li>
            <strong>Job description writer</strong> (employers): the job details the employer enters.
          </li>
        </LegalList>
        <p>
          AI results are suggestions only. Hiring decisions are made by employers and our recruitment team, not by the
          AI.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="6. How we share your information">
        <LegalSubheading>With employers, when you apply</LegalSubheading>
        <p>
          When you apply for a job, the employer who posted it can see your application and your profile: name, email,
          mobile number, photo, headline, skills, experience, location, &quot;about&quot; summary, resume details and
          cover note. Employers use this information to assess you for the job. Once shared, the employer is also
          responsible for how it handles your information.
        </p>

        <LegalSubheading>With the RecruitKr recruitment team</LegalSubheading>
        <p>
          Applications made in the app are also copied to RecruitKr&apos;s internal recruitment system so our team can
          process them and support you through hiring.
        </p>

        <LegalSubheading>Public information</LegalSubheading>
        <p>
          Job posts are public. A job post shows the company name and job details, and the name and email address of
          the employer account that posted it.
        </p>

        <LegalSubheading>With service providers</LegalSubheading>
        <p>
          We use trusted providers who process data for us only to run the Services, under our instructions:
        </p>
        <LegalList>
          <li>Cloud hosting and databases (Render, Vercel and MongoDB) to run our servers and store account data.</li>
          <li>Image and file storage (Cloudinary and ImageKit) for profile photos, resumes and documents.</li>
          <li>Anthropic, for the AI-assisted features in section 5.</li>
          <li>Google Analytics, for website usage statistics (section 7).</li>
          <li>Email delivery services, to send account and service emails.</li>
        </LegalList>

        <LegalSubheading>For legal reasons and business changes</LegalSubheading>
        <p>
          We may disclose information if required by law, court order or a government authority, or to protect the
          rights, safety and security of RecruitKr, our users or the public. If RecruitKr is involved in a merger,
          acquisition or sale of assets, your information may be transferred as part of that deal and will stay
          protected by this policy.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="7. Cookies and analytics">
        <p>On the website we use:</p>
        <LegalList>
          <li>
            <strong>Essential cookies and browser storage</strong> to keep you signed in and secure your session. The
            website does not work properly without them.
          </li>
          <li>
            <strong>Analytics cookies</strong> from Google Analytics to understand which pages are visited and how the
            site performs. Google processes this data under its own privacy policy. You can block these cookies in your
            browser settings or with Google&apos;s{" "}
            <LegalLink href="https://tools.google.com/dlpage/gaoptout">opt-out add-on</LegalLink>.
          </li>
        </LegalList>
        <p>The mobile app does not use cookies.</p>
      </LegalSection>

      <LegalSection id="retention" title="8. How long we keep your information">
        <LegalList>
          <li>We keep your account and profile information for as long as your account is active.</li>
          <li>
            When you delete your account, we delete your personal information as described in section 9.
          </li>
          <li>
            We keep some information for longer only where the law requires it or for a legitimate reason, such as
            billing and tax records for our paid services, or records needed to resolve disputes and prevent fraud.
            This information is kept only for the period required and then deleted.
          </li>
          <li>Server security logs are kept for a limited period and then deleted.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="deletion" title="9. Deleting your account and data">
        <p>You can delete your account at any time.</p>
        <LegalList>
          <li>
            <strong>In the app:</strong> open <strong>Profile</strong> and tap <strong>Delete account</strong>, then
            confirm. Your account, profile, job applications, chats and (for employers) job posts are permanently
            deleted from our app database straight away.
          </li>
          <li>
            <strong>Without the app, or for a website account:</strong> follow the steps on our{" "}
            <LegalLink href="/delete-account">account deletion page</LegalLink>.
          </li>
        </LegalList>
        <p>
          Copies of your applications in our recruitment system, and photos or files you uploaded, are deleted within
          30 days of your request. Information we must keep by law (section 8) is kept only for the required period.
          Employers who already received your application before you deleted your account may keep their own copy
          under their own policies.
        </p>
      </LegalSection>

      <LegalSection id="security" title="10. How we protect your information">
        <p>
          We take reasonable security measures to protect your information. All data sent between the Services and
          our servers is encrypted in transit using HTTPS. Passwords are stored only in hashed form. Access to personal
          information is limited to authorised staff and systems that need it, and our servers use
          authentication, access controls and request-rate limits.
        </p>
        <p>
          No method of transmission or storage is completely secure, so we cannot guarantee absolute security. If you
          believe your account has been compromised, please contact us straight away.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="11. Your rights">
        <p>
          Subject to applicable law, including India&apos;s Digital Personal Data Protection Act, 2023, you have the
          right to:
        </p>
        <LegalList>
          <li>get a summary of the personal information we hold about you and how we use it;</li>
          <li>correct, complete or update your information (you can edit most of it in your profile);</li>
          <li>have your information erased by deleting your account (section 9);</li>
          <li>withdraw your consent at any time (this does not affect processing that already took place);</li>
          <li>nominate another person to exercise your rights if you die or become incapacitated; and</li>
          <li>raise a grievance with us, and, if you are not satisfied with our response, with the Data Protection Board of India.</li>
        </LegalList>
        <p>
          To use these rights, email <LegalLink href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</LegalLink> from the
          email address linked to your account. We may need to verify your identity first. We aim to respond within 30
          days.
        </p>
      </LegalSection>

      <LegalSection id="children" title="12. Children">
        <p>
          The Services are meant for people aged 18 and over who are looking for work or hiring. We do not knowingly
          collect personal information from anyone under 18. If you believe a child has given us their information,
          contact us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="13. Where your information is processed">
        <p>
          We are based in India. Some of our service providers store or process data on servers outside India. Where
          this happens, we take steps to make sure your information stays protected as described in this policy and as
          required by Indian law.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="14. Changes to this policy">
        <p>
          We may update this policy from time to time. We will change the &quot;Last updated&quot; date at the top of
          this page, and if the changes are significant we will tell you in the app or by email before they take
          effect.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="15. Contact us and grievance officer">
        <p>
          For questions, requests or complaints about this policy or your personal information, contact our Grievance
          Officer:
        </p>
        <div className="rounded-2xl border border-border bg-muted/40 p-5">
          <p className="font-semibold text-foreground">Grievance Officer, RecruitKr</p>
          <p>
            Email: <LegalLink href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</LegalLink>
          </p>
          <p>
            Phone: <LegalLink href="tel:+919001965072">+91 90019 65072</LegalLink> (employers) ·{" "}
            <LegalLink href="tel:+919636315150">+91 96363 15150</LegalLink> (candidates)
          </p>
          <p>
            Website: <LegalLink href="https://www.recruitkr.com/contact">www.recruitkr.com/contact</LegalLink>
          </p>
        </div>
        <p>We will acknowledge your request promptly and aim to resolve it within 30 days.</p>
      </LegalSection>
    </LegalPage>
  );
}
