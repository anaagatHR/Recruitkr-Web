"use client";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { keepPreviousData, queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@/compat/router";
import { ArrowLeft, BriefcaseBusiness, Building2, Camera, CheckCircle2, ChevronDown, Clock3, FileText, Filter, GraduationCap, Loader2, MapPin, MessageSquare, Pencil, Search, Sparkles, UserCircle2, X, XCircle } from "lucide-react";
import OptimizedLogo from "@/components/OptimizedLogo";
import ApplicationStepTracker from "@/components/ApplicationStepTracker";
import CandidateVideos from "@/components/CandidateVideos";
import DashboardLayout, { type DashboardNavItem } from "@/components/DashboardLayout";
import SearchBar from "@/components/search/SearchBar";
import StatCard from "@/components/dashboard/StatCard";
import { fetchJobSuggestions } from "@/lib/search";
import { applyToJobRequest, PLACEHOLDER_LOCATION, scoreJobMatch } from "@/lib/jobs";
import { API_BASE, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { ApiClientError } from "@/lib/apiError";
import { clearSession, getSession } from "@/lib/auth";
import { useServerEvents, type SseConnectionStatus } from "@/hooks/useServerEvents";
import { tryAutoLogin } from "@/lib/autoLogin";
import { useTabHistory } from "@/hooks/useTabHistory";
import { useToast } from "@/hooks/use-toast";
import ApplyReviewDialog from "@/components/dashboard/ApplyReviewDialog";
import ProfileCompletionCard from "@/components/dashboard/ProfileCompletionCard";
import { computeProfileCompletion, type CompletionField, type CompletionResult } from "@/lib/profileCompletion";
import { uploadFile, uploadRules, validateUploadFile } from "@/lib/uploadFile";
import Messages from "./Messages";
const JOBS_PAGE_LIMIT = 20;
// Personalised feed: applied jobs are excluded server-side before paginating,
// so meta.total matches what the page shows (audit P1-2).
const candidateJobsUrl = (page: number) => `/jobs/for-me?page=${page}&limit=${JOBS_PAGE_LIMIT}&excludeApplied=true`;
const GATE_INTRO_DISMISSED_KEY = "rk-apply-gate-intro-dismissed-v1";

// Completion checklist item -> the editor control it should focus.
const FIELD_CONTROL_IDS: Record<string, string> = {
  fullName: "cp-full-name",
  phone: "cp-phone",
  qualification: "cp-qualification",
  experienceStatus: "cp-experience-status",
  summary: "cp-summary",
  skills: "cp-skills",
  preferredRole: "cp-preferred-role",
  preferredLocation: "cp-preferred-location",
  preferredIndustry: "cp-preferred-industry",
  workModes: "cp-workmode-On-site",
  resume: "cp-resume-file",
  photo: "cp-photo-file",
  certifications: "cp-certificate-file",
  projects: "cp-add-project",
  introVideo: "cp-videos",
};

const DASHBOARD_TABS = ["overview", "jobs", "applications", "messages", "profile", "preview"] as const;
type DashboardTab = (typeof DASHBOARD_TABS)[number];

// Stable empty values so memo/effect dependencies don't change every render.
const EMPTY_APPLICATIONS: CandidateApplicationsResponse["data"] = [];
const EMPTY_JOBS: JobsResponse["data"] = [];
const EMPTY_CERTIFICATES: CandidateCertificatesResponse["data"] = [];

type ResumeMeta = {
  resumeType: "uploaded" | "generated";
  resumeId?: string;
  resumeUrl?: string;
  resumeFileId?: string;
  fileName?: string;
};

// One cache entry per server resource (audit §4.5, P2-5). Switching tabs reads
// the cache; data refreshes on SSE events, after mutations, and on window focus
// once stale — never on a timer while live updates are connected.
const candidateKeys = {
  all: ["candidate"] as const,
  dashboard: ["candidate", "dashboard"] as const,
  profile: ["candidate", "profile"] as const,
  applications: ["candidate", "applications"] as const,
  resume: ["candidate", "resume"] as const,
  certificates: ["candidate", "certificates"] as const,
  jobs: ["candidate", "jobs"] as const,
  jobsPage: (page: number) => ["candidate", "jobs", { page }] as const,
};

const authGet = <T,>(path: string, signal: AbortSignal) => apiGet<T>(path, { auth: true, signal });

const dashboardQueryOptions = queryOptions({
  queryKey: candidateKeys.dashboard,
  queryFn: ({ signal }) => authGet<CandidateDashboardResponse>("/dashboards/candidate", signal).then((res) => res.data),
});

const profileQueryOptions = queryOptions({
  queryKey: candidateKeys.profile,
  queryFn: ({ signal }) => authGet<CandidateProfileResponse>("/users/candidate/me", signal).then((res) => res.data),
});

const applicationsQueryOptions = queryOptions({
  queryKey: candidateKeys.applications,
  queryFn: ({ signal }) =>
    authGet<CandidateApplicationsResponse>("/jobs/applications/mine", signal).then((res) => res.data),
});

const resumeQueryOptions = queryOptions({
  queryKey: candidateKeys.resume,
  queryFn: ({ signal }) =>
    authGet<{ success: boolean; data: ResumeMeta }>("/resumes/mine", signal)
      .then((res): ResumeMeta | null => res.data)
      // No resume saved yet is a normal state, not an error.
      .catch((err) => {
        if (err instanceof ApiClientError && err.status === 404) return null;
        throw err;
      }),
});

const certificatesQueryOptions = queryOptions({
  queryKey: candidateKeys.certificates,
  queryFn: ({ signal }) =>
    authGet<CandidateCertificatesResponse>("/users/candidate/certificates", signal).then((res) => res.data || []),
});

const jobsPageQueryOptions = (page: number) =>
  queryOptions({
    queryKey: candidateKeys.jobsPage(page),
    queryFn: ({ signal }) => authGet<JobsResponse>(candidateJobsUrl(page), signal),
    staleTime: 60_000,
  });
// Photo behind the overview hero. This used to point at "/hero-bg.jpg", which
// is not where the file lives — every dashboard load fired a request that 404'd
// and logged an error, and the onError handler quietly hid the result, so the
// hero had been running on its gradient alone. Set to "" to turn the photo off.
const HERO_BG_SRC = "/assets/hero-bg.jpg";
const BRAND_PRIMARY = "#264a7f";
const BRAND_SECONDARY = "#69a44f";
const dashboardShellClass = "dashboard-theme";
const dashboardHeaderClass =
  "sticky top-0 z-30 border-b border-[#264a7f]/10 bg-white/88 backdrop-blur-xl shadow-[0_12px_40px_rgba(38,74,127,0.08)]";
const brandCardClass =
  "rounded-[28px] border border-[#264a7f]/10 bg-white/92 shadow-[0_20px_60px_rgba(38,74,127,0.08)] backdrop-blur";
const statCardClass =
  "rounded-2xl border border-[#264a7f]/10 bg-white/95 p-4 shadow-[0_16px_40px_rgba(38,74,127,0.08)] sm:p-5";

// Status → dot colour for the Recent activity feed.
const ACTIVITY_DOT: Record<string, string> = {
  applied: "bg-slate-400",
  "under-review": "bg-sky-500",
  screening: "bg-emerald-500",
  interview: "bg-violet-500",
  offer: "bg-amber-500",
  hired: "bg-emerald-500",
  rejected: "bg-red-500",
};
const JOBS_HERO_GRADIENT = "linear-gradient(90deg, rgba(36, 70, 121, 1) 0%, rgba(105, 164, 79, 1) 100%)";

type ApplicationStatus =
  | "applied"
  | "under-review"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

type InterviewDetails = {
  scheduledAt?: string;
  timezone?: string;
  mode?: "onsite" | "google-meet" | "phone" | "video" | "zoom" | "other";
  locationText?: string;
  googleMapsUrl?: string;
  meetingLink?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  reportingNotes?: string;
  documentsRequired?: string;
  additionalInstructions?: string;
};

type ApplicationResponseSnapshot = {
  statusNote?: string;
  interviewDetails?: InterviewDetails;
};

type ApplicationTimelineItem = {
  status: ApplicationStatus;
  note?: string;
  changedByRole?: "candidate" | "client" | "system";
  changedAt?: string;
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied successfully",
  "under-review": "Client reviewed",
  screening: "Shortlisted / screening",
  interview: "Interview scheduled",
  offer: "Offer shared",
  hired: "Hired",
  rejected: "Rejected",
};

const INTERVIEW_MODE_LABELS: Record<NonNullable<InterviewDetails["mode"]>, string> = {
  onsite: "On-site",
  "google-meet": "Google Meet",
  phone: "Phone call",
  video: "Video call",
  zoom: "Zoom",
  other: "Other",
};

// The chip must never claim "Live" while the dashboard is failing to load (audit §6.6).
const LIVE_STATUS_META: Record<SseConnectionStatus | "degraded", { label: string; className: string }> = {
  connecting: { label: "Connecting…", className: "border-amber-200 bg-amber-50 text-amber-800" },
  connected: { label: "Live", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  reconnecting: { label: "Reconnecting…", className: "border-amber-200 bg-amber-50 text-amber-800" },
  disconnected: { label: "Offline — updates paused", className: "border-slate-300 bg-slate-100 text-slate-700" },
  degraded: { label: "Having trouble loading", className: "border-red-200 bg-red-50 text-red-700" },
};

const PROFILE_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  "under-review": "Under Review",
  screening: "Shortlisted",
  interview: "Interview Scheduled",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const PROFILE_STATUS_BADGE_CLASSNAMES: Record<ApplicationStatus, string> = {
  applied: "border-slate-200 bg-slate-100 text-slate-700",
  "under-review": "border-sky-200 bg-sky-50 text-sky-700",
  screening: "border-emerald-200 bg-emerald-50 text-emerald-700",
  interview: "border-violet-200 bg-violet-50 text-violet-700",
  offer: "border-emerald-200 bg-emerald-50 text-emerald-700",
  hired: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

const formatStatusLabel = (status: string) =>
  STATUS_LABELS[status as ApplicationStatus] || status.replace(/-/g, " ");

const formatInterviewDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatInterviewTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const parseApplicationScheduledAt = (application: Record<string, any>) => {
  const nested = application?.interviewDetails?.scheduledAt;
  if (nested) return nested;

  const dateText = String(application?.interviewDate || "").trim();
  const timeText = String(application?.interviewTime || "").trim();
  if (!dateText) return "";
  if (!timeText) return dateText;

  const direct = new Date(`${dateText} ${timeText}`);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const dateMatch = dateText.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  const timeMatch = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!dateMatch || !timeMatch) return `${dateText} ${timeText}`;

  const day = Number(dateMatch[1]);
  const monthIndex = Number(dateMatch[2]) - 1;
  const year = Number(dateMatch[3]);
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = timeMatch[3].toUpperCase();

  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  const composed = new Date(year, monthIndex, day, hour, minute, 0, 0);
  return Number.isNaN(composed.getTime()) ? `${dateText} ${timeText}` : composed.toISOString();
};

const getApplicationResponseSnapshot = (application: Record<string, any>): ApplicationResponseSnapshot => {
  const nested = application?.interviewDetails || {};
  const scheduledAt = parseApplicationScheduledAt(application);

  return {
    statusNote:
      application?.statusNote ||
      application?.candidateResponse ||
      application?.clientNote ||
      application?.note ||
      application?.notes ||
      "",
    interviewDetails: {
      scheduledAt,
      timezone: nested?.timezone || application?.timezone || "",
      mode: nested?.mode || application?.interviewMode || application?.mode || "",
      locationText: nested?.locationText || application?.interviewLocation || application?.locationText || "",
      googleMapsUrl:
        nested?.googleMapsUrl || application?.googleMapLocation || application?.googleMapsUrl || "",
      meetingLink: nested?.meetingLink || application?.meetingLink || "",
      contactPerson: nested?.contactPerson || application?.contactPerson || "",
      contactEmail: nested?.contactEmail || application?.contactEmail || "",
      contactPhone: nested?.contactPhone || application?.contactPhone || "",
      notes: nested?.notes || "",
      reportingNotes: nested?.reportingNotes || application?.reportingNotes || "",
      documentsRequired: nested?.documentsRequired || application?.documentsRequired || "",
      additionalInstructions:
        nested?.additionalInstructions || application?.additionalInstructions || "",
    },
  };
};

const getInterviewTimingMeta = (value?: string) => {
  if (!value) {
    return {
      label: "Schedule pending",
      tone: "bg-slate-100 text-slate-700 border-slate-200",
      hint: "The client has started the interview stage. Full timing details may be shared shortly.",
    };
  }

  const scheduled = new Date(value);
  if (Number.isNaN(scheduled.getTime())) {
    return {
      label: "Schedule shared",
      tone: "bg-slate-100 text-slate-700 border-slate-200",
      hint: "Please review the interview information carefully.",
    };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfScheduled = new Date(
    scheduled.getFullYear(),
    scheduled.getMonth(),
    scheduled.getDate(),
  );
  const dayDiff = Math.round(
    (startOfScheduled.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (scheduled.getTime() < now.getTime()) {
    return {
      label: "Completed",
      tone: "bg-slate-100 text-slate-700 border-slate-200",
      hint: "This interview time has passed. Watch for the next update from the client.",
    };
  }

  if (dayDiff === 0) {
    return {
      label: "Today",
      tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
      hint: "Keep your phone and email handy, and join a few minutes early if a meeting link is shared.",
    };
  }

  if (dayDiff === 1) {
    return {
      label: "Tomorrow",
      tone: "bg-amber-100 text-amber-800 border-amber-200",
      hint: "Set a reminder now so you are ready with the required documents or meeting link.",
    };
  }

  if (dayDiff <= 7) {
    return {
      label: `In ${dayDiff} days`,
      tone: "bg-sky-100 text-sky-800 border-sky-200",
      hint: "Review the role, keep your schedule free, and check the logistics in advance.",
    };
  }

  return {
    label: "Upcoming",
    tone: "bg-sky-100 text-sky-800 border-sky-200",
    hint: "You have time to prepare. Save the schedule and review the job details before the interview.",
  };
};

type CandidateDashboardResponse = {
  success: boolean;
  data: {
    stats: {
      applicationsSent: number;
      interviewCalls: number;
      offersReceived: number;
      profileCompletion: number;
    };
    completion?: ProfileGateSummary & {
      gateEnabled: boolean;
      missingOptional: MissingProfileField[];
      fields: CompletionField[];
    };
    applications: Array<{
      _id: string;
      status: ApplicationStatus;
      createdAt: string;
      fullName?: string;
      email?: string;
      phone?: string;
      qualification?: string;
      currentCity?: string;
      appliedFor?: string;
      experience?: Array<{ jobProfile?: string }>;
      statusNote?: string;
      statusUpdatedAt?: string;
      interviewDetails?: InterviewDetails;
      timeline?: ApplicationTimelineItem[];
      jobId?: {
        _id: string;
        jobTitle?: string;
        jobLocation?: string;
        employmentType?: string;
        sourceCollection?: string;
        sourceLabel?: string;
      };
    }>;
    profile?: CandidateProfileResponse["data"];
  };
};

type CandidateApplicationsResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    status: ApplicationStatus;
    createdAt: string;
    fullName?: string;
    email?: string;
    phone?: string;
    qualification?: string;
    currentCity?: string;
    appliedFor?: string;
    experience?: Array<{ jobProfile?: string }>;
    statusNote?: string;
    statusUpdatedAt?: string;
    interviewDetails?: InterviewDetails;
    timeline?: ApplicationTimelineItem[];
    jobId?: {
      _id: string;
      jobTitle?: string;
      jobLocation?: string;
      employmentType?: string;
      sourceCollection?: string;
      sourceLabel?: string;
    };
  }>;
};

type ExperienceEntry = {
  company?: string;
  role?: string;
  startDate?: string; // YYYY-MM
  endDate?: string; // YYYY-MM, empty when current
  current?: boolean;
};

type CandidateProfileResponse = {
  success: boolean;
  data: {
    recruitkrId?: string;
    profileRevision?: number;
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    pincode?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    phone?: string;
    city?: string;
    college?: string;
    highestQualification?: string;
    experienceStatus?: "fresher" | "experienced";
    experienceDetails?: {
      currentCompany?: string;
      designation?: string;
      totalExperience?: string;
      industry?: string;
    };
    experience?: ExperienceEntry[];
    preferences?: {
      preferredRole?: string;
      preferredLocation?: string;
      preferredIndustry?: string;
      workModes?: Array<"On-site" | "Hybrid" | "Remote">;
    };
    summary?: string;
    skills?: string[];
    projects?: Array<{ name?: string; description?: string }>;
    certifications?: Array<{ name?: string; institute?: string }>;
    referral?: string;
    profilePhotoUrl?: string;
    profilePhotoFileId?: string;
  };
};

type CandidateCertificatesResponse = {
  success: boolean;
  data: Array<{
    id: string;
    title?: string;
    fileName: string;
    url?: string;
    fileId?: string;
    mimeType: string;
    size: number;
    createdAt: string;
  }>;
};

type JobsResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    jobTitle: string;
    jobLocation: string;
    employmentType: string;
    minCtcLpa?: number;
    maxCtcLpa?: number;
    companyName?: string;
    openings?: number;
    sourceCollection?: string;
    sourceLabel?: string;
    ownerRole?: "admin" | "client";
    canApply?: boolean;
    /** Why THIS candidate can't apply (server-computed by /jobs/for-me). */
    blockReason?: "JOB_CLOSED" | "ALREADY_APPLIED" | "PROFILE_INCOMPLETE" | null;
    applyDisabledReason?: string;
    isLegacy?: boolean;
    description?: string;
    department?: string;
    experienceRequired?: string;
    qualification?: string;
    preferredIndustryBackground?: string;
    workModes?: Array<"On-site" | "Hybrid" | "Remote"> | string[];
    urgencyLevel?: string;
    requirements?: string[];
    responsibilities?: string[];
    skills?: string[];
    genderRequirement?: string;
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    applicationDeadline?: string;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    applyGate?: { enabled: boolean } & Partial<ProfileGateSummary>;
  };
};

type MissingProfileField = { key: string; label: string; weight: number };

type ProfileGateSummary = {
  score: number;
  threshold: number;
  canApply: boolean;
  missingRequired: MissingProfileField[];
};

type EditableProfileField =
  | "fullName"
  | "highestQualification"
  | "experienceStatus"
  | "preferredRole"
  | "preferredLocation"
  | "summary"
  | "linkedinUrl"
  | "portfolioUrl"
  | "workModes";

const CandidateDashboard = () => {
  const navigate = useNavigate();
  // "profile" is the editor and "preview" the read-only employer view (audit P2-1:
  // they used to be labelled the other way round).
  const [tab, setTab] = useState<DashboardTab>("overview");
  // Back button (incl. phone) steps through tabs, leaving the page from Overview;
  // ?tab= makes each tab linkable (audit P2-4).
  useTabHistory(tab, setTab, "overview", { urlParam: "tab", validTabs: DASHBOARD_TABS });
  const [chatApplicationId, setChatApplicationId] = useState<string | null>(null);
  const { toast } = useToast();
  // Other action failures (uploads, downloads, logout) become a toast that stays
  // until dismissed — the global "Backend is unavailable" banner is gone (audit P0-6).
  const setError = (message: string) => {
    if (message) toast({ variant: "destructive", title: "That didn't work", description: message, duration: Infinity });
  };
  const [currentJobsPage, setCurrentJobsPage] = useState(1);
  const [jobSearch, setJobSearch] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [jobLocationFilter, setJobLocationFilter] = useState("all");
  const [jobReadinessFilter, setJobReadinessFilter] = useState<"all" | "ready">("all");
  const [jobSort, setJobSort] = useState<"newest" | "match">("newest");
  const [applyLoadingJobId, setApplyLoadingJobId] = useState<string | null>(null);
  // Apply review sheet: the job being reviewed and that attempt's error (audit §6.4).
  const [reviewJob, setReviewJob] = useState<JobsResponse["data"][number] | null>(null);
  const [applyError, setApplyError] = useState("");
  // Save failures are shown next to the Save button, not in a global banner.
  const [saveError, setSaveError] = useState("");
  // 412: the profile changed elsewhere since this form was filled.
  const [profileConflict, setProfileConflict] = useState(false);
  // Starts true so SSR and first paint match; the real value is read after mount.
  const [gateIntroDismissed, setGateIntroDismissed] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const [expandedProfileApplicationId, setExpandedProfileApplicationId] = useState<string | null>(null);
  const [resumeSaving, setResumeSaving] = useState(false);
  const [resumeDownloading, setResumeDownloading] = useState(false);
  const [resumeNotice, setResumeNotice] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(false);
  const [certificateUploading, setCertificateUploading] = useState(false);
  // Initialise to null so server HTML and the first client render match (session
  // lives in localStorage, browser-only). The boot effect sets it after mount.
  const [sessionState, setSessionState] = useState<ReturnType<typeof getSession>>(null);

  const queryClient = useQueryClient();
  const isCandidateSession = Boolean(sessionState?.accessToken && sessionState.user.role === "candidate");

  // Live updates replace the old 5-second poll: a server event invalidates
  // exactly the resources it changed.
  const { status: liveStatus } = useServerEvents({
    enabled: isCandidateSession,
    onEvent: ({ type }) => {
      if (type === "application-created" || type === "application-updated" || type === "message") {
        void queryClient.invalidateQueries({ queryKey: candidateKeys.dashboard });
        void queryClient.invalidateQueries({ queryKey: candidateKeys.applications });
      }
      if (type === "application-created" || type === "application-updated") {
        void queryClient.invalidateQueries({ queryKey: candidateKeys.jobs });
      }
    },
  });
  // Only while the live channel is down do status changes need a (slow) poll.
  const fallbackPoll = liveStatus === "connected" ? false : 60_000;

  const dashboardQuery = useQuery({ ...dashboardQueryOptions, enabled: isCandidateSession, refetchInterval: fallbackPoll });
  const profileQuery = useQuery({ ...profileQueryOptions, enabled: isCandidateSession });
  const applicationsQuery = useQuery({
    ...applicationsQueryOptions,
    enabled: isCandidateSession,
    refetchInterval: fallbackPoll,
  });
  const resumeQuery = useQuery({ ...resumeQueryOptions, enabled: isCandidateSession });
  // keepPreviousData: the current page stays on screen while the next one loads.
  const jobsQuery = useQuery({
    ...jobsPageQueryOptions(currentJobsPage),
    enabled: isCandidateSession,
    placeholderData: keepPreviousData,
  });
  // Certificates are only shown in the editor: fetched on first visit, not on load.
  const certificatesQuery = useQuery({ ...certificatesQueryOptions, enabled: isCandidateSession && tab === "profile" });

  const loading = isCandidateSession && dashboardQuery.isPending;
  const dashboard = dashboardQuery.data ?? null;
  const profile = profileQuery.data ?? dashboard?.profile ?? null;
  const applications = applicationsQuery.data ?? EMPTY_APPLICATIONS;
  const jobs = jobsQuery.data?.data ?? EMPTY_JOBS;
  const jobsMeta = jobsQuery.data?.meta ?? null;
  const jobsLoadingMore = jobsQuery.isPlaceholderData;
  const resumeMeta = resumeQuery.data ?? null;
  const certificates = certificatesQuery.data ?? EMPTY_CERTIFICATES;
  const profilePhotoUrl = profile?.profilePhotoUrl || null;
  const loadErrorMessage = dashboardQuery.error?.message || jobsQuery.error?.message || "";

  // Optimistic concurrency (audit P1-4). Every profile write sends If-Match with
  // a revision; the server answers 412 if someone else saved in between.
  // formRevisionRef is the revision the editor form was filled from — full-form
  // saves must use it, not the latest cached profile (a background refetch can
  // bring in another tab's change the form never saw).
  const formRevisionRef = useRef<number | null>(null);
  const patchProfile = async (payload: Record<string, unknown>, revision: number | null | undefined = profile?.profileRevision) => {
    const res = await apiPatch<CandidateProfileResponse>("/users/candidate/me", payload, {
      auth: true,
      headers: typeof revision === "number" ? { "If-Match": `"${revision}"` } : {},
    });
    // This tab's own write: if the form was in sync before it, it still is.
    if (formRevisionRef.current === revision) formRevisionRef.current = res.data?.profileRevision ?? null;
    return res;
  };

  // Cache writers/invalidators keep the existing save handlers unchanged.
  const setProfile = (data: CandidateProfileResponse["data"]) =>
    queryClient.setQueryData(profileQueryOptions.queryKey, data);
  const setResumeMeta = (next: ResumeMeta | null | ((prev: ResumeMeta | null | undefined) => ResumeMeta | null)) =>
    queryClient.setQueryData(resumeQueryOptions.queryKey, next);
  const refreshDashboard = () => queryClient.invalidateQueries({ queryKey: candidateKeys.dashboard });
  const refreshApplications = () => queryClient.invalidateQueries({ queryKey: candidateKeys.applications });
  const refreshResumeMeta = () => queryClient.invalidateQueries({ queryKey: candidateKeys.resume });
  const refreshJobs = () => queryClient.invalidateQueries({ queryKey: candidateKeys.jobs });
  const loadCertificates = () => queryClient.invalidateQueries({ queryKey: candidateKeys.certificates });

  const [resumeForm, setResumeForm] = useState<{
    fullName: string;
    phone: string;
    city: string;
    college: string;
    linkedinUrl: string;
    portfolioUrl: string;
    highestQualification: string;
    // "" until the candidate picks one, so the score never counts an unchosen default.
    experienceStatus: "" | "fresher" | "experienced";
    experienceDetails: {
      currentCompany: string;
      designation: string;
      totalExperience: string;
      industry: string;
    };
    experience: Array<Required<ExperienceEntry>>;
    preferences: {
      preferredRole: string;
      preferredLocation: string;
      preferredIndustry: string;
      workModes: Array<"On-site" | "Hybrid" | "Remote">;
    };
    summary: string;
    skillsText: string;
    projects: Array<{ name: string; description: string }>;
    certifications: Array<{ name: string; institute: string }>;
    referral: string;
  }>({
    fullName: "",
    phone: "",
    city: "",
    college: "",
    linkedinUrl: "",
    portfolioUrl: "",
    highestQualification: "",
    experienceStatus: "",
    experienceDetails: { currentCompany: "", designation: "", totalExperience: "", industry: "" },
    experience: [],
    preferences: { preferredRole: "", preferredLocation: "", preferredIndustry: "", workModes: [] },
    summary: "",
    skillsText: "",
    projects: [],
    certifications: [],
    referral: "",
  });
  const [activeProfileField, setActiveProfileField] = useState<EditableProfileField | null>(null);
  const [inlineProfileDrafts, setInlineProfileDrafts] = useState({
    fullName: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState<string | null>(null);
  const [inlineSavingField, setInlineSavingField] = useState<EditableProfileField | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const profilePhotoPreviewObjectUrlRef = useRef<string | null>(null);

  const syncResumeFormFromProfile = (profileData?: CandidateProfileResponse["data"] | null) => {
    if (!profileData) return;
    formRevisionRef.current = typeof profileData.profileRevision === "number" ? profileData.profileRevision : null;

    setResumeForm((prev) => ({
      fullName: profileData?.fullName || "",
      phone: profileData?.phone || "",
      city: profileData?.city || "",
      college: profileData?.college || "",
      linkedinUrl: profileData?.linkedinUrl || "",
      portfolioUrl: profileData?.portfolioUrl || "",
      experience: (profileData?.experience?.length
        ? profileData.experience
        : // Profiles saved before the work-history block: seed it from the old single job.
          profileData?.experienceDetails?.currentCompany || profileData?.experienceDetails?.designation
          ? [{ company: profileData.experienceDetails.currentCompany, role: profileData.experienceDetails.designation, current: true }]
          : []
      ).map((entry) => ({
        company: entry?.company || "",
        role: entry?.role || "",
        startDate: entry?.startDate || "",
        endDate: entry?.endDate || "",
        current: Boolean(entry?.current),
      })),
      highestQualification:
        activeProfileField === "highestQualification" ? prev.highestQualification : profileData?.highestQualification || "",
      experienceStatus:
        activeProfileField === "experienceStatus"
          ? prev.experienceStatus
          : profileData?.experienceStatus || "",
      experienceDetails: {
        currentCompany: profileData?.experienceDetails?.currentCompany || "",
        designation: profileData?.experienceDetails?.designation || "",
        totalExperience: profileData?.experienceDetails?.totalExperience || "",
        industry: profileData?.experienceDetails?.industry || "",
      },
      preferences: {
        preferredRole:
          activeProfileField === "preferredRole"
            ? prev.preferences.preferredRole
            : profileData?.preferences?.preferredRole || "",
        preferredLocation:
          activeProfileField === "preferredLocation"
            ? prev.preferences.preferredLocation
            : profileData?.preferences?.preferredLocation || "",
        preferredIndustry: profileData?.preferences?.preferredIndustry || "",
        workModes:
          activeProfileField === "workModes"
            ? prev.preferences.workModes
            : profileData?.preferences?.workModes || [],
      },
      summary: activeProfileField === "summary" ? prev.summary : profileData?.summary || "",
      skillsText: (profileData?.skills || []).join(", "),
      projects: (profileData?.projects || []).map((p) => ({
        name: p?.name || "",
        description: p?.description || "",
      })),
      certifications: (profileData?.certifications || []).map((c) => ({
        name: c?.name || "",
        institute: c?.institute || "",
      })),
      referral: profileData?.referral || "",
    }));
  };

  useEffect(() => {
    setInlineProfileDrafts({
      fullName: profile?.fullName || "",
      linkedinUrl: profile?.linkedinUrl || "",
      portfolioUrl: profile?.portfolioUrl || "",
    });
  }, [profile]);

  useEffect(() => {
    if (!profilePhotoUrl || !profilePhotoPreviewUrl) return;

    if (profilePhotoPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(profilePhotoPreviewObjectUrlRef.current);
      profilePhotoPreviewObjectUrlRef.current = null;
    }
    setProfilePhotoPreviewUrl(null);
  }, [profilePhotoPreviewUrl, profilePhotoUrl]);

  useEffect(() => {
    return () => {
      if (profilePhotoPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(profilePhotoPreviewObjectUrlRef.current);
      }
    };
  }, []);

  // Fill the editor once, when the profile first arrives. Later background
  // refreshes must not overwrite what the candidate is typing; saves re-sync
  // explicitly via syncResumeFormFromProfile(res.data).
  const formSyncedRef = useRef(false);
  useEffect(() => {
    if (formSyncedRef.current || !profile) return;
    formSyncedRef.current = true;
    syncResumeFormFromProfile(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately once per mount, see above
  }, [profile]);

  // After a 412: fetch the latest saved profile and refill the form from it.
  const reloadProfileForm = async () => {
    const latest = await queryClient.fetchQuery({ ...profileQueryOptions, staleTime: 0 });
    syncResumeFormFromProfile(latest);
    setProfileConflict(false);
    setSaveError("");
    setResumeNotice("Loaded your latest saved profile. Make your change again, then save.");
  };

  // On an auth failure the API layer clears the dead session; rather than
  // showing a broken dashboard, send the user to login to sign in again.
  useEffect(() => {
    if (dashboardQuery.isError && !getSession()?.accessToken) {
      navigate("/login?role=candidate", { replace: true });
    }
  }, [dashboardQuery.isError, navigate]);

  useEffect(() => {
    const boot = async () => {
      let session = getSession();
      if (!session?.accessToken) {
        session = await tryAutoLogin();
      }

      setSessionState(session);

      if (!session?.accessToken) {
        navigate("/login?role=candidate");
        return;
      }

      // The stored session belongs to a different role (e.g. a client signed in
      // on this browser). Send them to their own dashboard rather than logging
      // them out, so a refresh never dumps a valid session at the login page.
      if (session.user.role !== "candidate") {
        navigate(session.user.role === "client" ? "/dashboard/client" : "/login");
        return;
      }
      // Data loads from here via the queries above (enabled by sessionState).
    };

    void boot();
  }, []);

  const jobTypeOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.employmentType).filter(Boolean))).sort(),
    [jobs],
  );

  const jobLocationOptions = useMemo(
    () =>
      Array.from(
        new Set(jobs.map((job) => job.jobLocation?.trim()).filter((location) => location && location !== PLACEHOLDER_LOCATION)),
      ).sort(),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();

    const matching = jobs.filter((job) => {
      const matchesQuery =
        !query ||
        [
          job.jobTitle,
          job.companyName,
          job.department,
          job.jobLocation,
          job.description,
          ...(job.skills || []),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesType = jobTypeFilter === "all" || job.employmentType === jobTypeFilter;
      const matchesLocation = jobLocationFilter === "all" || job.jobLocation?.trim() === jobLocationFilter;
      const matchesReadiness =
        jobReadinessFilter === "all" ||
        (jobReadinessFilter === "ready" && job.canApply !== false);

      return matchesQuery && matchesType && matchesLocation && matchesReadiness;
    });

    if (jobSort !== "match") return matching;
    const prefs = {
      preferredRole: profile?.preferences?.preferredRole,
      preferredLocation: profile?.preferences?.preferredLocation,
      skills: profile?.skills,
    };
    // Stable sort: equal scores keep the newest-first order from the server.
    return matching
      .map((job, index) => ({ job, index, score: scoreJobMatch(job, prefs) }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((entry) => entry.job);
  }, [jobLocationFilter, jobReadinessFilter, jobSearch, jobSort, jobTypeFilter, jobs, profile]);

  const readyToApplyCount = useMemo(() => jobs.filter((job) => job.canApply !== false).length, [jobs]);

  useEffect(() => {
    if (!applications.length) {
      setExpandedApplicationId(null);
      return;
    }

    setExpandedApplicationId((current) => {
      if (current && applications.some((application) => application._id === current)) {
        return current;
      }
      return null;
    });
  }, [applications]);

  const activeApplicationId = expandedApplicationId;
  const mobileApplicationOpen = Boolean(expandedApplicationId);

  const selectedApplication = useMemo(
    () =>
      activeApplicationId
        ? applications.find((application) => application._id === activeApplicationId) || null
        : null,
    [activeApplicationId, applications],
  );

  const reachedStatuses = useMemo(() => {
    const set = new Set<string>();
    if (!selectedApplication) return set;

    // Linear progress: mark every stage up to the current status as reached,
    // even when the client skipped intermediate stages, so the journey never
    // shows green stages with a grey gap in between.
    const order = ["applied", "under-review", "screening", "interview", "offer", "hired"];
    const currentIdx = order.indexOf(selectedApplication.status);
    const reachedUpTo = currentIdx >= 0 ? currentIdx : 0;
    for (let i = 0; i <= reachedUpTo; i += 1) {
      set.add(order[i]);
    }
    set.add("applied");

    // For a rejected application, still show how far it had progressed.
    if (selectedApplication.status === "rejected") {
      (selectedApplication.timeline || []).forEach((item) => {
        if (item.status && item.status !== "rejected") set.add(item.status);
      });
      set.add("rejected");
    }

    return set;
  }, [selectedApplication]);

  const steps = useMemo(() => {
    const baseSteps = [
      { id: "applied", label: "Applied", desc: "Submitted successfully" },
      { id: "under-review", label: "Under Review", desc: "Recruiter reviewed" },
      { id: "screening", label: "Shortlisted", desc: "Passed screening" },
      { id: "interview", label: "Interview", desc: "Interviews scheduled" },
      { id: "offer", label: "Offer Received", desc: "Job offer shared" },
    ];

    if (selectedApplication?.status === "rejected") {
      return [
        ...baseSteps,
        { id: "rejected", label: "Rejected", desc: "Application closed" },
      ];
    }

    return [
      ...baseSteps,
      { id: "hired", label: "Hired", desc: "Welcomed to the team!" },
    ];
  }, [selectedApplication?.status]);

  // The ring in the editor recomputes from unsaved edits with the server's own
  // scoring function, so it moves as the candidate types (display only — the
  // server re-derives the score before letting anyone apply).
  const liveCompletion = useMemo((): CompletionResult | null => {
    if (!profile) return null;
    return computeProfileCompletion({
      profile: {
        ...profile,
        fullName: resumeForm.fullName,
        college: resumeForm.college,
        highestQualification: resumeForm.highestQualification,
        experienceStatus: resumeForm.experienceStatus,
        experience: resumeForm.experience,
        summary: resumeForm.summary,
        skills: resumeForm.skillsText.split(","),
        preferences: resumeForm.preferences,
        projects: resumeForm.projects,
        certifications: resumeForm.certifications,
      },
      user: { email: sessionState?.user.email, mobile: resumeForm.phone },
      resume: resumeFile ? { resumeType: "uploaded", resumeFileId: "pending-upload" } : resumeMeta,
      certificateFileCount: certificates.length,
    }) as CompletionResult;
  }, [profile, resumeForm, resumeFile, resumeMeta, certificates, sessionState]);

  // Open the editor and move focus straight to the control for a checklist item
  // (audit §6.2). Runs after the tab renders so the target exists.
  const focusProfileField = (key: string) => {
    setTab("profile");
    window.setTimeout(() => {
      const id =
        key === "experienceDetail"
          ? resumeForm.experienceStatus !== "experienced"
            ? "cp-experience-status"
            : resumeForm.experience.length
              ? "cp-exp-0-company"
              : "cp-add-job"
          : FIELD_CONTROL_IDS[key];
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      target.focus({ preventScroll: true });
    }, 0);
  };

  // Blocked from applying: take the candidate to the first thing still missing.
  const openProfileGate = (summary?: Partial<ProfileGateSummary> | null) => {
    const first = summary?.missingRequired?.[0]?.key ?? dashboard?.completion?.missingRequired?.[0]?.key;
    if (first) focusProfileField(first);
    else setTab("profile");
  };

  const applyToJob = async (job: JobsResponse["data"][number], note: string) => {
    if (applyLoadingJobId) return;
    setApplyLoadingJobId(job._id);
    setApplyError("");
    try {
      await applyToJobRequest(job._id, { note, declarationAccepted: true });
      setReviewJob(null);
      toast({ title: "Application sent", description: `Applied to ${job.jobTitle}. The employer can now message you.` });
      await Promise.all([refreshDashboard(), refreshApplications(), refreshJobs()]);
      // The application now lives as a chat thread with the employer.
      openChat();
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "PROFILE_INCOMPLETE") {
        setReviewJob(null);
        openProfileGate(err.data as Partial<ProfileGateSummary>);
        return;
      }
      if (err instanceof ApiClientError && err.code === "ALREADY_APPLIED") {
        void Promise.all([refreshApplications(), refreshJobs()]);
      }
      // Shown inside the sheet; resubmitting reuses the same idempotency key, so it is safe.
      setApplyError(err instanceof Error ? err.message : "We couldn't send your application.");
    } finally {
      setApplyLoadingJobId(null);
    }
  };

  useEffect(() => {
    try {
      setGateIntroDismissed(window.localStorage.getItem(GATE_INTRO_DISMISSED_KEY) === "1");
    } catch {
      setGateIntroDismissed(false);
    }
  }, []);

  const dismissGateIntro = () => {
    setGateIntroDismissed(true);
    try {
      window.localStorage.setItem(GATE_INTRO_DISMISSED_KEY, "1");
    } catch {
      // Private mode / blocked storage: the banner just reappears next visit.
    }
  };

  const saveResume = async () => {
    setResumeSaving(true);
    setSaveError("");
    setResumeNotice("");
    try {
      const skills = resumeForm.skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const projects = (resumeForm.projects || [])
        .map((p) => ({ name: p.name.trim(), description: p.description.trim() }))
        .filter((p) => p.name || p.description);

      const certifications = (resumeForm.certifications || [])
        .map((c) => ({ name: c.name.trim(), institute: c.institute.trim() }))
        .filter((c) => c.name || c.institute);

      const experience = resumeForm.experience
        .map((entry) => ({
          company: entry.company.trim(),
          role: entry.role.trim(),
          startDate: entry.startDate,
          endDate: entry.current ? "" : entry.endDate,
          current: entry.current,
        }))
        .filter((entry) => entry.company || entry.role);

      const payload: Record<string, unknown> = {
        experienceStatus: resumeForm.experienceStatus || undefined,
        summary: resumeForm.summary.trim(),
        skills,
        projects,
        certifications,
        referral: resumeForm.referral.trim(),
        city: resumeForm.city.trim(),
        college: resumeForm.college.trim(),
        linkedinUrl: resumeForm.linkedinUrl.trim(),
        portfolioUrl: resumeForm.portfolioUrl.trim(),
      };

      // Name and phone can't be cleared once set: only send them when filled.
      const fullName = resumeForm.fullName.trim();
      if (fullName) payload.fullName = fullName;
      const phone = resumeForm.phone.trim();
      if (phone) payload.mobile = phone;

      const highestQualification = resumeForm.highestQualification.trim();
      if (highestQualification) {
        payload.highestQualification = highestQualification;
      }

      const preferredRole = resumeForm.preferences.preferredRole.trim();
      const preferredLocation = resumeForm.preferences.preferredLocation.trim();
      const preferredIndustry = resumeForm.preferences.preferredIndustry.trim();
      const workModes = resumeForm.preferences.workModes;
      if (preferredRole || preferredLocation || preferredIndustry || workModes.length) {
        payload.preferences = {
          ...(preferredRole ? { preferredRole } : {}),
          ...(preferredLocation ? { preferredLocation } : {}),
          ...(preferredIndustry ? { preferredIndustry } : {}),
          ...(workModes.length ? { workModes } : {}),
        };
      }

      if (resumeForm.experienceStatus === "experienced") {
        // currentCompany/designation are derived server-side from the experience entries.
        payload.experienceDetails = {
          totalExperience: resumeForm.experienceDetails.totalExperience.trim(),
          industry: resumeForm.experienceDetails.industry.trim(),
        };
        payload.experience = experience;
      }

      if (resumeFile) {
        const asset = await uploadFile(resumeFile, "resumes");
        payload.resumeType = "uploaded";
        payload.resumeUrl = asset.url;
        payload.resumeFileId = asset.fileId;
        payload.resumeFileName = resumeFile.name;
      } else {
        // The server builds the generated resume from the saved profile.
        payload.resumeType = "generated";
      }

      // Full-form save: guard with the revision the form was filled from.
      const res = await patchProfile(payload, formRevisionRef.current);

      setProfile(res.data);
      syncResumeFormFromProfile(res.data);
      setProfileConflict(false);
      setResumeMeta((prev) =>
        resumeFile
            ? {
                resumeType: "uploaded",
                resumeUrl: payload.resumeUrl as string,
                resumeFileId: payload.resumeFileId as string,
                fileName: resumeFile.name,
                resumeId: prev?.resumeId,
              }
            : {
                resumeType: "generated",
                resumeId: prev?.resumeId,
                resumeUrl: "",
                resumeFileId: "",
                fileName: "",
              },
      );
      setResumeFile(null);
      void refreshDashboard().catch(() => {}); // completion score is recomputed server-side on save
      setResumeNotice(
        resumeFile
          ? "Resume PDF uploaded and saved successfully."
          : "Resume saved as generated resume successfully.",
      );
      void refreshResumeMeta();
    } catch (err) {
      const message = err instanceof Error ? err.message : "We couldn't save your profile.";
      setSaveError(message);
      setProfileConflict(err instanceof ApiClientError && err.code === "PROFILE_VERSION_CONFLICT");
      // Also called from the Preview tab's inline edits, where the inline error isn't visible.
      if (tab !== "profile") setError(message);
    } finally {
      setResumeSaving(false);
    }
  };

  const handleResumeFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError("");

    if (!file) {
      setResumeFile(null);
      return;
    }

    try {
      validateUploadFile(file, "resumes");
      setResumeFile(file);
      setResumeNotice(
        "New resume selected. Click Save to upload it. If you save without a PDF selected, your text edits will be saved as a generated resume.",
      );
    } catch (err) {
      setResumeFile(null);
      setError(err instanceof Error ? err.message : "Invalid resume file");
      e.currentTarget.value = "";
    }
  };

  const saveInlineProfile = async (
    field: EditableProfileField,
    payload: Partial<CandidateProfileResponse["data"]> & {
      preferences?: CandidateProfileResponse["data"]["preferences"];
    },
  ) => {
    setInlineSavingField(field);
    setError("");
    setResumeNotice("");
    try {
      const res = await patchProfile(payload);
      setProfile(res.data);
      syncResumeFormFromProfile(res.data);
      setActiveProfileField(null);
      void refreshDashboard().catch(() => {});
      setResumeNotice("Resume saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setInlineSavingField(null);
    }
  };

  const commitResumeField = async (field: EditableProfileField) => {
    if (inlineSavingField) return;

    if (
      field === "highestQualification" &&
      (resumeForm.highestQualification || "") === (profile?.highestQualification || "")
    ) {
      setActiveProfileField(null);
      return;
    }

    if (
      field === "experienceStatus" &&
      (resumeForm.experienceStatus || "") === (profile?.experienceStatus || "")
    ) {
      setActiveProfileField(null);
      return;
    }

    if (
      field === "preferredRole" &&
      (resumeForm.preferences.preferredRole || "") === (profile?.preferences?.preferredRole || "")
    ) {
      setActiveProfileField(null);
      return;
    }

    if (
      field === "preferredLocation" &&
      (resumeForm.preferences.preferredLocation || "") === (profile?.preferences?.preferredLocation || "")
    ) {
      setActiveProfileField(null);
      return;
    }

    if (field === "summary" && (resumeForm.summary || "") === (profile?.summary || "")) {
      setActiveProfileField(null);
      return;
    }

    if (
      field === "workModes" &&
      JSON.stringify(resumeForm.preferences.workModes || []) ===
        JSON.stringify(profile?.preferences?.workModes || [])
    ) {
      setActiveProfileField(null);
      return;
    }

    await saveResume();
    setActiveProfileField(null);
  };

  const commitInlineProfileField = async (field: "fullName" | "linkedinUrl" | "portfolioUrl") => {
    if (inlineSavingField) return;

    const nextValue = inlineProfileDrafts[field];
    const currentValue = profile?.[field] || "";
    if (nextValue === currentValue) {
      setActiveProfileField(null);
      return;
    }

    await saveInlineProfile(field, { [field]: nextValue } as Partial<CandidateProfileResponse["data"]>);
  };

  const displayedProfilePhotoUrl = profilePhotoPreviewUrl || profilePhotoUrl;

  const handleProfilePhotoSelect = async (file?: File) => {
    if (!file) return;

    if (profilePhotoPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(profilePhotoPreviewObjectUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    profilePhotoPreviewObjectUrlRef.current = previewUrl;
    setProfilePhotoPreviewUrl(previewUrl);
    await uploadProfilePhoto(file);
  };

  const handleInlineInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    onCommit: () => void | Promise<void>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey && event.currentTarget.tagName !== "TEXTAREA") {
      event.preventDefault();
      void onCommit();
      event.currentTarget.blur();
    }
  };

  const downloadResumePdf = async () => {
    setResumeDownloading(true);
    setError("");
    try {
      const session = getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");

        const resumeMeta = await apiGet<{
          success?: boolean;
          data?: {
            resumeId?: string;
            resumeType?: "uploaded" | "generated";
            resumeUrl?: string;
          };
        }>("/resumes/mine", true);

        if (resumeMeta?.data?.resumeType === "uploaded") {
          if (!resumeMeta.data.resumeUrl) {
            throw new Error("Resume URL is missing");
          }

          window.open(resumeMeta.data.resumeUrl, "_blank", "noopener,noreferrer");
          return;
        }

        if (!resumeMeta?.data?.resumeId) {
          throw new Error("Resume record is missing");
        }

        const res = await fetch(`${API_BASE}/resume/download/${resumeMeta.data.resumeId}`, {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "Failed to download resume";
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(profile?.fullName || "Resume").replace(/\s+/g, "_")}_RecruitKr.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download resume");
    } finally {
      setResumeDownloading(false);
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    setError("");
    setProfilePhotoLoading(true);
    try {
      const asset = await uploadFile(file, "profiles");
      const res = await patchProfile({
          profilePhotoUrl: asset.url,
          profilePhotoFileId: asset.fileId,
        });
      setProfile(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setProfilePhotoLoading(false);
    }
  };

  const removeProfilePhoto = async () => {
    setError("");
    setProfilePhotoLoading(true);
    try {
      const res = await patchProfile({
          profilePhotoUrl: "",
          profilePhotoFileId: "",
        });
      setProfile(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setProfilePhotoLoading(false);
    }
  };

  const uploadCertificate = async (file: File, title: string) => {
    setCertificateUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      await apiPost("/users/candidate/certificates", fd, true);
      await loadCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload certificate");
    } finally {
      setCertificateUploading(false);
    }
  };

  const downloadCertificate = async (certificateUrl: string | undefined, fileName: string) => {
    setError("");
    try {
      const a = document.createElement("a");
      if (!certificateUrl) throw new Error("Certificate URL not found");
      a.href = certificateUrl;
      a.download = fileName || "certificate";
      a.target = "_blank";
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download certificate");
    }
  };

  const deleteCertificate = async (certificateId: string) => {
    setError("");
    try {
      await apiDelete(`/users/candidate/certificates/${certificateId}`, true);
      await loadCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete certificate");
    }
  };

  // The page is part of the query key: changing it fetches (or reads the cached) page.
  const goToJobsPage = (page: number) => {
    if (page < 1 || jobsLoadingMore) return;
    setCurrentJobsPage(page);
  };

  const logout = async () => {
    try {
      await apiPost("/auth/logout", { refreshToken: getSession()?.refreshToken });
    } catch {
      // No-op
    }
    clearSession();
    setSessionState(null);
    // replace so Back after logout can't re-enter the dashboard.
    navigate("/login", { replace: true });
  };

  const openChat = (applicationId?: string | null) => {
    setChatApplicationId(applicationId ?? null);
    setTab("messages");
  };

  if (!sessionState?.accessToken || loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8" aria-busy="true" aria-label="Loading dashboard">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="skeleton h-5 w-40 rounded-lg" />
            <div className="skeleton h-3 w-56 rounded-lg" />
          </div>
          <div className="skeleton h-9 w-9 rounded-xl" />
        </div>
        {/* Hero */}
        <div className="skeleton mb-6 h-40 w-full rounded-3xl" />
        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
        {/* List rows */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Candidate destinations: overview, find jobs, applied jobs (read details +
  // chat), chat, profile and card.
  const candidateTabs: DashboardNavItem<typeof tab>[] = [
    { key: "overview", label: "Overview", icon: Sparkles },
    { key: "jobs", label: "Find Jobs", icon: BriefcaseBusiness },
    { key: "applications", label: "Applied Jobs", icon: FileText },
    { key: "messages", label: "My Chat", icon: MessageSquare },
    { key: "profile", label: "Profile", icon: Pencil },
    { key: "preview", label: "Preview", icon: UserCircle2 },
  ];

  const profileSummaryCards = [
    {
      key: "total",
      label: "Total Applications",
      value: applications.length,
      icon: FileText,
      tone: "border-[#264a7f]/10 bg-white text-[#264a7f]",
      helper: "All jobs you have applied to",
    },
    {
      key: "completion",
      label: "Profile Completion",
      value: `${dashboard?.stats.profileCompletion || 0}%`,
      icon: UserCircle2,
      tone: "border-[#264a7f]/10 bg-white text-[#264a7f]",
      helper: "Profile readiness score",
    },
    {
      key: "active",
      label: "Active Applications",
      value: applications.filter((application) => !["rejected", "hired"].includes(application.status)).length,
      icon: Clock3,
      tone: "border-sky-200 bg-white text-sky-700",
      helper: "Still in progress",
    },
    {
      key: "rejected",
      label: "Rejected Applications",
      value: applications.filter((application) => application.status === "rejected").length,
      icon: XCircle,
      tone: "border-red-200 bg-white text-red-700",
      helper: "Closed by employer",
    },
    {
      key: "shortlisted",
      label: "Shortlisted / Interview",
      value: applications.filter((application) =>
        ["screening", "interview", "offer"].includes(application.status),
      ).length,
      icon: CheckCircle2,
      tone: "border-emerald-200 bg-white text-emerald-700",
      helper: "Promising opportunities",
    },
  ];

  const recentApplicationUpdates = [...applications]
    .flatMap((application) => {
      const timeline =
        application.timeline && application.timeline.length
          ? application.timeline
          : [
              {
                status: application.status,
                changedAt: application.statusUpdatedAt || application.createdAt,
                note: application.statusNote,
              },
            ];

      return timeline.map((item, index) => ({
        id: `${application._id}-${item.status}-${index}`,
        applicationId: application._id,
        jobTitle: application.jobId?.jobTitle || application.appliedFor || "Job application",
        companyName: application.jobId?.sourceLabel || application.jobId?.sourceCollection || "RecruitKr",
        status: item.status,
        changedAt: item.changedAt || application.statusUpdatedAt || application.createdAt,
        message:
          item.note ||
          (item.status === "under-review"
            ? "Your application has been reviewed."
            : item.status === "screening"
              ? "You have been shortlisted for the next stage."
              : item.status === "interview"
                ? "Interview scheduled. Please review the latest details."
                : item.status === "offer"
                  ? "An offer update has been shared with you."
                  : item.status === "rejected"
                    ? "This application has been marked as closed."
                    : "Your application was submitted successfully."),
      }));
    })
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    .slice(0, 6);

  const selectedProfileApplicationId =
    expandedProfileApplicationId && applications.some((application) => application._id === expandedProfileApplicationId)
      ? expandedProfileApplicationId
      : applications[0]?._id || null;

  return (
    <DashboardLayout
      eyebrow="Candidate"
      title="Candidate Dashboard"
      subtitle="Track jobs, applications, and profile updates."
      navItems={candidateTabs}
      activeKey={tab}
      onSelect={(key) => setTab(key)}
      onLogout={logout}
      onMessagesClick={() => openChat()}
      showMessagesShortcut={false}
      userLabel={profile?.fullName || sessionState?.user.email}
      headerExtra={
        <span
          className={`hidden rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${LIVE_STATUS_META[loadErrorMessage ? "degraded" : liveStatus].className}`}
        >
          {LIVE_STATUS_META[loadErrorMessage ? "degraded" : liveStatus].label}
        </span>
      }
    >
        {/* Only loading failures live here, with a way to retry; action errors are
            shown next to the control that failed (or as a dismissible toast). */}
        {loadErrorMessage && (
          <div
            role="alert"
            className="mb-4 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>We couldn&apos;t load part of your dashboard. {loadErrorMessage}</p>
            <button
              type="button"
              onClick={() => void queryClient.refetchQueries({ queryKey: candidateKeys.all, type: "active" })}
              className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* One-time explainer for the apply gate, so existing candidates aren't silently locked out. */}
        {dashboard?.completion?.gateEnabled && !dashboard.completion.canApply && !gateIntroDismissed && tab !== "profile" && (
          <div
            role="region"
            aria-label="Profile required to apply"
            className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>
              We now ask for a complete profile before applying — you&apos;re at{" "}
              <strong>{dashboard.completion.score}%</strong>
              {dashboard.completion.missingRequired.length > 0 && (
                <>
                  , <strong>{dashboard.completion.missingRequired.length}</strong> required{" "}
                  {dashboard.completion.missingRequired.length === 1 ? "item" : "items"} left
                </>
              )}
              . You need {dashboard.completion.threshold}% to apply.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => openProfileGate(dashboard.completion)}
                className="rounded-lg bg-[#264a7f] px-3 py-2 font-semibold text-white"
              >
                Complete profile
              </button>
              <button
                type="button"
                onClick={dismissGateIntro}
                className="rounded-lg border border-amber-300 px-3 py-2 font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {tab === "overview" && (
          <div className="space-y-5 sm:space-y-6">
            <div className={`${brandCardClass} relative overflow-hidden bg-[#16305a] p-5 sm:p-6 md:p-8`}>
              {/* Optional hero photo — see HERO_BG_SRC. The gradient below is a
                  complete design on its own, so nothing is missing without it. */}
              {HERO_BG_SRC ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={HERO_BG_SRC}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              {/* Animated drift gradient tint — RecruitKr design hero */}
              <div aria-hidden className="hero-drift pointer-events-none absolute inset-0" />
              {/* Diagonal texture */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 2px, transparent 2px 22px)" }}
              />
              {/* Soft vignette for text contrast over any image */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(13,26,48,.35) 0%, rgba(13,26,48,.15) 45%, rgba(13,26,48,.6) 100%)" }}
              />
              <div className="relative z-10 grid gap-6 lg:grid-cols-[1.25fr,0.75fr] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75 sm:text-xs">RecruitKr Candidate Space</p>
                  <h1 className="mt-2 font-heading text-2xl font-bold text-white break-words sm:mt-3 sm:text-3xl md:text-4xl">
                    {/* Greet by first name, never by email address (audit P2-7). */}
                    {profile?.fullName?.trim() ? `Welcome, ${profile.fullName.trim().split(/\s+/)[0]}` : "Welcome to RecruitKr"}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
                    Keep your applications moving, stay ready for interviews, and make your profile recruiter-ready.
                  </p>
                  {profile?.recruitkrId && (
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
                      <span className="text-white/60">Candidate ID</span>
                      <span className="font-mono tracking-wider">{profile.recruitkrId}</span>
                    </span>
                  )}
                  <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setTab("jobs")}
                      className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#264a7f] shadow-sm transition hover:bg-white/95 sm:w-auto"
                    >
                      Browse jobs and apply
                    </button>
                    <button
                      type="button"
                      onClick={() => openChat()}
                      className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
                    >
                      Open my chat
                    </button>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Quick Snapshot</p>
                  <div className="mt-4 space-y-3 text-sm text-white/90">
                    <p>Preferred Role: {profile?.preferences?.preferredRole || "Not set yet"}</p>
                    <p>Preferred Location: {profile?.preferences?.preferredLocation || "Not set yet"}</p>
                    <p>Work Mode: {profile?.preferences?.workModes?.join(", ") || "Not selected"}</p>
                  </div>
                </div>
              </div>
            </div>

           <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard
                icon={FileText}
                label="Applications"
                value={dashboard?.stats.applicationsSent || 0}
                tone="bg-[#264a7f]/10 text-[#264a7f]"
              />
              <StatCard
                icon={MessageSquare}
                label="Interviews"
                value={dashboard?.stats.interviewCalls || 0}
                tone="bg-sky-100 text-sky-600"
              />
              <StatCard
                icon={CheckCircle2}
                label="Offers"
                value={dashboard?.stats.offersReceived || 0}
                tone="bg-[#69a44f]/10 text-[#69a44f]"
              />
              <StatCard
                icon={UserCircle2}
                label="Profile strength"
                value={`${dashboard?.stats.profileCompletion || 0}%`}
                tone="bg-amber-100 text-amber-600"
                footer={
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{ width: `${dashboard?.stats.profileCompletion || 0}%` }}
                    />
                  </div>
                }
              />
            </div>

            {dashboard?.completion?.fields && (
              <ProfileCompletionCard
                score={dashboard.completion.score}
                threshold={dashboard.completion.threshold}
                canApply={dashboard.completion.canApply}
                fields={dashboard.completion.fields}
                headingId="overview-completion"
                onSelectField={focusProfileField}
                onBrowseJobs={() => setTab("jobs")}
              />
            )}

            {/* Recent activity */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-border dark:bg-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-foreground">Recent activity</h3>
                <button
                  type="button"
                  onClick={() => openChat()}
                  className="text-[13px] font-bold text-[#264a7f] hover:underline dark:text-[#7da7df]"
                >
                  Open my chat →
                </button>
              </div>
              {recentApplicationUpdates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Sparkles className="text-slate-300" size={28} />
                  <p className="text-sm text-slate-500">
                    No activity yet — apply to a job and updates show up here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {recentApplicationUpdates.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50 dark:hover:bg-muted/40"
                    >
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${ACTIVITY_DOT[u.status] || "bg-slate-300"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-foreground">
                          {u.jobTitle}
                        </p>
                        <p className="truncate text-[13px] text-slate-500 dark:text-muted-foreground">{u.message}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">
                        {new Date(u.changedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "jobs" && (
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5">
                <h2 className="sr-only">Find jobs</h2>
                <div className="grid gap-3 md:grid-cols-[1.4fr,1fr,1fr,1fr,auto]">
                  <SearchBar
                    value={jobSearch}
                    onChange={setJobSearch}
                    onSubmit={setJobSearch}
                    fetchSuggestions={fetchJobSuggestions}
                    placeholder="Search job title or company"
                  />

                  <label className="relative block">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      aria-label="Filter by location"
                      value={jobLocationFilter}
                      onChange={(event) => setJobLocationFilter(event.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#264a7f]/12 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#264a7f]"
                    >
                      <option value="all">All locations</option>
                      {jobLocationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="relative block">
                    <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      aria-label="Filter by job type"
                      value={jobTypeFilter}
                      onChange={(event) => setJobTypeFilter(event.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#264a7f]/12 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#264a7f]"
                    >
                      <option value="all">All job types</option>
                      {jobTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <select
                    aria-label="Sort jobs"
                    value={jobSort}
                    onChange={(event) => setJobSort(event.target.value === "match" ? "match" : "newest")}
                    className="w-full rounded-xl border border-[#264a7f]/12 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#264a7f]"
                  >
                    <option value="newest">Newest first</option>
                    <option value="match">Best match for me</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setJobSearch("");
                      setJobTypeFilter("all");
                      setJobLocationFilter("all");
                      setJobReadinessFilter("all");
                    }}
                    className="rounded-xl border border-[#264a7f]/12 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            
            <div className="space-y-4 my-10">
               
                <div className="grid gap-3 lg:grid-cols-2">
                  {filteredJobs.map((job) => {
                const isApplied = job.blockReason === "ALREADY_APPLIED";
                const isGated = job.blockReason === "PROFILE_INCOMPLETE";
                const isApplying = applyLoadingJobId === job._id;
                const missingCount = jobsMeta?.applyGate?.missingRequired?.length ?? 0;
                const isExpanded = expandedJobId === job._id;
                const applyLabel = isApplying
                  ? "Applying..."
                  : isGated
                    ? `Complete profile to apply${missingCount ? ` · ${missingCount} left` : ""}`
                    : isApplied
                      ? "Applied"
                      : job.canApply === false
                        ? "Closed"
                        : "Apply now";
                // Hide placeholders instead of rendering them as data (audit P2-2).
                const company = job.companyName?.trim() || job.sourceLabel || "";
                const location = job.jobLocation?.trim() !== PLACEHOLDER_LOCATION ? job.jobLocation?.trim() : "";
                const salary =
                  job.maxCtcLpa > 0
                    ? job.minCtcLpa > 0 && job.minCtcLpa !== job.maxCtcLpa
                      ? `${job.minCtcLpa}–${job.maxCtcLpa} LPA`
                      : `${job.maxCtcLpa} LPA`
                    : "";
                const chips = [job.department, job.experienceRequired, job.qualification].filter((value) => value?.trim());
                const meta = [location, job.employmentType !== "Not specified" ? job.employmentType : ""].filter(Boolean);

                    return (
                      <article
                        key={job._id}
                        aria-labelledby={`job-${job._id}-title`}
                        className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#264a7f]/25 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5"
                      >
                      <div className="flex items-start gap-3.5">
                        <div
                          aria-hidden="true"
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-extrabold text-white shadow-sm"
                          style={{ background: JOBS_HERO_GRADIENT }}
                        >
                          {(company || job.jobTitle || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 id={`job-${job._id}-title`} className="line-clamp-1 text-[15px] font-bold text-slate-900">
                              {job.jobTitle || "Job Opening"}
                            </h3>
                            {salary && (
                              <span className="shrink-0 rounded-full bg-[#69a44f]/10 px-2.5 py-0.5 text-xs font-bold text-[#4d7a38]">
                                {salary}
                              </span>
                            )}
                          </div>
                          {company && <p className="mt-0.5 truncate text-sm font-medium text-slate-600">{company}</p>}
                          {meta.length > 0 && (
                            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-slate-500">
                              <MapPin size={13} className="shrink-0" aria-hidden="true" />
                              {meta.join(" • ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {chips.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600" aria-label="Requirements">
                          {chips.map((chip) => (
                            <li key={chip} className="rounded-full bg-slate-100 px-3 py-1">
                              {chip}
                            </li>
                          ))}
                        </ul>
                      )}

                      {job.description?.trim() && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          <span className={isExpanded ? "" : "line-clamp-2"}>{job.description}</span>
                        </p>
                      )}

                      {isExpanded && (
                        <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                          <p><span className="font-medium text-slate-800">Work mode:</span> {job.workModes?.join(", ") || "Not specified"}</p>
                          <p><span className="font-medium text-slate-800">Industry:</span> {job.preferredIndustryBackground || "Not specified"}</p>
                          <p><span className="font-medium text-slate-800">Deadline:</span> {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : "Open until filled"}</p>
                          <p><span className="font-medium text-slate-800">Skills:</span> {job.skills?.length ? job.skills.join(", ") : "Not provided"}</p>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedJobId((current) => (current === job._id ? null : job._id))}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#264a7f] transition hover:bg-slate-50"
                        >
                          {isExpanded ? "Hide details" : "View details"}
                        </button>
                        {isGated ? (
                          // Never a plain disabled button: it must explain and lead to the fix.
                          <button
                            type="button"
                            onClick={() => openProfileGate(jobsMeta?.applyGate)}
                            className="flex-1 rounded-xl border-2 border-[#264a7f] bg-white px-4 py-2.5 text-sm font-semibold text-[#264a7f] transition hover:bg-[#264a7f]/5"
                          >
                            {applyLabel}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setApplyError("");
                              setReviewJob(job);
                            }}
                            disabled={job.canApply === false || Boolean(applyLoadingJobId)}
                            aria-busy={isApplying}
                            title={job.canApply === false && !isApplied ? job.applyDisabledReason || "Applications are not available for this opening yet." : undefined}
                            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            style={isApplied ? { background: "#69a44f" } : { background: JOBS_HERO_GRADIENT }}
                          >
                            {applyLabel}
                          </button>
                        )}
                      </div>
                  </article>
                );
                  })}
                </div>
              </div>

            {jobsMeta && jobsMeta.total > 0 && (
              <div className={`${brandCardClass} px-5 py-4`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-900">
                      Page {currentJobsPage} is showing {filteredJobs.length} jobs
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {jobsMeta.total} total active jobs across {jobsMeta.totalPages} pages {" • "} up to {JOBS_PAGE_LIMIT} jobs per page
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => void goToJobsPage(currentJobsPage - 1)}
                      disabled={jobsLoadingMore || currentJobsPage <= 1}
                      className="rounded-xl border border-[#264a7f]/12 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
                    >
                      Previous page
                    </button>
                    <button
                      onClick={() => void goToJobsPage(currentJobsPage + 1)}
                      disabled={jobsLoadingMore || currentJobsPage >= jobsMeta.totalPages}
                      className="rounded-xl border border-[#264a7f]/12 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
                    >
                      {jobsLoadingMore ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 size={15} className="animate-spin" />
                          Next page
                        </span>
                      ) : (
                        "Next page"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {filteredJobs.length === 0 && (
              <div className={`${brandCardClass} p-8 text-center`}>
                <p className="text-lg font-semibold text-slate-900">No jobs match these filters right now.</p>
                <p className="mt-2 text-sm text-slate-500">Try clearing the filters or loading more jobs to see additional openings.</p>
              </div>
            )}
          </div>
        )}



        {tab === "applications" && (
          <div className="grid gap-6">
            <div className={`${brandCardClass} overflow-hidden`}>
              <div className="border-b border-[#264a7f]/10 px-4 py-5 sm:px-6">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-semibold text-slate-900">My Applications</h2>
                  <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#264a7f] px-2 text-xs font-bold text-white">
                    {applications.length}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">Your job application history — pick one to read details and chat.</p>
              </div>
              <div className="divide-y divide-border">
                {[...(applications || [])]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((application) => {
                  const unreadCount = (application as Record<string, unknown>).unreadCandidateCount as number | undefined;
                  const expanded = expandedApplicationId === application._id;
                  const appliedJob = jobs.find((j) => j._id === application.jobId?._id);

                  return (
                    <div key={application._id}>
                      {/* Applied job card — tap to read the job info */}
                      <button
                        type="button"
                        onClick={() => setExpandedApplicationId(expanded ? null : application._id)}
                        className={`flex w-full items-center gap-4 px-4 py-4 text-left transition sm:px-6 ${
                          expanded ? "bg-[#264a7f]/5" : "hover:bg-[#264a7f]/[0.03]"
                        }`}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#264a7f] text-sm font-bold text-white shadow">
                          {(application.jobId?.jobTitle?.substring(0, 2) || "RK").toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                              {application.jobId?.jobTitle || "Job Opening"}
                            </h3>
                            <span className="whitespace-nowrap text-xs text-slate-400">
                              {new Date(application.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {application.jobId?.sourceLabel || "RecruitKr Hiring"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                PROFILE_STATUS_BADGE_CLASSNAMES[application.status]
                              }`}
                            >
                              {PROFILE_STATUS_LABELS[application.status]}
                            </span>
                            <span className="text-xs text-slate-400">
                              {application.jobId?.jobLocation || "Location pending"}
                            </span>
                            {unreadCount ? (
                              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#69A44F] px-1.5 text-xs font-bold text-white">
                                {unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>

                      {expanded && (
                        <div className="border-t border-[#264a7f]/10 bg-slate-50/50 px-4 py-5 sm:px-6">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Job information</p>
                            {appliedJob?.minCtcLpa || appliedJob?.maxCtcLpa ? (
                              <span className="shrink-0 rounded-full bg-[#69a44f]/10 px-2.5 py-0.5 text-xs font-bold text-[#4d7a38]">
                                {appliedJob.minCtcLpa || 0}–{appliedJob.maxCtcLpa || 0} LPA
                              </span>
                            ) : null}
                          </div>
                          <h4 className="mt-2 text-base font-bold text-slate-900">
                            {application.jobId?.jobTitle || appliedJob?.jobTitle || "Job Opening"}
                          </h4>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
                            <MapPin size={13} className="shrink-0" />
                            {application.jobId?.jobLocation || appliedJob?.jobLocation || "Location not shared"}
                            {" • "}
                            {application.jobId?.employmentType || appliedJob?.employmentType || "Job type pending"}
                          </p>

                          {appliedJob ? (
                            <>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                                {appliedJob.department ? <span className="rounded-full bg-slate-100 px-3 py-1">{appliedJob.department}</span> : null}
                                {appliedJob.experienceRequired ? <span className="rounded-full bg-slate-100 px-3 py-1">{appliedJob.experienceRequired}</span> : null}
                                {appliedJob.qualification ? <span className="rounded-full bg-slate-100 px-3 py-1">{appliedJob.qualification}</span> : null}
                              </div>
                              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                                {appliedJob.description || "No detailed description shared for this opening."}
                              </p>
                              {appliedJob.requirements?.length ? (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Requirements</p>
                                  <ul className="mt-2 space-y-1.5">
                                    {appliedJob.requirements.map((req, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#69a44f]" />
                                        {req}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <p className="mt-3 text-sm text-slate-500">
                              The full job description isn&apos;t available here (the posting may have closed).
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => openChat(application._id)}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#264a7f]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#264a7f] transition hover:bg-[#264a7f] hover:text-white"
                          >
                            <MessageSquare size={16} />
                            Message employer
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {applications.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-slate-500 sm:px-6">
                    No applications yet. Browse jobs and apply to start a conversation with employers.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "messages" && (
          <Messages
            embedded
            preferApplicationId={chatApplicationId}
            loginRedirect="/dashboard/candidate"
            className="h-full min-h-0 w-full flex-1"
          />
        )}



        {tab === "preview" && (
          <section className="w-full">
            <div className="w-full">
              <div className="space-y-5 sm:space-y-6">
                <div className="relative overflow-hidden rounded-2xl border border-[#264a7f]/15 bg-[#16305a] p-5 text-center shadow-sm sm:p-6 md:text-left">
                  <div aria-hidden className="hero-drift pointer-events-none absolute inset-0" />
                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">My Profile</p>
                    <h2 className="mt-1 font-heading text-2xl font-bold text-white sm:text-3xl">Candidate Profile</h2>
                    <p className="mt-2 text-sm text-white/80">
                      Your basic profile details and job preferences in one place.
                    </p>
                    {resumeNotice && <p className="mt-3 text-sm font-medium text-[#bfe6ab]">{resumeNotice}</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:text-left">
                    <button
                      type="button"
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-[#264a7f]/10 bg-slate-100 shadow-sm transition hover:border-[#264a7f]/25"
                    >
                      {displayedProfilePhotoUrl ? (
                        <img
                          src={displayedProfilePhotoUrl}
                          alt={profile?.fullName || "Candidate profile"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-500">
                          {(profile?.fullName || sessionState?.user.email || "C").trim().charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent opacity-100 transition group-hover:from-slate-900/65">
                        <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                          <Camera size={14} />
                          Edit Photo
                        </span>
                      </div>
                    </button>

                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        void handleProfilePhotoSelect(file);
                        e.currentTarget.value = "";
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Profile Info</p>

                      <div
                        className="group mt-3 rounded-lg border border-transparent px-1 py-1 transition hover:border-[#264a7f]/10 hover:bg-slate-50"
                        onClick={() => setActiveProfileField("fullName")}
                      >
                        <div className="flex flex-col items-center gap-2 md:flex-row md:items-start md:justify-between md:gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Name</p>
                            {activeProfileField === "fullName" ? (
                              <input
                                autoFocus
                                value={inlineProfileDrafts.fullName}
                                onChange={(e) =>
                                  setInlineProfileDrafts((prev) => ({ ...prev, fullName: e.target.value }))
                                }
                                onBlur={() => void commitInlineProfileField("fullName")}
                                onKeyDown={(e) => handleInlineInputKeyDown(e, () => commitInlineProfileField("fullName"))}
                                className="mt-2 w-full rounded-lg border border-[#264a7f]/15 bg-white px-3 py-2 text-center text-xl font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f] ring-0 md:text-left"
                              />
                            ) : (
                              <p className="mt-2 break-words text-2xl font-bold text-slate-900 md:truncate">
                                {profile?.fullName || "Not added"}
                              </p>
                            )}
                          </div>
                          <button type="button" aria-label="Edit name" onClick={(e) => { e.stopPropagation(); setActiveProfileField("fullName"); }} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#264a7f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"><Pencil size={15} aria-hidden="true" /></button>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-center md:text-left">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
                        <p className="mt-1 break-all text-base font-medium text-slate-800">
                          {sessionState?.user.email || "Not added"}
                        </p>
                      </div>

                      <p className="mt-3 text-sm text-slate-500">This is how employers see you. Edit it in the Profile tab.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                      <h3 className="text-center text-lg font-bold text-slate-900 md:text-left">Basic Details</h3>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div
                          className="group rounded-lg border border-gray-200 bg-slate-50 p-4 transition hover:border-[#264a7f]/15 hover:bg-white"
                          onClick={() => setActiveProfileField("highestQualification")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Qualification</p>
                              {activeProfileField === "highestQualification" ? (
                                <input
                                  autoFocus
                                  value={resumeForm.highestQualification}
                                  onChange={(e) =>
                                    setResumeForm((p) => ({ ...p, highestQualification: e.target.value }))
                                  }
                                  onBlur={() => void commitResumeField("highestQualification")}
                                  onKeyDown={(e) =>
                                    handleInlineInputKeyDown(e, () => commitResumeField("highestQualification"))
                                  }
                                  className="mt-2 w-full rounded-lg border border-[#264a7f]/15 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"
                                />
                              ) : (
                                <p className="mt-2 text-base font-semibold text-slate-900">
                                  {profile?.highestQualification || "Not added"}
                                </p>
                              )}
                            </div>
                            <button type="button" aria-label="Edit qualification" onClick={(e) => { e.stopPropagation(); setActiveProfileField("highestQualification"); }} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#264a7f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"><Pencil size={15} aria-hidden="true" /></button>
                          </div>
                        </div>

                        <div
                          className="group rounded-lg border border-gray-200 bg-slate-50 p-4 transition hover:border-[#264a7f]/15 hover:bg-white"
                          onClick={() => setActiveProfileField("experienceStatus")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Experience</p>
                              {activeProfileField === "experienceStatus" ? (
                                <div className="relative mt-2">
                                  <select
                                    autoFocus
                                    value={resumeForm.experienceStatus}
                                    onChange={(e) =>
                                      setResumeForm((p) => ({
                                        ...p,
                                        experienceStatus: e.target.value === "experienced" ? "experienced" : "fresher",
                                      }))
                                    }
                                    onBlur={() => void commitResumeField("experienceStatus")}
                                    onKeyDown={(e) =>
                                      handleInlineInputKeyDown(e, () => commitResumeField("experienceStatus"))
                                    }
                                    className="w-full appearance-none rounded-lg border border-[#264a7f]/15 bg-white px-3 py-2 text-base font-semibold capitalize text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"
                                  >
                                    <option value="" disabled>Select…</option>
                                    <option value="fresher">Fresher</option>
                                    <option value="experienced">Experienced</option>
                                  </select>
                                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                              ) : (
                                <p className="mt-2 text-base font-semibold capitalize text-slate-900">
                                  {profile?.experienceStatus || "Not added"}
                                </p>
                              )}
                            </div>
                            <button type="button" aria-label="Edit experience status" onClick={(e) => { e.stopPropagation(); setActiveProfileField("experienceStatus"); }} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#264a7f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"><Pencil size={15} aria-hidden="true" /></button>
                          </div>
                        </div>

                        <div
                          className="group rounded-lg border border-gray-200 bg-slate-50 p-4 transition hover:border-[#264a7f]/15 hover:bg-white"
                          onClick={() => setActiveProfileField("preferredRole")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Preferred Role</p>
                              {activeProfileField === "preferredRole" ? (
                                <input
                                  autoFocus
                                  value={resumeForm.preferences.preferredRole}
                                  onChange={(e) =>
                                    setResumeForm((p) => ({
                                      ...p,
                                      preferences: { ...p.preferences, preferredRole: e.target.value },
                                    }))
                                  }
                                  onBlur={() => void commitResumeField("preferredRole")}
                                  onKeyDown={(e) => handleInlineInputKeyDown(e, () => commitResumeField("preferredRole"))}
                                  className="mt-2 w-full rounded-lg border border-[#264a7f]/15 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"
                                />
                              ) : (
                                <p className="mt-2 text-base font-semibold text-slate-900">
                                  {profile?.preferences?.preferredRole || "Not added"}
                                </p>
                              )}
                            </div>
                            <button type="button" aria-label="Edit preferred role" onClick={(e) => { e.stopPropagation(); setActiveProfileField("preferredRole"); }} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#264a7f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"><Pencil size={15} aria-hidden="true" /></button>
                          </div>
                        </div>

                        <div
                          className="group rounded-lg border border-gray-200 bg-slate-50 p-4 transition hover:border-[#264a7f]/15 hover:bg-white"
                          onClick={() => setActiveProfileField("preferredLocation")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Preferred Location</p>
                              {activeProfileField === "preferredLocation" ? (
                                <input
                                  autoFocus
                                  value={resumeForm.preferences.preferredLocation}
                                  onChange={(e) =>
                                    setResumeForm((p) => ({
                                      ...p,
                                      preferences: { ...p.preferences, preferredLocation: e.target.value },
                                    }))
                                  }
                                  onBlur={() => void commitResumeField("preferredLocation")}
                                  onKeyDown={(e) =>
                                    handleInlineInputKeyDown(e, () => commitResumeField("preferredLocation"))
                                  }
                                  className="mt-2 w-full rounded-lg border border-[#264a7f]/15 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"
                                />
                              ) : (
                                <p className="mt-2 text-base font-semibold text-slate-900">
                                  {profile?.preferences?.preferredLocation
                                    ? profile.preferences.preferredLocation.replace(/^jaypur$/i, "Jaipur")
                                    : "Not added"}
                                </p>
                              )}
                            </div>
                            <button type="button" aria-label="Edit preferred location" onClick={(e) => { e.stopPropagation(); setActiveProfileField("preferredLocation"); }} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#264a7f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"><Pencil size={15} aria-hidden="true" /></button>
                          </div>
                        </div>

                        <div
                          className="group rounded-lg border border-gray-200 bg-slate-50 p-4 transition hover:border-[#264a7f]/15 hover:bg-white md:col-span-2"
                          onClick={() => setActiveProfileField("summary")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Professional Summary</p>
                              {activeProfileField === "summary" ? (
                                <textarea
                                  autoFocus
                                  rows={5}
                                  value={resumeForm.summary}
                                  onChange={(e) => setResumeForm((p) => ({ ...p, summary: e.target.value }))}
                                  onBlur={() => void commitResumeField("summary")}
                                  className="mt-2 w-full rounded-lg border border-[#264a7f]/15 bg-white px-3 py-2 text-sm leading-6 text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"
                                />
                              ) : (
                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                  {profile?.summary || "No summary added yet."}
                                </p>
                              )}
                            </div>
                            <button type="button" aria-label="Edit summary" onClick={(e) => { e.stopPropagation(); setActiveProfileField("summary"); }} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#264a7f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"><Pencil size={15} aria-hidden="true" /></button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                      <h3 className="text-center text-lg font-bold text-slate-900 md:text-left">Contact &amp; Links</h3>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
                          <p className="mt-2 break-all text-base font-semibold text-slate-900">
                            {sessionState?.user.email || "Not added"}
                          </p>
                        </div>

                        <div
                          className="group rounded-lg border border-gray-200 bg-slate-50 p-4 transition hover:border-[#264a7f]/15 hover:bg-white"
                          onClick={() => setActiveProfileField("linkedinUrl")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">LinkedIn</p>
                              {activeProfileField === "linkedinUrl" ? (
                                <input
                                  autoFocus
                                  value={inlineProfileDrafts.linkedinUrl}
                                  onChange={(e) =>
                                    setInlineProfileDrafts((prev) => ({ ...prev, linkedinUrl: e.target.value }))
                                  }
                                  onBlur={() => void commitInlineProfileField("linkedinUrl")}
                                  onKeyDown={(e) => handleInlineInputKeyDown(e, () => commitInlineProfileField("linkedinUrl"))}
                                  className="mt-2 w-full rounded-lg border border-[#264a7f]/15 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"
                                />
                              ) : (
                                <p className="mt-2 break-all text-base font-semibold text-slate-900">
                                  {profile?.linkedinUrl || "Not added"}
                                </p>
                              )}
                            </div>
                            <button type="button" aria-label="Edit LinkedIn URL" onClick={(e) => { e.stopPropagation(); setActiveProfileField("linkedinUrl"); }} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#264a7f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"><Pencil size={15} aria-hidden="true" /></button>
                          </div>
                        </div>

                        <div
                          className="group rounded-lg border border-gray-200 bg-slate-50 p-4 transition hover:border-[#264a7f]/15 hover:bg-white md:col-span-2"
                          onClick={() => setActiveProfileField("portfolioUrl")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Portfolio</p>
                              {activeProfileField === "portfolioUrl" ? (
                                <input
                                  autoFocus
                                  value={inlineProfileDrafts.portfolioUrl}
                                  onChange={(e) =>
                                    setInlineProfileDrafts((prev) => ({ ...prev, portfolioUrl: e.target.value }))
                                  }
                                  onBlur={() => void commitInlineProfileField("portfolioUrl")}
                                  onKeyDown={(e) => handleInlineInputKeyDown(e, () => commitInlineProfileField("portfolioUrl"))}
                                  className="mt-2 w-full rounded-lg border border-[#264a7f]/15 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"
                                />
                              ) : (
                                <p className="mt-2 break-all text-base font-semibold text-slate-900">
                                  {profile?.portfolioUrl || "Not added"}
                                </p>
                              )}
                            </div>
                            <button type="button" aria-label="Edit portfolio URL" onClick={(e) => { e.stopPropagation(); setActiveProfileField("portfolioUrl"); }} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#264a7f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"><Pencil size={15} aria-hidden="true" /></button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                      <h3 className="text-center text-lg font-bold text-slate-900 md:text-left">Work Mode</h3>
                      <div
                        className="group mt-5 rounded-lg border border-gray-200 bg-slate-50 p-4 transition hover:border-[#264a7f]/15 hover:bg-white"
                        onClick={() => setActiveProfileField("workModes")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Preferred Work Mode</p>
                            {activeProfileField === "workModes" ? (
                              <div className="relative mt-2">
                                <select
                                  autoFocus
                                  value={resumeForm.preferences.workModes[0] || ""}
                                  onChange={(e) =>
                                    setResumeForm((p) => ({
                                      ...p,
                                      preferences: {
                                        ...p.preferences,
                                        workModes: e.target.value ? [e.target.value as "On-site" | "Hybrid" | "Remote"] : [],
                                      },
                                    }))
                                  }
                                  onBlur={() => void commitResumeField("workModes")}
                                  onKeyDown={(e) => handleInlineInputKeyDown(e, () => commitResumeField("workModes"))}
                                  className="w-full appearance-none rounded-lg border border-[#264a7f]/15 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"
                                >
                                  <option value="">Select work mode</option>
                                  <option value="On-site">On-site</option>
                                  <option value="Hybrid">Hybrid</option>
                                  <option value="Remote">Remote</option>
                                </select>
                                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              </div>
                            ) : (
                              <p className="mt-2 text-base font-semibold text-slate-900">
                                {profile?.preferences?.workModes?.length
                                  ? profile.preferences.workModes.join(", ")
                                  : "Not added"}
                              </p>
                            )}
                          </div>
                          <button type="button" aria-label="Edit work mode" onClick={(e) => { e.stopPropagation(); setActiveProfileField("workModes"); }} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#264a7f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]"><Pencil size={15} aria-hidden="true" /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                      <h3 className="text-center text-lg font-bold text-slate-900 md:text-left">Quick Snapshot</h3>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="rounded-lg border border-gray-200 bg-slate-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Applications</p>
                          <p className="mt-3 text-3xl font-bold text-slate-900">
                            {dashboard?.stats.applicationsSent || 0}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">Roles you have already applied for</p>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-slate-50 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Profile Completion</p>
                            <span className="text-sm font-semibold text-[#264a7f]">
                              {dashboard?.stats.profileCompletion || 0}%
                            </span>
                          </div>
                          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-[#264a7f] transition-all"
                              style={{ width: `${Math.max(0, Math.min(100, dashboard?.stats.profileCompletion || 0))}%` }}
                            />
                          </div>
                          <p className="mt-3 text-sm text-slate-500">
                            Complete more details to strengthen your candidate profile.
                          </p>
                        </div>
                      </div>
                    </div>

                    {(inlineSavingField || resumeSaving || profilePhotoLoading) && (
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm text-slate-500 shadow-sm">
                        Saving your latest profile updates...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "profile" && (
          <div className="space-y-4">
            {liveCompletion && (
              <ProfileCompletionCard
                {...liveCompletion}
                live={liveCompletion.score !== dashboard?.completion?.score}
                headingId="editor-completion"
                onSelectField={focusProfileField}
                onBrowseJobs={() => setTab("jobs")}
              />
            )}
            <div id="cp-videos" tabIndex={-1} className="rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#264a7f]">
              <CandidateVideos />
            </div>
            <form
              aria-labelledby="cp-heading"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void saveResume();
              }}
            >
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="cp-heading" className="font-heading text-xl font-bold">Edit your profile</h2>
                  <p className="text-sm text-muted-foreground">
                    Fill only what you have; empty sections will be hidden in the PDF.{" "}
                    Fields marked <span aria-hidden="true" className="text-red-500">*</span>
                    <span className="sr-only">as required</span> are needed before you can apply to jobs.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current resume type: {resumeMeta?.resumeType === "uploaded" ? "Uploaded PDF" : "Generated from form"}
                  </p>
                  {resumeMeta?.resumeType === "uploaded" && !resumeFile && resumeMeta.fileName ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Current file: {resumeMeta.fileName}
                    </p>
                  ) : null}
                  <p role="status" aria-live="polite" className="mt-2 text-sm text-green-700">
                    {resumeNotice}
                  </p>
                  {saveError && (
                    <div role="alert" className="mt-2 text-sm font-medium text-red-700">
                      <p>{saveError}</p>
                      {profileConflict && (
                        <button
                          type="button"
                          onClick={() => void reloadProfileForm().catch(() => setSaveError("We couldn't reload your profile. Please refresh the page."))}
                          className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-semibold"
                        >
                          Reload latest profile
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={resumeSaving}
                    aria-busy={resumeSaving}
                    className="btn-gradient rounded-lg px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {resumeSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={downloadResumePdf}
                    disabled={resumeDownloading}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {resumeDownloading ? "Preparing..." : "Download PDF"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-border bg-background/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <label htmlFor="cp-resume-file" className="text-sm font-semibold text-foreground">
                      Upload Resume PDF
                    </label>
                    <p id="cp-resume-file-hint" className="text-xs text-muted-foreground">
                      PDF only, max {Math.round(uploadRules.resumeMaxBytes / (1024 * 1024))}MB. Save with a selected file to keep this resume as uploaded.
                    </p>
                  </div>
                  <input
                    id="cp-resume-file"
                    name="resumeFile"
                    aria-describedby="cp-resume-file-hint"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleResumeFileSelect}
                    className="text-sm"
                    disabled={resumeSaving}
                  />
                </div>
                {resumeFile ? (
                  <p className="mt-3 text-sm text-foreground">
                    Selected PDF: {resumeFile.name}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    If you save without selecting a PDF, this resume will be saved as generated from the fields below.
                  </p>
                )}
              </div>

              <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <legend className="mb-2 text-sm font-semibold text-foreground">Personal details</legend>
                <div className="space-y-2">
                  <label htmlFor="cp-full-name" className="text-sm font-medium">
                    Full name <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="cp-full-name"
                    name="fullName"
                    autoComplete="name"
                    aria-required="true"
                    minLength={2}
                    maxLength={120}
                    value={resumeForm.fullName}
                    onChange={(e) => setResumeForm((p) => ({ ...p, fullName: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. Priya Sharma"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cp-phone" className="text-sm font-medium">
                    Mobile number <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                      +91
                    </span>
                    <input
                      id="cp-phone"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      aria-required="true"
                      aria-describedby="cp-phone-hint"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      value={resumeForm.phone}
                      onChange={(e) =>
                        setResumeForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                      }
                      className="w-full rounded-r-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="9876543210"
                    />
                  </div>
                  <p id="cp-phone-hint" className="text-xs text-muted-foreground">
                    10-digit Indian mobile. Shared with employers you apply to.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="cp-city" className="text-sm font-medium">Current city</label>
                  <input
                    id="cp-city"
                    name="city"
                    autoComplete="address-level2"
                    maxLength={100}
                    value={resumeForm.city}
                    onChange={(e) => setResumeForm((p) => ({ ...p, city: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. Jaipur"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cp-college" className="text-sm font-medium">College / Institute</label>
                  <input
                    id="cp-college"
                    name="college"
                    autoComplete="organization"
                    maxLength={160}
                    value={resumeForm.college}
                    onChange={(e) => setResumeForm((p) => ({ ...p, college: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. University of Rajasthan"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cp-linkedin" className="text-sm font-medium">LinkedIn URL</label>
                  <input
                    id="cp-linkedin"
                    name="linkedinUrl"
                    inputMode="url"
                    autoComplete="url"
                    value={resumeForm.linkedinUrl}
                    onChange={(e) => setResumeForm((p) => ({ ...p, linkedinUrl: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="linkedin.com/in/your-name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cp-portfolio" className="text-sm font-medium">Portfolio URL</label>
                  <input
                    id="cp-portfolio"
                    name="portfolioUrl"
                    inputMode="url"
                    value={resumeForm.portfolioUrl}
                    onChange={(e) => setResumeForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. github.com/your-name"
                  />
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="cp-qualification" className="text-sm font-medium">
                    Highest Qualification <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="cp-qualification"
                    name="highestQualification"
                    aria-required="true"
                    value={resumeForm.highestQualification}
                    onChange={(e) => setResumeForm((p) => ({ ...p, highestQualification: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. B.Tech / MBA / Diploma"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cp-experience-status" className="text-sm font-medium">
                    Experience Status <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <select
                    id="cp-experience-status"
                    name="experienceStatus"
                    aria-required="true"
                    value={resumeForm.experienceStatus}
                    onChange={(e) =>
                      setResumeForm((p) => ({
                        ...p,
                        experienceStatus: e.target.value === "experienced" ? "experienced" : "fresher",
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="" disabled>Select…</option>
                    <option value="fresher">Fresher</option>
                    <option value="experienced">Experienced</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="cp-summary" className="text-sm font-medium">Summary</label>
                  <textarea
                    id="cp-summary"
                    name="summary"
                    maxLength={1200}
                    value={resumeForm.summary}
                    onChange={(e) => setResumeForm((p) => ({ ...p, summary: e.target.value }))}
                    rows={5}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Write a short professional summary (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cp-skills" className="text-sm font-medium">
                    Skills <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="cp-skills"
                    name="skills"
                    aria-required="true"
                    aria-describedby="cp-skills-hint"
                    value={resumeForm.skillsText}
                    onChange={(e) => setResumeForm((p) => ({ ...p, skillsText: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. JavaScript, Node.js, React, MongoDB"
                  />
                  <p id="cp-skills-hint" className="text-xs text-muted-foreground">Comma separated, at least 3</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="cp-preferred-role" className="text-sm font-medium">
                    Preferred Role <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="cp-preferred-role"
                    name="preferredRole"
                    aria-required="true"
                    value={resumeForm.preferences.preferredRole}
                    onChange={(e) =>
                      setResumeForm((p) => ({ ...p, preferences: { ...p.preferences, preferredRole: e.target.value } }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. Backend Developer"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cp-preferred-location" className="text-sm font-medium">
                    Preferred Location <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="cp-preferred-location"
                    name="preferredLocation"
                    aria-required="true"
                    value={resumeForm.preferences.preferredLocation}
                    onChange={(e) =>
                      setResumeForm((p) => ({
                        ...p,
                        preferences: { ...p.preferences, preferredLocation: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. Delhi / Bengaluru"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cp-preferred-industry" className="text-sm font-medium">Preferred Industry</label>
                  <input
                    id="cp-preferred-industry"
                    name="preferredIndustry"
                    value={resumeForm.preferences.preferredIndustry}
                    onChange={(e) =>
                      setResumeForm((p) => ({
                        ...p,
                        preferences: { ...p.preferences, preferredIndustry: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. IT / FinTech"
                  />
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    Work Mode <span aria-hidden="true" className="text-red-500">*</span>
                  </legend>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(["On-site", "Hybrid", "Remote"] as const).map((mode) => {
                      const checked = resumeForm.preferences.workModes.includes(mode);
                      return (
                        <label key={mode} className="flex items-center gap-2 text-sm">
                          <input
                            id={`cp-workmode-${mode}`}
                            type="checkbox"
                            name="workModes"
                            value={mode}
                            checked={checked}
                            onChange={() =>
                              setResumeForm((p) => ({
                                ...p,
                                preferences: {
                                  ...p.preferences,
                                  workModes: checked
                                    ? p.preferences.workModes.filter((m) => m !== mode)
                                    : [...p.preferences.workModes, mode],
                                },
                              }))
                            }
                          />
                          {mode}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              {resumeForm.experienceStatus === "experienced" && (
                <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="cp-total-experience" className="text-sm font-medium">Total Experience</label>
                    <input
                      id="cp-total-experience"
                      name="totalExperience"
                      value={resumeForm.experienceDetails.totalExperience}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          experienceDetails: { ...p.experienceDetails, totalExperience: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="e.g. 2 years"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="cp-industry" className="text-sm font-medium">Industry</label>
                    <input
                      id="cp-industry"
                      name="industry"
                      value={resumeForm.experienceDetails.industry}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          experienceDetails: { ...p.experienceDetails, industry: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="e.g. IT"
                    />
                  </div>
                </div>

                <fieldset className="space-y-3">
                  <legend className="mb-3 text-sm font-semibold text-foreground">
                    Work experience <span aria-hidden="true" className="text-red-500">*</span>
                  </legend>

                  {resumeForm.experience.length === 0 && (
                    <p className="text-sm text-muted-foreground">Add at least one job with company, role and start month.</p>
                  )}

                  {resumeForm.experience.map((entry, idx) => {
                    const updateEntry = (patch: Partial<Required<ExperienceEntry>>) =>
                      setResumeForm((p) => ({
                        ...p,
                        experience: p.experience.map((x, i) => (i === idx ? { ...x, ...patch } : x)),
                      }));
                    const fieldId = (key: string) => `cp-exp-${idx}-${key}`;
                    return (
                      <div key={idx} className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 md:grid-cols-2">
                        <div className="flex items-center justify-between gap-2 md:col-span-2">
                          <p className="text-sm font-medium">Job #{idx + 1}</p>
                          <button
                            type="button"
                            className="text-sm text-red-500"
                            aria-label={`Remove job ${idx + 1}`}
                            onClick={() =>
                              setResumeForm((p) => ({ ...p, experience: p.experience.filter((_, i) => i !== idx) }))
                            }
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={fieldId("company")} className="text-sm font-medium">Company</label>
                          <input
                            id={fieldId("company")}
                            name={`experience.${idx}.company`}
                            autoComplete="organization"
                            maxLength={150}
                            value={entry.company}
                            onChange={(e) => updateEntry({ company: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            placeholder="Company name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={fieldId("role")} className="text-sm font-medium">Role</label>
                          <input
                            id={fieldId("role")}
                            name={`experience.${idx}.role`}
                            autoComplete="organization-title"
                            maxLength={100}
                            value={entry.role}
                            onChange={(e) => updateEntry({ role: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            placeholder="e.g. Sales Executive"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={fieldId("start")} className="text-sm font-medium">Start month</label>
                          <input
                            id={fieldId("start")}
                            name={`experience.${idx}.startDate`}
                            type="month"
                            // Fallback for browsers without a month picker (render as text).
                            pattern="[0-9]{4}-(0[1-9]|1[0-2])"
                            placeholder="YYYY-MM"
                            value={entry.startDate}
                            onChange={(e) => updateEntry({ startDate: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={fieldId("end")} className="text-sm font-medium">End month</label>
                          <input
                            id={fieldId("end")}
                            name={`experience.${idx}.endDate`}
                            type="month"
                            pattern="[0-9]{4}-(0[1-9]|1[0-2])"
                            placeholder="YYYY-MM"
                            min={entry.startDate || undefined}
                            disabled={entry.current}
                            value={entry.current ? "" : entry.endDate}
                            onChange={(e) => updateEntry({ endDate: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                          />
                        </div>
                        <label htmlFor={fieldId("current")} className="flex items-center gap-2 text-sm md:col-span-2">
                          <input
                            id={fieldId("current")}
                            name={`experience.${idx}.current`}
                            type="checkbox"
                            checked={entry.current}
                            onChange={(e) => updateEntry({ current: e.target.checked, endDate: "" })}
                          />
                          I currently work here
                        </label>
                      </div>
                    );
                  })}

                  <button
                    id="cp-add-job"
                    type="button"
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    onClick={() =>
                      setResumeForm((p) => ({
                        ...p,
                        experience: [...p.experience, { company: "", role: "", startDate: "", endDate: "", current: false }],
                      }))
                    }
                  >
                    Add job
                  </button>
                </fieldset>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading font-semibold">
                    <label htmlFor="cp-photo-file">Profile Photo</label>
                  </h3>
                  <p id="cp-photo-hint" className="text-sm text-muted-foreground">JPG/PNG/WEBP (max 2MB)</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    id="cp-photo-file"
                    name="profilePhoto"
                    aria-describedby="cp-photo-hint"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadProfilePhoto(file);
                      e.currentTarget.value = "";
                    }}
                    className="text-sm"
                    disabled={profilePhotoLoading}
                  />
                  <button
                    type="button"
                    onClick={removeProfilePhoto}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
                    disabled={!profilePhotoUrl}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {profilePhotoLoading && <p className="text-sm text-muted-foreground">Loading photo...</p>}
              {!profilePhotoLoading && !profilePhotoUrl && (
                <p className="text-sm text-muted-foreground">No profile photo uploaded.</p>
              )}
              {!profilePhotoLoading && profilePhotoUrl && (
                <img
                  src={profilePhotoUrl}
                  alt="Profile"
                  className="h-28 w-28 rounded-lg border border-border object-cover"
                />
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading font-semibold">
                    <label htmlFor="cp-certificate-file">Certificates (Files)</label>
                  </h3>
                  <p id="cp-certificate-hint" className="text-sm text-muted-foreground">Upload PDF or image (max 5MB)</p>
                </div>
                <input
                  id="cp-certificate-file"
                  name="certificateFile"
                  aria-describedby="cp-certificate-hint"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const title = window.prompt("Certificate title (optional)") || "";
                      void uploadCertificate(file, title);
                    }
                    e.currentTarget.value = "";
                  }}
                  className="text-sm"
                  disabled={certificateUploading}
                />
              </div>

              {certificateUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}

              {certificates.length === 0 && !certificateUploading && (
                <p className="text-sm text-muted-foreground">No certificates uploaded.</p>
              )}

              {certificates.length > 0 && (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {certificates.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{c.title || c.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.mimeType} • {(c.size / 1024).toFixed(0)} KB •{" "}
                          {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                          onClick={() => void downloadCertificate(c.url, c.fileName)}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-red-500"
                          onClick={() => void deleteCertificate(c.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold">Projects</h3>
                <button
                  id="cp-add-project"
                  type="button"
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  onClick={() =>
                    setResumeForm((p) => ({
                      ...p,
                      projects: [...p.projects, { name: "", description: "" }],
                    }))
                  }
                >
                  Add Project
                </button>
              </div>

              {(resumeForm.projects || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No projects added.</p>
              )}

              <div className="space-y-3">
                {(resumeForm.projects || []).map((project, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Project #{idx + 1}</p>
                      <button
                        type="button"
                        aria-label={`Remove project ${idx + 1}`}
                        className="text-sm text-red-500"
                        onClick={() =>
                          setResumeForm((p) => ({
                            ...p,
                            projects: p.projects.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <label htmlFor={`cp-project-${idx}-name`} className="sr-only">Project {idx + 1} name</label>
                    <input
                      id={`cp-project-${idx}-name`}
                      name={`projects.${idx}.name`}
                      maxLength={120}
                      value={project.name}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          projects: p.projects.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Project name"
                    />
                    <label htmlFor={`cp-project-${idx}-description`} className="sr-only">
                      Project {idx + 1} description
                    </label>
                    <textarea
                      id={`cp-project-${idx}-description`}
                      name={`projects.${idx}.description`}
                      maxLength={800}
                      value={project.description}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          projects: p.projects.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)),
                        }))
                      }
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="What you built, tech stack, impact (optional)"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold">Certifications</h3>
                <button
                  type="button"
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  onClick={() =>
                    setResumeForm((p) => ({
                      ...p,
                      certifications: [...p.certifications, { name: "", institute: "" }],
                    }))
                  }
                >
                  Add Certification
                </button>
              </div>

              {(resumeForm.certifications || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No certifications added.</p>
              )}

              <div className="space-y-3">
                {(resumeForm.certifications || []).map((cert, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Certification #{idx + 1}</p>
                      <button
                        type="button"
                        aria-label={`Remove certification ${idx + 1}`}
                        className="text-sm text-red-500"
                        onClick={() =>
                          setResumeForm((p) => ({
                            ...p,
                            certifications: p.certifications.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <label htmlFor={`cp-cert-${idx}-name`} className="sr-only">Certification {idx + 1} name</label>
                    <input
                      id={`cp-cert-${idx}-name`}
                      name={`certifications.${idx}.name`}
                      maxLength={120}
                      value={cert.name}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          certifications: p.certifications.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Certification name"
                    />
                    <label htmlFor={`cp-cert-${idx}-institute`} className="sr-only">
                      Certification {idx + 1} institute
                    </label>
                    <input
                      id={`cp-cert-${idx}-institute`}
                      name={`certifications.${idx}.institute`}
                      maxLength={160}
                      value={cert.institute}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          certifications: p.certifications.map((x, i) => (i === idx ? { ...x, institute: e.target.value } : x)),
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Institute / Platform (optional)"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-2">
              <label htmlFor="cp-referral" className="text-sm font-medium">Referral</label>
              <input
                id="cp-referral"
                name="referral"
                maxLength={200}
                value={resumeForm.referral}
                onChange={(e) => setResumeForm((p) => ({ ...p, referral: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Optional referral info"
              />
            </div>
            </form>
          </div>
        )}

        <ApplyReviewDialog
          job={reviewJob}
          snapshot={{
            fullName: profile?.fullName || "",
            phone: profile?.phone ? `+91 ${profile.phone}` : "",
            email: sessionState?.user.email || "",
            skills: profile?.skills || [],
            resumeLabel:
              resumeMeta?.resumeType === "uploaded"
                ? `Uploaded PDF${resumeMeta.fileName ? `: ${resumeMeta.fileName}` : ""}`
                : "Generated from your profile",
          }}
          submitting={Boolean(applyLoadingJobId)}
          error={applyError}
          onSubmit={({ note }) => {
            if (reviewJob) void applyToJob(reviewJob, note);
          }}
          onClose={() => {
            setReviewJob(null);
            setApplyError("");
          }}
          onEditProfile={() => {
            setReviewJob(null);
            setTab("profile");
          }}
          onPreviewResume={() => void downloadResumePdf()}
        />
    </DashboardLayout>
  );
};

export default CandidateDashboard;
