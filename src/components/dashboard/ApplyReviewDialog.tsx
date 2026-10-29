"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";

export type ApplyReviewJob = { _id: string; jobTitle: string; companyName?: string; jobLocation?: string };

export type ApplySnapshot = {
  fullName: string;
  phone: string;
  email: string;
  skills: string[];
  resumeLabel: string;
};

type Props = {
  job: ApplyReviewJob | null;
  snapshot: ApplySnapshot;
  submitting: boolean;
  /** Server/network failure for this attempt, shown inside the sheet. */
  error: string;
  onSubmit: (input: { note: string }) => void;
  onClose: () => void;
  onEditProfile: () => void;
  onPreviewResume: () => void;
};

const NOTE_MAX = 300;

/**
 * Apply review sheet (audit §6.4): shows exactly what the employer receives and
 * collects the consent the data model always expected (declarationAccepted).
 * Native <dialog> + showModal(): the page behind is inert, Escape closes it and
 * focus returns to the Apply button that opened it.
 */
const ApplyReviewDialog = ({ job, snapshot, submitting, error, onSubmit, onClose, onEditProfile, onPreviewResume }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const ids = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (job && !dialog.open) {
      setNote("");
      setConsent(false);
      setConsentError(false);
      dialog.showModal();
    } else if (!job && dialog.open) {
      dialog.close();
    }
  }, [job]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    // Validate on submit (never by disabling the button); focus the field at fault.
    if (!consent) {
      setConsentError(true);
      consentRef.current?.focus();
      return;
    }
    onSubmit({ note });
  };

  const row = (label: string, value: string) => (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-slate-900">{value || "Not added"}</dd>
    </div>
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${ids}-title`}
      onClose={onClose}
      className="m-0 mt-auto max-h-[90vh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-white p-0 text-left shadow-2xl backdrop:bg-slate-900/50 sm:m-auto sm:max-w-lg sm:rounded-2xl"
    >
      {job && (
        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={`${ids}-title`} className="text-lg font-bold text-slate-900">
                Apply to {job.jobTitle}
              </h2>
              {(job.companyName || job.jobLocation) && (
                <p className="mt-0.5 text-sm text-slate-600">
                  {[job.companyName, job.jobLocation].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <h3 className="mt-5 text-sm font-semibold text-slate-900">The employer will receive</h3>
          <dl className="mt-1 divide-y divide-slate-100 rounded-xl border border-slate-200 px-3 text-sm">
            {row("Name", snapshot.fullName)}
            {row("Mobile", snapshot.phone)}
            {row("Email", snapshot.email)}
            {row("Resume", snapshot.resumeLabel)}
            <div className="py-1.5">
              <dt className="text-slate-500">Skills</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {snapshot.skills.length ? (
                  snapshot.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="font-medium text-slate-900">Not added</span>
                )}
              </dd>
            </div>
          </dl>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <button type="button" onClick={onPreviewResume} className="font-semibold text-[#264a7f] underline">
              Preview resume PDF
            </button>
            <button type="button" onClick={onEditProfile} className="font-semibold text-[#264a7f] underline">
              Edit profile
            </button>
          </div>

          <label htmlFor={`${ids}-note`} className="mt-5 block text-sm font-semibold text-slate-900">
            Note to the employer <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id={`${ids}-note`}
            name="note"
            rows={3}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-describedby={`${ids}-note-count`}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p id={`${ids}-note-count`} className="text-right text-xs text-slate-500">
            {note.length}/{NOTE_MAX}
          </p>

          <div className="mt-3 flex items-start gap-2">
            <input
              ref={consentRef}
              id={`${ids}-consent`}
              name="declarationAccepted"
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setConsentError(false);
              }}
              aria-required="true"
              aria-invalid={consentError || undefined}
              aria-describedby={consentError ? `${ids}-consent-error` : undefined}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <label htmlFor={`${ids}-consent`} className="text-sm text-slate-700">
              I confirm these details are accurate and authorise RecruitKr to share them with this employer.
            </label>
          </div>
          {consentError && (
            <p id={`${ids}-consent-error`} className="mt-1 text-sm font-medium text-red-700">
              Please confirm before submitting your application.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              aria-busy={submitting}
              className="rounded-xl bg-[#264a7f] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {submitting ? "Submitting…" : error ? "Try again" : "Submit application"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
};

export default ApplyReviewDialog;
