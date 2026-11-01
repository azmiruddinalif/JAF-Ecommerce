"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import {
  type StaffMemberRow,
  deleteStaffAction,
  provisionStaffAction,
  toggleStaffBanAction,
  updateStaffRoleAction,
} from "@/lib/actions/admin-staff-actions";
import { ADMIN_ROLES, ROLE_LABELS, type AdminRole } from "@/lib/auth/permissions";

export function StaffManager({
  initialStaff,
  currentUserId,
}: {
  initialStaff: StaffMemberRow[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states for adding new staff
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("support");
  const [password, setPassword] = useState("");

  function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("role", role);
    formData.set("password", password);

    startTransition(async () => {
      const result = await provisionStaffAction(formData);
      if (result.success) {
        setStatusMessage({ type: "success", text: result.message });
        setShowAddModal(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("support");
      } else {
        setStatusMessage({ type: "error", text: result.message });
      }
    });
  }

  function handleRoleChange(userId: string, newRole: string) {
    setStatusMessage(null);
    startTransition(async () => {
      const result = await updateStaffRoleAction(userId, newRole);
      if (result.success) {
        setStatusMessage({ type: "success", text: result.message });
      } else {
        setStatusMessage({ type: "error", text: result.message });
      }
    });
  }

  function handleToggleBan(userId: string, currentlyBanned: boolean) {
    const actionName = currentlyBanned ? "re-enable" : "disable";
    if (!confirm(`Are you sure you want to ${actionName} this staff member's access?`)) return;

    setStatusMessage(null);
    startTransition(async () => {
      const result = await toggleStaffBanAction(userId, !currentlyBanned);
      if (result.success) {
        setStatusMessage({ type: "success", text: result.message });
      } else {
        setStatusMessage({ type: "error", text: result.message });
      }
    });
  }

  function handleDelete(userId: string, staffName: string) {
    if (!confirm(`Permanently remove ${staffName} from staff? All associated login sessions will be deleted.`)) return;

    setStatusMessage(null);
    startTransition(async () => {
      const result = await deleteStaffAction(userId);
      if (result.success) {
        setStatusMessage({ type: "success", text: result.message });
      } else {
        setStatusMessage({ type: "error", text: result.message });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <ShieldCheck size={16} />
            </span>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Staff &amp; Access Control</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Owner-managed staff directory. Assign role-based permissions, revoke active sessions, and provision team members.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddModal(true);
            setStatusMessage(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-98"
        >
          <UserPlus size={15} />
          <span>Provision New Staff</span>
        </button>
      </div>

      {/* Status Alerts */}
      {statusMessage && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-xl p-4 text-xs font-medium border ${
            statusMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Role Summary Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ADMIN_ROLES.map((r) => {
          const meta = ROLE_LABELS[r];
          const count = initialStaff.filter((s) => s.role === r).length;
          return (
            <div key={r} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${meta.badgeColor}`}>
                  {meta.title}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700">{count} staff</span>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
                {meta.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <UserPlus size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Provision Staff Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleProvision} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rayan Anderson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff@jaf.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Assigned Role &amp; Permissions
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {ADMIN_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r].title} — {ROLE_LABELS[r].description.slice(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Initial Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isPending}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isPending ? "Provisioning..." : "Provision Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Directory Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active Staff Accounts</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {initialStaff.length} team members registered with administrative access.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Active Sessions</th>
                <th className="py-3 px-4">Added</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialStaff.map((staff) => {
                const isSelf = staff.id === currentUserId;
                const roleMeta = ROLE_LABELS[staff.role] ?? ROLE_LABELS.support;

                return (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Member */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{staff.name}</span>
                            {isSelf && (
                              <span className="rounded-sm bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{staff.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-3.5 px-4">
                      {isSelf ? (
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${roleMeta.badgeColor}`}>
                          <Shield size={11} />
                          {roleMeta.title}
                        </span>
                      ) : (
                        <select
                          value={staff.role}
                          disabled={isPending || staff.banned}
                          onChange={(e) => handleRoleChange(staff.id, e.target.value)}
                          className={`rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50`}
                        >
                          {ADMIN_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r].title}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {staff.banned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                          <UserX size={12} />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          <UserCheck size={12} />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Active Sessions */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-medium text-slate-600">
                        {staff.activeSessionCount} active
                      </span>
                    </td>

                    {/* Added */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(staff.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      {!isSelf && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleToggleBan(staff.id, staff.banned)}
                            className={`rounded-lg px-2 py-1 text-xs font-semibold border transition-colors ${
                              staff.banned
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                            }`}
                          >
                            {staff.banned ? "Re-enable" : "Disable"}
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(staff.id, staff.name)}
                            title="Delete Staff"
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
