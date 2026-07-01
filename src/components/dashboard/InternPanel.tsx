"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Clock4,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Upload,
  UserCircle2,
  XCircle,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useServerEvents } from "@/hooks/useServerEvents";

const BRAND_PRIMARY = "#264a7f";

type InternStatus = "none" | "pending" | "active" | "rejected" | "completed" | "paused" | "terminated";

type InternProfile = {
  status: InternStatus;
  email: string;
  id?: string;
  department?: string;
  departmentId?: string | null;
  designation?: string;
  startDate?: string | null;
  endDate?: string | null;
  stipend?: string;
  requestNote?: string;
  requestedAt?: string | null;
  decidedAt?: string | null;
  departmentHead?: { id: string | null; name: string };
};

type Department = { id: string; name: string; description: string; headName: string };

type InternTaskSubmission = { url: string; name: string; type: string; size: number; uploadedAt: string };

type InternTask = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  status: "assigned" | "in-progress" | "submitted" | "reviewed" | "completed";
  assignedByName: string;
  submissions: InternTaskSubmission[];
  submissionNote: string;
  submittedAt: string | null;
  reviewNote: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type InternMessage = {
  id: string;
  senderRole: "intern" | "head";
  mine: boolean;
  body: string;
  readAt: string | null;
  createdAt: string;
};

const TASK_STATUS_META: Record<InternTask["status"], { label: string; className: string }> = {
  assigned: { label: "Assigned", className: "border-slate-200 bg-slate-100 text-slate-700" },
  "in-progress": { label: "In progress", className: "border-sky-200 bg-sky-50 text-sky-700" },
  submitted: { label: "Submitted", className: "border-amber-200 bg-amber-50 text-amber-700" },
  reviewed: { label: "Reviewed", className: "border-violet-200 bg-violet-50 text-violet-700" },
  completed: { label: "Completed", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

const PRIORITY_META: Record<InternTask["priority"], string> = {
  low: "text-slate-500",
  medium: "text-amber-600",
  high: "text-red-600",
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};

/**
 * Intern tab inside the candidate dashboard. A candidate chooses a department
 * and requests an internship; once the department head approves it, tasks and
 * chat unlock here. All /interns/* calls run under the candidate's own session.
 */
const InternPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [tasks, setTasks] = useState<InternTask[]>([]);
  const [messages, setMessages] = useState<InternMessage[]>([]);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const refreshProfile = useCallback(async () => {
    const res = await apiGet<{ success: boolean; data: InternProfile }>("/interns/me", true);
    setProfile(res.data);
    return res.data;
  }, []);

  const refreshTasks = useCallback(async () => {
    const res = await apiGet<{ success: boolean; data: InternTask[] }>("/interns/tasks", true);
    setTasks(res.data || []);
  }, []);

  const refreshMessages = useCallback(async () => {
    const res = await apiGet<{ success: boolean; data: InternMessage[] }>("/interns/messages", true);
    setMessages(res.data || []);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [me, deptsRes] = await Promise.all([
        refreshProfile(),
        apiGet<{ success: boolean; data: Department[] }>("/interns/departments", true).catch(() => null),
      ]);
      if (deptsRes) setDepartments(deptsRes.data || []);
      if (me.status === "active") {
        await Promise.all([refreshTasks(), refreshMessages()]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intern portal");
    } finally {
      setLoading(false);
    }
  }, [refreshMessages, refreshProfile, refreshTasks]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useServerEvents({
    enabled: true,
    eventNames: ["intern-message", "intern-task-assigned", "intern-task-updated", "intern-approved"],
    onEvent: ({ type }) => {
      if (type === "intern-message") void refreshMessages();
      if (type === "intern-task-assigned" || type === "intern-task-updated") void refreshTasks();
      if (type === "intern-approved") void loadData();
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "assigned" || t.status === "in-progress").length;
    const submitted = tasks.filter((t) => t.status === "submitted").length;
    const done = tasks.filter((t) => t.status === "reviewed" || t.status === "completed").length;
    return { total, pending, submitted, done };
  }, [tasks]);

  const submitRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedDept || requesting) return;
    setRequesting(true);
    setError("");
    try {
      await apiPost("/interns/request", { departmentId: selectedDept, note: requestNote.trim() }, true);
      setRequestNote("");
      setSelectedDept("");
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setRequesting(false);
    }
  };

  const handleTaskFileSelect = async (task: InternTask, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setUploadingTaskId(task.id);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      await apiPost(`/interns/tasks/${task.id}/submit`, fd, true);
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload your work");
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const body = messageDraft.trim();
    if (!body || sendingMessage) return;
    setSendingMessage(true);
    setError("");
    try {
      const res = await apiPost<{ success: boolean; data: InternMessage }>("/interns/messages", { body }, true);
      setMessages((prev) => [...prev, res.data]);
      setMessageDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: BRAND_PRIMARY }} />
      </div>
    );
  }

  const status = profile?.status || "none";
  const errorBanner = error && (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
  );

  // --- No internship yet (or previously rejected/finished): choose + request ---
  if (status === "none" || status === "rejected" || status === "completed" || status === "terminated") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {errorBanner}

        {status === "rejected" && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <p>Your previous internship request was declined. You can choose a department and request again.</p>
          </div>
        )}
        {(status === "completed" || status === "terminated") && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>Your previous internship has ended. You can request a new one below.</p>
          </div>
        )}

        <div className="rounded-2xl border border-[#264a7f]/15 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#264a7f]/10 text-[#264a7f]">
              <GraduationCap size={24} />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Apply for an Internship</h3>
              <p className="text-sm text-slate-500">Choose a department to work under. Your request goes to that department&apos;s head.</p>
            </div>
          </div>

          {departments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No departments are open for internships right now. Please check back later.
            </p>
          ) : (
            <form onSubmit={submitRequest} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {departments.map((dept) => {
                  const selected = selectedDept === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setSelectedDept(dept.id)}
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-[#264a7f] bg-[#264a7f]/5 ring-1 ring-[#264a7f]"
                          : "border-slate-200 bg-white hover:border-[#264a7f]/40"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{dept.name}</p>
                      {dept.description && <p className="mt-1 text-xs text-slate-500">{dept.description}</p>}
                      {dept.headName && (
                        <p className="mt-2 text-xs font-medium text-[#264a7f]">Head: {dept.headName}</p>
                      )}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Message to the head (optional)</label>
                <textarea
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  rows={3}
                  placeholder="Why do you want to intern in this department?"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#264a7f] focus:outline-none focus:ring-1 focus:ring-[#264a7f]"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedDept || requesting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#264a7f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d3a66] disabled:opacity-50"
              >
                {requesting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending request…
                  </>
                ) : (
                  "Send internship request"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- Request sent, waiting for the head to approve ---
  if (status === "pending" || status === "paused") {
    const pending = status === "pending";
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {errorBanner}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Clock4 size={26} />
          </span>
          <h3 className="text-lg font-semibold text-slate-900">
            {pending ? "Request sent — waiting for approval" : "Your internship is paused"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            {pending ? (
              <>
                You requested to intern in <b>{profile?.department}</b>. Once{" "}
                <b>{profile?.departmentHead?.name || "the Department Head"}</b> approves, your tasks and chat will appear here.
              </>
            ) : (
              <>Your Department Head has paused your internship. It will resume when they reactivate it.</>
            )}
          </p>
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-1 gap-2 text-left text-sm">
            <InfoRow label="Department" value={profile?.department} />
            <InfoRow label="Department Head" value={profile?.departmentHead?.name} />
            {profile?.requestedAt && <InfoRow label="Requested on" value={formatDate(profile.requestedAt)} />}
          </div>
        </div>
      </div>
    );
  }

  // --- Active intern: full portal (details + tasks + chat) ---
  const headName = profile?.departmentHead?.name || "your Department Head";

  return (
    <div className="space-y-6">
      {errorBanner}

      {/* Details */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-[#16305a] p-5 text-white sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-white/10">
              <UserCircle2 className="h-10 w-10 text-white/70" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">{profile?.designation || "Intern"}</h2>
              <p className="truncate text-sm text-white/80">{profile?.department} Department</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-medium text-emerald-100">
                <CheckCircle2 size={12} /> Active
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
          <DetailItem icon={<UserCircle2 size={16} />} label="Email" value={profile?.email} />
          <DetailItem icon={<FileText size={16} />} label="Department" value={profile?.department} />
          <DetailItem icon={<UserCircle2 size={16} />} label="Department Head" value={profile?.departmentHead?.name} />
          <DetailItem icon={<CalendarClock size={16} />} label="Start date" value={formatDate(profile?.startDate)} />
          <DetailItem icon={<CalendarClock size={16} />} label="End date" value={formatDate(profile?.endDate)} />
          <DetailItem icon={<GraduationCap size={16} />} label="Stipend" value={profile?.stipend} />
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total tasks" value={stats.total} tone="text-slate-900" />
        <StatCard label="Pending" value={stats.pending} tone="text-sky-600" />
        <StatCard label="Submitted" value={stats.submitted} tone="text-amber-600" />
        <StatCard label="Completed" value={stats.done} tone="text-emerald-600" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tasks */}
        <section className="space-y-4 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <FileText size={18} style={{ color: BRAND_PRIMARY }} /> My Tasks
          </h3>
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No tasks assigned yet. {headName} will assign tasks here.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const meta = TASK_STATUS_META[task.status];
                const uploading = uploadingTaskId === task.id;
                return (
                  <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900">{task.title}</h4>
                        {task.assignedByName && (
                          <p className="mt-0.5 text-xs text-slate-500">Assigned by {task.assignedByName}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{task.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={13} /> Due {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span className={`font-medium capitalize ${PRIORITY_META[task.priority]}`}>
                        {task.priority} priority
                      </span>
                    </div>
                    {task.submissions.length > 0 && (
                      <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your submissions</p>
                        {task.submissions.map((sub, i) => (
                          <a
                            key={`${task.id}-sub-${i}`}
                            href={sub.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-sm text-slate-700 hover:text-[#264a7f] hover:underline"
                          >
                            <Paperclip size={14} className="shrink-0" />
                            <span className="min-w-0 truncate">{sub.name}</span>
                            <span className="ml-auto shrink-0 text-xs text-slate-400">{formatDateTime(sub.uploadedAt)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    {task.reviewNote && (
                      <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Feedback</p>
                        <p className="mt-1 whitespace-pre-wrap">{task.reviewNote}</p>
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-3">
                      <input
                        ref={(el) => {
                          fileInputsRef.current[task.id] = el;
                        }}
                        type="file"
                        className="hidden"
                        onChange={(e) => void handleTaskFileSelect(task, e)}
                      />
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputsRef.current[task.id]?.click()}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#264a7f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d3a66] disabled:opacity-60"
                      >
                        {uploading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Uploading…
                          </>
                        ) : (
                          <>
                            <Upload size={16} /> {task.submissions.length ? "Upload again" : "Upload work"}
                          </>
                        )}
                      </button>
                      {task.status === "submitted" && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 size={14} /> Submitted
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Chat with head */}
        <section className="lg:col-span-1">
          <div className="flex h-[560px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <MessageSquare size={18} style={{ color: BRAND_PRIMARY }} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Chat with your Head</p>
                <p className="truncate text-xs text-slate-500">{profile?.departmentHead?.name || "Department Head"}</p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <p className="mt-8 text-center text-sm text-slate-400">No messages yet. Say hello to {headName}.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        msg.mine ? "rounded-br-sm bg-[#264a7f] text-white" : "rounded-bl-sm bg-slate-100 text-slate-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <p className={`mt-1 text-[10px] ${msg.mine ? "text-white/70" : "text-slate-400"}`}>
                        {formatDateTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-slate-200 p-3">
              <input
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#264a7f] focus:outline-none focus:ring-1 focus:ring-[#264a7f]"
              />
              <button
                type="submit"
                disabled={!messageDraft.trim() || sendingMessage}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#264a7f] text-white transition hover:bg-[#1d3a66] disabled:opacity-50"
                aria-label="Send message"
              >
                {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
      <span className="text-slate-400">{icon}</span> {label}
    </p>
    <p className="mt-1 truncate text-sm font-medium text-slate-900">{value || "—"}</p>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
    <span className="text-sm font-medium text-slate-900">{value || "—"}</span>
  </div>
);

const StatCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className={`text-2xl font-bold ${tone}`}>{value}</p>
    <p className="mt-0.5 text-xs text-slate-500">{label}</p>
  </div>
);

export default InternPanel;
