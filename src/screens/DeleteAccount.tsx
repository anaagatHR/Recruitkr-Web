import LegalPage, { LegalLink, LegalList, LegalSection } from "@/components/LegalPage";

/**
 * Account deletion page for the RecruitKR app. This URL is the "delete account"
 * web link entered in Google Play Console's Data safety form, so it must name
 * the app/developer, show how to request deletion WITHOUT reinstalling the app,
 * and say what is deleted and what is kept. Keep it in step with
 * `deleteMe` in the app backend and section 9 of the privacy policy.
 */
const UPDATED = "24 October 2026";
const DELETION_EMAIL = "Connect@recruitkr.com";
const MAIL_SUBJECT = encodeURIComponent("Account deletion request");
const MAIL_BODY = encodeURIComponent(
  "Please delete my RecruitKR account and the data linked to it.\n\n" +
    "Registered email: \nRegistered mobile number: \nAccount type (candidate / employer): \n" +
    "Account on (app / website / both): \n",
);

export default function DeleteAccount() {
  return (
    <LegalPage
      title="Delete your RecruitKR account"
      updated={UPDATED}
      intro={
        <p>
          This page explains how to delete your account in the <strong>RecruitKR</strong> app for Android, published
          by RecruitKr, or on <LegalLink href="https://www.recruitkr.com">www.recruitkr.com</LegalLink>, and what
          happens to your data.
        </p>
      }
    >
      <LegalSection id="in-app" title="Option 1: Delete in the app (immediate)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Open the RecruitKR app and sign in.</li>
          <li>
            Go to the <strong>Profile</strong> tab.
          </li>
          <li>
            Tap <strong>Delete account</strong>, then tap <strong>Delete</strong> to confirm.
          </li>
        </ol>
        <p>Your account is deleted straight away and you are signed out.</p>
      </LegalSection>

      <LegalSection id="by-email" title="Option 2: Request deletion by email (no app needed)">
        <p>
          If you no longer have the app, or you want to delete an account on our website, email us from the email
          address registered to your account:
        </p>
        <p>
          <a
            href={`mailto:${DELETION_EMAIL}?subject=${MAIL_SUBJECT}&body=${MAIL_BODY}`}
            className="inline-flex items-center justify-center rounded-xl bg-[#264a7f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d3a63]"
          >
            Email a deletion request
          </a>
        </p>
        <LegalList>
          <li>
            To: <LegalLink href={`mailto:${DELETION_EMAIL}`}>{DELETION_EMAIL}</LegalLink>
          </li>
          <li>Subject: Account deletion request</li>
          <li>
            Include: your registered email, registered mobile number, whether you are a candidate or an employer, and
            whether the account is on the app, the website or both.
          </li>
        </LegalList>
        <p>
          To protect your account, we may contact you to confirm the request comes from you. We complete deletion
          within 30 days and email you when it is done.
        </p>
      </LegalSection>

      <LegalSection id="what-is-deleted" title="What we delete">
        <LegalList>
          <li>Your account: name, email address, mobile number and password.</li>
          <li>
            Your profile: photo, headline, skills, experience, education, location, &quot;about&quot; summary, resume
            details and uploaded documents.
          </li>
          <li>Your job applications and their status.</li>
          <li>Your chat messages with employers or candidates.</li>
          <li>
            For employers: your company profile, your job posts, and the applications received on those posts.
          </li>
          <li>
            Copies of your applications held in RecruitKr&apos;s recruitment system, and photos or files you
            uploaded. These are removed within 30 days.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="what-is-kept" title="What we may keep, and for how long">
        <LegalList>
          <li>
            Billing and tax records for paid recruitment services (employers only), for the period required by Indian
            tax law.
          </li>
          <li>
            Limited records needed to prevent fraud, resolve disputes or meet a legal obligation, only for as long as
            that need lasts.
          </li>
          <li>Server security logs, which are deleted automatically after a limited period.</li>
        </LegalList>
        <p>
          Employers who received your application before you deleted your account may keep their own copy under their
          own policies. Data saved only on your phone (saved jobs, job alerts, resume-builder draft) is cleared when
          you delete your account in the app, or when you uninstall it.
        </p>
        <p>
          For more detail, see our <LegalLink href="/privacy-policy">Privacy Policy</LegalLink>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
