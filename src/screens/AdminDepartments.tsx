"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@/compat/router";
import { Building2, CheckCircle2, Loader2, LogOut, Pencil, Plus, Power, X } from "lucide-react";
import OptimizedLogo from "@/components/OptimizedLogo";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { clearSession, getSession } from "@/lib/auth";

const BRAND_PRIMARY = "#264a7f";

type Department = {
  id: string;
  name: string;
  description: string;
  headId: string | null;
  headName: string;
  isActive: boolean;
};

type FormState = {
  name: string;
  description: string;
  headName: string;
  headEmail: string;
  headPassword: string;
};

const emptyForm: FormState = { name: "", description: "", headName: "", headEmail: "", headPassword: "" };

/**
 * Admin page to manage the departments candidates can intern under. Add a
 * department with its head, edit the head later (team members change), or
 * deactivate a department. Talks to /admin/interns/departments (admin only).
 */
const AdminDepartments = () => {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState<ReturnType<typeof getSession>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const res = await apiGet<{ success: boolean; data: Department[] }>("/admin/interns/departments", true);
    setDepartments(res.data || []);
  }, []);

  useEffect(() => {
    const session = getSession();
    setSessionState(session);
    if (!session?.accessToken) {
      navigate("/login?role=admin", { replace: true });
      return;
    }
    if (session.user.role !== "admin") {
      navigate(session.user.role === "client" ? "/dashboard/client" : "/dashboard/candidate", { replace: true });
      return;
    }
    void (async () => {
      try {
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load departments");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, refresh]);

  const startEdit = (dept: Department) => {
    setEditingName(dept.name);
    setForm({
      name: dept.name,
      description: dept.description,
      headName: dept.headName,
      headEmail: "",
      headPassword: "",
    });
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingName(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError("");
    setNotice("");

    if (!form.name.trim()) {
      setError("Department name is required.");
      return;
    }
    if (!form.headEmail.trim() && !editingName) {
      setError("Head email is required.");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim(),
        headName: form.headName.trim(),
        isActive: true,
      };
      // Only send a head email when adding a department or changing its head.
      // Leaving it blank while editing keeps the current head unchanged.
      if (form.headEmail.trim()) payload.headEmail = form.headEmail.trim().toLowerCase();
      if (form.headPassword.trim()) payload.headPassword = form.headPassword.trim();

      const res = await apiPost<{ success: boolean; meta?: { createdHead?: boolean } }>(
        "/admin/interns/departments",
        payload,
        true,
      );
      setNotice(
        res.meta?.createdHead
          ? `Saved. A new head account was created for ${form.headEmail}. Ask them to reset the password.`
          : "Department saved.",
      );
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (dept: Department) => {
    setError("");
    setNotice("");
    try {
      if (dept.isActive) {
        await apiDelete(`/admin/interns/departments/${dept.id}`, true);
        setNotice(`${dept.name} deactivated (hidden from candidates).`);
      } else {
        // Reactivate: re-upsert with isActive true. No head email → backend keeps
        // the existing head.
        await apiPost(
          "/admin/interns/departments",
          { name: dept.name, description: dept.description, headName: dept.headName, isActive: true },
          true,
        );
        setNotice(`${dept.name} reactivated.`);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update department");
    }
  };

  const logout = async () => {
    try {
      await apiPost("/auth/logout", { refreshToken: getSession()?.refreshToken });
    } catch {
      // no-op
    }
    clearSession();
    navigate("/login", { replace: true });
  };

  if (!sessionState?.accessToken || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_PRIMARY }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <OptimizedLogo className="flex items-center" imgClassName="h-8 w-auto" />
            <div>
              <p className="text-sm font-semibold">Admin · Departments</p>
              <p className="text-xs text-slate-500">{sessionState.user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {notice}
          </div>
        )}

        {/* Add / edit form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              {editingName ? <Pencil size={18} style={{ color: BRAND_PRIMARY }} /> : <Plus size={18} style={{ color: BRAND_PRIMARY }} />}
              {editingName ? `Edit "${editingName}"` : "Add a department"}
            </h2>
            {editingName && (
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <X size={14} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Department name" required>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={Boolean(editingName)}
                placeholder="e.g. Marketing"
                className="input"
              />
            </Field>
            <Field label="Description (optional)">
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                className="input"
              />
            </Field>
            <Field label="Head name">
              <input
                value={form.headName}
                onChange={(e) => setForm((f) => ({ ...f, headName: e.target.value }))}
                placeholder="e.g. Priya Verma"
                className="input"
              />
            </Field>
            <Field label="Head email" required={!editingName}>
              <input
                type="email"
                value={form.headEmail}
                onChange={(e) => setForm((f) => ({ ...f, headEmail: e.target.value }))}
                placeholder="head@company.com"
                className="input"
              />
            </Field>
            <Field label="Head password (only if new head account)">
              <input
                type="text"
                value={form.headPassword}
                onChange={(e) => setForm((f) => ({ ...f, headPassword: e.target.value }))}
                placeholder="Set only if this head has no account yet (min 8 chars)"
                className="input"
              />
            </Field>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#264a7f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d3a66] disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : editingName ? <Pencil size={16} /> : <Plus size={16} />}
                {editingName ? "Save changes" : "Add department"}
              </button>
            </div>
          </form>
          <p className="mt-3 text-xs text-slate-400">
            The head is the person who approves intern requests, assigns tasks, and chats with interns. To change a
            department&apos;s head, click Edit and enter the new head&apos;s email.
          </p>
        </section>

        {/* List */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Building2 size={18} style={{ color: BRAND_PRIMARY }} /> Departments ({departments.length})
          </h2>
          {departments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No departments yet. Add one above so candidates can apply for internships.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {departments.map((dept) => (
                <article key={dept.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            dept.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {dept.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>
                      {dept.description && <p className="mt-1 text-xs text-slate-500">{dept.description}</p>}
                      <p className="mt-2 text-sm text-slate-700">
                        Head: <span className="font-medium">{dept.headName || "—"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(dept)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      <Pencil size={13} /> Edit head
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(dept)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        dept.isActive
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      <Power size={13} /> {dept.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        :global(.input:focus) {
          outline: none;
          border-color: #264a7f;
          box-shadow: 0 0 0 1px #264a7f;
        }
      `}</style>
    </div>
  );
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
  </label>
);

export default AdminDepartments;
