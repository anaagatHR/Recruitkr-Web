import LegalPage, { LegalLink, LegalList, LegalSection, LegalSubheading } from "@/components/LegalPage";

/**
 * Terms & Conditions for recruitkr.com, the RecruitKR Android app and the
 * RecruitKing brand, all operated by Anaagat Humanpower Private Limited.
 *
 * Keep this in step with the code and with PrivacyPolicy.tsx: the "How
 * RecruitKr works" and "How candidate data is used" sections describe real
 * product behaviour (apply review + consent, profile-completeness rule, apply
 * rate limit, chat, AI features). Change them when that behaviour changes and
 * bump UPDATED.
 */
const UPDATED = "30 October 2026";
const CONTACT_EMAIL = "connect@recruitkr.com";
const COMPANY = "Anaagat Humanpower Private Limited";

const sections = [
  { id: "about", title: "1. About these Terms" },
  { id: "definitions", title: "2. Words used in these Terms" },
  { id: "eligibility", title: "3. Who can use the Services" },
  { id: "how-it-works", title: "4. How RecruitKr works" },
  { id: "candidates", title: "5. Terms for candidates" },
  { id: "candidate-data", title: "6. How candidate data is used" },
  { id: "employers", title: "7. Terms for employers" },
  { id: "fees", title: "8. Paid services, fees and replacements" },
  { id: "training", title: "9. Training and assessments" },
  { id: "communications", title: "10. Chat, calls and messages" },
  { id: "acceptable-use", title: "11. What you must not do" },
  { id: "fraud", title: "12. Job fraud warning" },
  { id: "your-content", title: "13. Content you add" },
  { id: "our-ip", title: "14. Our content and brand" },
  { id: "third-parties", title: "15. Third-party services and links" },
  { id: "disclaimers", title: "16. Disclaimers" },
  { id: "liability", title: "17. Limitation of liability" },
  { id: "indemnity", title: "18. Indemnity" },
  { id: "termination", title: "19. Suspension, termination and deletion" },
  { id: "law", title: "20. Governing law and disputes" },
  { id: "changes", title: "21. Changes to these Terms" },
  { id: "contact", title: "22. Contact us and grievance officer" },
];

export default function TermsAndConditions() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated={UPDATED}
      intro={
        <>
          <p>
            These Terms &amp; Conditions (&quot;Terms&quot;) are an agreement between you and {COMPANY}{" "}
            (&quot;RecruitKr&quot;, &quot;we&quot;, &quot;us&quot;). They apply when you use the website{" "}
            <LegalLink href="https://www.recruitkr.com">www.recruitkr.com</LegalLink>, the <strong>RecruitKR</strong>{" "}
            Android app, any service we offer under the <strong>RecruitKing</strong> name, and our recruitment,
            staffing and HR services (together, the &quot;Services&quot;).
          </p>
          <p>
            By creating an account, applying for a job, posting a job or otherwise using the Services, you agree to
            these Terms and to our <LegalLink href="/privacy-policy">Privacy Policy</LegalLink>. If you do not agree,
            please do not use the Services.
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

      <LegalSection id="about" title="1. About these Terms">
        <p>
          RecruitKr is a recruitment and HR services brand of {COMPANY}, a company registered in India and operating
          from Rajasthan. We run an online job platform that connects job seekers with companies that are hiring, and
          we provide recruitment, staffing, workforce outsourcing, payroll support and related HR services to
          businesses.
        </p>
        <p>
          Some services, especially paid services for employers, are also covered by a separate written agreement,
          proposal or quotation. If that agreement conflicts with these Terms, the agreement wins for that service.
        </p>
      </LegalSection>

      <LegalSection id="definitions" title="2. Words used in these Terms">
        <LegalList>
          <li>
            <strong>Candidate</strong>: a person who uses the Services to look for work, build a profile or apply for
            jobs.
          </li>
          <li>
            <strong>Employer</strong>: a company, business or person who uses the Services to post jobs, share hiring
            requirements or hire people. This includes anyone acting on their behalf.
          </li>
          <li>
            <strong>Profile</strong>: the information a candidate adds about themselves, such as name, contact
            details, education, work history, skills, preferences, resume, photo, documents and videos.
          </li>
          <li>
            <strong>Application</strong>: a candidate&apos;s request to be considered for a specific job, sent through
            the Services.
          </li>
          <li>
            <strong>Recruitment team</strong>: RecruitKr staff who screen candidates, coordinate interviews and support
            hiring.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="eligibility" title="3. Who can use the Services">
        <LegalList>
          <li>You must be at least 18 years old and able to enter into a binding contract under Indian law.</li>
          <li>
            If you use the Services for a company, you confirm that you are authorised to act for it, and the company
            is bound by these Terms.
          </li>
          <li>
            Give true, current and complete information when you sign up, and keep it up to date. One person may hold
            only one candidate account.
          </li>
          <li>
            Keep your password private. You are responsible for everything done through your account. Tell us
            straight away if you think someone else has used it.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="how-it-works" title="4. How RecruitKr works">
        <LegalSubheading>For candidates</LegalSubheading>
        <ol className="list-decimal space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>
            <strong>Create an account</strong> with your name, email address and mobile number.
          </li>
          <li>
            <strong>Build your profile</strong>: qualification, fresher or experienced status, work history, skills,
            preferred role, location and work mode, resume, and optional extras such as a photo, summary, certificates,
            projects or an intro video. Your dashboard shows a profile-completeness score and what is still missing.
          </li>
          <li>
            <strong>Find jobs</strong> on the jobs page or in your dashboard, where you can sort by best match for your
            role, location and skills.
          </li>
          <li>
            <strong>Review and apply.</strong> Before an application is sent, you see exactly what the employer will
            receive, can add a short note, and must confirm your consent to share your details with that employer.
          </li>
          <li>
            <strong>Track your application.</strong> The employer and our recruitment team review it and update its
            status (for example shortlisted, interview or offer). You can see the status and chat with the employer in
            your dashboard.
          </li>
        </ol>

        <LegalSubheading>For employers</LegalSubheading>
        <ol className="list-decimal space-y-1.5 pl-5 marker:text-muted-foreground">
          <li>Create an employer account and add your company details.</li>
          <li>
            Post jobs yourself, or send us a hiring requirement so our recruitment team sources candidates for you.
          </li>
          <li>Review applicants, update their application status and chat with them.</li>
          <li>
            For managed hiring, our team handles requirement analysis, sourcing, screening, interview coordination and
            shortlisting, under the agreement for that service.
          </li>
        </ol>

        <LegalSubheading>Our role</LegalSubheading>
        <p>
          RecruitKr is both a job platform and a recruitment consultancy. We help candidates and employers find each
          other and support the hiring process, but <strong>we are not the employer</strong> of candidates placed with
          our clients, unless we say so in writing (for example under a staffing or payroll arrangement). The hiring
          decision, the job offer and the terms of employment are between the candidate and the employer.
        </p>
      </LegalSection>

      <LegalSection id="candidates" title="5. Terms for candidates">
        <LegalList>
          <li>
            <strong>It&apos;s free.</strong> Candidates do not pay any fee to register, build a profile, apply for jobs
            or be placed through RecruitKr.
          </li>
          <li>
            <strong>Be truthful.</strong> Your profile, resume, certificates and documents must be accurate and your
            own. False or misleading information can lead to rejected applications, withdrawn offers and account
            suspension.
          </li>
          <li>
            <strong>Profile requirements.</strong> To protect employers from empty or incomplete applications, we may
            require your profile to reach a minimum completeness score, and include certain required details, before
            you can apply. Your dashboard tells you exactly what is missing.
          </li>
          <li>
            <strong>Fair-use limits.</strong> To prevent spam, we limit how many applications an account can send in a
            short period. You can apply to each job only once.
          </li>
          <li>
            <strong>No guarantee of a job.</strong> We work hard to match you with suitable roles, but we cannot
            guarantee interviews, offers, a particular salary or employment.
          </li>
          <li>
            <strong>Job details come from employers.</strong> Salaries, locations, benefits and job descriptions are
            provided by employers. Please confirm important details with the employer before accepting an offer.
          </li>
          <li>
            <strong>Be professional.</strong> Attend interviews you have agreed to, or let the employer or our team
            know if you cannot.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="candidate-data" title="6. How candidate data is used">
        <p>
          This is a short summary. Our <LegalLink href="/privacy-policy">Privacy Policy</LegalLink> explains in full
          what we collect, how long we keep it and your rights under India&apos;s Digital Personal Data Protection Act,
          2023.
        </p>
        <LegalList>
          <li>
            <strong>Your profile is not public.</strong> Employers do not see your contact details just because you
            have an account.
          </li>
          <li>
            <strong>When you apply</strong>, and only after you confirm your consent on the review screen, the
            employer for that job receives your application: your name, email, mobile number, city, qualification,
            work history, skills, preferences, summary, your note, and your resume. The details are saved as they were
            at the moment you applied, so the employer sees what you agreed to send.
          </li>
          <li>
            <strong>Your resume</strong> generated by RecruitKr is built from your live profile, so what the employer
            downloads matches what you see in your dashboard.
          </li>
          <li>
            <strong>Our recruitment team</strong> can see your profile and applications so they can screen you,
            suggest suitable jobs, contact you about opportunities and support you through interviews. Applications may
            be copied into our internal recruitment system for this purpose.
          </li>
          <li>
            <strong>Matching and AI.</strong> We use your role, location and skills to sort and recommend jobs. Some
            features use AI to suggest matches or help fill in your profile. AI results are suggestions only, and
            hiring decisions are made by people.
          </li>
          <li>
            <strong>Chat.</strong> Messages and files you share in chat are visible to the other person in that
            conversation and to RecruitKr for safety and support.
          </li>
          <li>
            <strong>We never sell your data</strong> and do not use it for third-party advertising. Employers may use
            your information only to consider you for their jobs (see section 7).
          </li>
          <li>
            <strong>You stay in control.</strong> You can edit your profile at any time and{" "}
            <LegalLink href="/delete-account">delete your account</LegalLink>. Employers who already received your
            application before you deleted your account may keep their own copy under their own policies.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="employers" title="7. Terms for employers">
        <LegalList>
          <li>
            <strong>Real jobs only.</strong> Every job you post or requirement you send must be a genuine, current
            vacancy with accurate details, including role, location, salary range and employer name. Do not post
            misleading, fake, pyramid, multi-level marketing or &quot;work from home&quot; schemes that ask candidates
            to pay or recruit others.
          </li>
          <li>
            <strong>Never charge candidates.</strong> You must not ask candidates for any fee, deposit, training charge,
            uniform charge or other payment in connection with a job you found through RecruitKr.
          </li>
          <li>
            <strong>Use candidate data only for hiring.</strong> Candidate information you receive may be used only to
            assess candidates for the role they applied for or that we presented them for. You must not sell, share,
            publish, scrape, bulk-download or reuse it for marketing or any other purpose, and you must keep it secure
            and delete it when you no longer need it for that purpose. You are responsible for how you handle it under
            the Digital Personal Data Protection Act, 2023 and other applicable law.
          </li>
          <li>
            <strong>Hire fairly and lawfully.</strong> Do not discriminate against candidates on grounds prohibited by
            law, such as religion, caste, sex, gender identity, disability, place of birth or marital status. Follow
            all applicable labour, wage, safety and employment laws.
          </li>
          <li>
            <strong>Be responsive and honest.</strong> Keep application statuses up to date and tell us if a job is
            filled or withdrawn.
          </li>
          <li>
            <strong>Verification.</strong> We may ask for documents to verify your company, and we may refuse,
            remove or suspend any job post or account at our discretion.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="fees" title="8. Paid services, fees and replacements">
        <LegalList>
          <li>
            Recruitment, staffing, outsourcing, payroll, assessment and other paid services for employers are charged
            as set out in the proposal, quotation or agreement for that service. Prices are exclusive of GST and other
            applicable taxes unless stated otherwise.
          </li>
          <li>
            Invoices are payable within the period stated on the invoice or agreement. We may pause services while an
            invoice is overdue.
          </li>
          <li>
            <strong>Replacement guarantee.</strong> Where your agreement includes a replacement guarantee, if a
            candidate we placed leaves within the guarantee period, we will try to provide a suitable replacement at no
            extra fee, on the conditions in that agreement (for example, that fees have been paid on time).
            Replacements are not cash refunds unless the agreement says so.
          </li>
          <li>
            <strong>Candidates we introduce.</strong> If you hire, directly or through anyone else, a candidate we
            introduced or presented to you, the fee in your agreement applies, even if the hire happens outside the
            Services.
          </li>
          <li>Fees already paid are non-refundable, except where the agreement or the law says otherwise.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="training" title="9. Training and assessments">
        <LegalList>
          <li>
            Any training programme or assessment is offered on the terms, schedule and fees (if any) shown for that
            programme before you enrol.
          </li>
          <li>
            Completing a training programme or passing an assessment improves your chances but does not guarantee a
            job or a particular outcome.
          </li>
          <li>
            Assessment results may be shared with the employer you are being considered for, so they can evaluate you
            for that role.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="communications" title="10. Chat, calls and messages">
        <LegalList>
          <li>
            By creating an account you agree that RecruitKr, and employers you apply to, may contact you by email,
            phone call, SMS, WhatsApp, in-app message or notification about your account, applications, interviews and
            relevant jobs. This applies even if your number is on the national Do Not Disturb register, because these
            are messages about a service you asked for.
          </li>
          <li>
            You can ask us to stop job-alert or promotional messages at any time. We will still send messages that are
            necessary to run your account or an application in progress.
          </li>
          <li>
            Keep chat respectful and about the job. Do not share bank details, OTPs or passwords in chat. We may review
            chats reported to us, and remove content or accounts that break these Terms.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="acceptable-use" title="11. What you must not do">
        <p>When using the Services, you must not:</p>
        <LegalList>
          <li>impersonate anyone, or create an account for someone else without their permission;</li>
          <li>post content that is false, misleading, defamatory, obscene, hateful, harassing, or that infringes anyone&apos;s rights;</li>
          <li>post content that is harmful to children, threatens the unity, integrity or security of India, or is otherwise unlawful;</li>
          <li>upload viruses, malware or anything designed to damage or interfere with the Services;</li>
          <li>
            scrape, crawl, copy or bulk-collect jobs, profiles or other data, or use bots or automated tools, except
            search engines following our robots.txt;
          </li>
          <li>try to access accounts, data or systems you are not authorised to access, or get around our security, rate limits or profile requirements;</li>
          <li>send spam, chain messages or unsolicited advertising to other users;</li>
          <li>use the Services to recruit for illegal work, human trafficking, or any job that charges candidates money.</li>
        </LegalList>
        <p>
          We may remove content, limit features or suspend accounts that break these rules, and report illegal activity
          to the authorities.
        </p>
      </LegalSection>

      <LegalSection id="fraud" title="12. Job fraud warning">
        <div className="rounded-2xl border border-border bg-muted/40 p-5">
          <p className="font-semibold text-foreground">RecruitKr never asks candidates for money.</p>
          <p className="mt-2">
            We never ask for registration fees, security deposits, training charges, interview fees or payment of any
            kind to get a job. We never ask for your OTP, password, PIN or bank details. If anyone claiming to be from
            RecruitKr, or any employer on our platform, asks you for money, do not pay. Report it to us at{" "}
            <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink> or on{" "}
            <LegalLink href="tel:+919636315150">+91 96363 15150</LegalLink>, and to the National Cyber Crime Helpline{" "}
            <LegalLink href="tel:1930">1930</LegalLink> or{" "}
            <LegalLink href="https://cybercrime.gov.in">cybercrime.gov.in</LegalLink>.
          </p>
        </div>
      </LegalSection>

      <LegalSection id="your-content" title="13. Content you add">
        <LegalList>
          <li>
            You keep ownership of the content you add, such as your profile, resume, photo, videos, documents, job posts
            and messages.
          </li>
          <li>
            You give RecruitKr a non-exclusive, royalty-free licence to store, copy, format, display and share that
            content only as needed to run the Services as described in these Terms and the Privacy Policy. For example,
            we turn your profile into a resume and send it to employers you apply to. This licence ends when you delete
            the content or your account, except for copies already shared as described above or kept where the law
            requires.
          </li>
          <li>
            You confirm you have the right to share the content, and that it does not break any law or anyone else&apos;s
            rights.
          </li>
          <li>
            Testimonials, reviews or videos you give us for publicity are used only with your separate permission, which
            you can withdraw for future use at any time.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="our-ip" title="14. Our content and brand">
        <p>
          The Services, including their design, software, text, graphics, logos and the RecruitKr, RecruitKR and
          RecruitKing names, belong to {COMPANY} or its licensors and are protected by law. You may not copy, modify,
          sell or reuse them without our written permission, except for normal personal use of the Services.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="15. Third-party services and links">
        <p>
          The Services may link to or embed third-party websites and services, such as company websites, YouTube
          videos, maps or payment pages. We do not control them and are not responsible for their content or
          practices. Your use of them is governed by their own terms.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="16. Disclaimers">
        <LegalList>
          <li>
            The Services are provided &quot;as is&quot; and &quot;as available&quot;. We try to keep them accurate,
            secure and running, but we do not promise they will always be error-free or uninterrupted.
          </li>
          <li>
            We screen employers and candidates where we can, but we cannot fully verify every job post, profile,
            qualification or statement made by users. Please use your own judgement before sharing personal details,
            attending an interview or accepting an offer.
          </li>
          <li>
            We are not a party to, and are not responsible for, the employment relationship between a candidate and an
            employer, including salary, working conditions or termination, unless we have agreed to act as employer in
            writing.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="liability" title="17. Limitation of liability">
        <LegalList>
          <li>
            To the extent allowed by law, RecruitKr is not liable for indirect or consequential loss, such as loss of
            earnings, loss of opportunity, loss of business or loss of data, arising from your use of the Services.
          </li>
          <li>
            Our total liability for any claim relating to the Services is limited to the fees you paid us for the
            service concerned in the 12 months before the claim. If you have not paid us anything (as is the case for
            candidates), it is limited to ₹1,000.
          </li>
          <li>
            Nothing in these Terms limits liability that cannot be limited under Indian law, such as liability for
            fraud.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="indemnity" title="18. Indemnity">
        <p>
          You agree to compensate RecruitKr for any loss, claim or expense (including reasonable legal fees) caused by
          your breach of these Terms, your misuse of the Services, content you posted, or, for employers, your misuse of
          candidate data or breach of employment law.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="19. Suspension, termination and deletion">
        <LegalList>
          <li>
            You can stop using the Services and <LegalLink href="/delete-account">delete your account</LegalLink> at
            any time.
          </li>
          <li>
            We may suspend or close an account, remove content or refuse service if you break these Terms, if we
            suspect fraud or misuse, or if the law requires it. Where reasonable, we will tell you why.
          </li>
          <li>
            Sections that by their nature should continue after an account is closed, such as fees owed, use of
            candidate data, intellectual property, liability, indemnity and disputes, will continue to apply.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="law" title="20. Governing law and disputes">
        <p>
          These Terms are governed by the laws of India. Please contact us first (section 22) so we can try to resolve
          any problem informally. If a dispute cannot be resolved within 30 days, the courts at Jaipur, Rajasthan will
          have exclusive jurisdiction.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="21. Changes to these Terms">
        <p>
          We may update these Terms from time to time. We will change the &quot;Last updated&quot; date at the top of
          this page, and if the changes are significant we will tell you on the website, in the app or by email before
          they take effect. If you keep using the Services after the changes take effect, you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="22. Contact us and grievance officer">
        <p>
          In line with the Information Technology Act, 2000 and the rules made under it, you can send questions,
          complaints or reports of content that breaks these Terms to our Grievance Officer:
        </p>
        <div className="rounded-2xl border border-border bg-muted/40 p-5">
          <p className="font-semibold text-foreground">Grievance Officer, RecruitKr ({COMPANY})</p>
          <p>
            Email: <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink>
          </p>
          <p>
            Phone: <LegalLink href="tel:+919001965072">+91 90019 65072</LegalLink> (employers) ·{" "}
            <LegalLink href="tel:+919636315150">+91 96363 15150</LegalLink> (candidates)
          </p>
          <p>
            Website: <LegalLink href="https://www.recruitkr.com/contact">www.recruitkr.com/contact</LegalLink>
          </p>
        </div>
        <p>We will acknowledge your complaint within 24 hours and aim to resolve it within 15 days.</p>
      </LegalSection>
    </LegalPage>
  );
}
