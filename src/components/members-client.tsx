"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  UserPlus,
  Trash2,
  Crown,
  Eye,
  BarChart3,
  ArrowLeft,
  X,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { inviteMember, removeMember, updateMemberRole } from "@/lib/actions/workspace";

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: Date;
  invitedBy: string | null;
}

interface MembersClientProps {
  workspaceId: string;
  workspaceName: string;
  ownerUserId: string;
  currentUserId: string;
  currentUserRole: string;
  members: Member[];
}

export function MembersClient({
  workspaceId,
  workspaceName,
  ownerUserId,
  currentUserId,
  currentUserRole,
  members: initialMembers,
}: MembersClientProps) {
  const [isPending, startTransition] = useTransition();
  const [members, setMembers] = useState(initialMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState<"analyst" | "observer">("analyst");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const isOwner = currentUserRole === "owner";

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess(false);

    startTransition(async () => {
      try {
        const member = await inviteMember(workspaceId, inviteUserId.trim(), inviteRole);
        setMembers((prev) => [
          ...prev.filter((m) => m.userId !== member.userId),
          {
            id: member.id,
            userId: member.userId,
            role: member.role,
            joinedAt: member.joinedAt,
            invitedBy: member.invitedBy ?? null,
          },
        ]);
        setInviteSuccess(true);
        setInviteUserId("");
      } catch (err) {
        setInviteError(String(err));
      }
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      await removeMember(workspaceId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    });
  };

  const handleRoleChange = (userId: string, role: "analyst" | "observer") => {
    startTransition(async () => {
      await updateMemberRole(workspaceId, userId, role);
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role } : m))
      );
    });
  };

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href={`/dashboard/workspace/${workspaceId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition mb-6"
      >
        <ArrowLeft size={13} /> Back to {workspaceName}
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-1">
            Members
          </p>
          <h1 className="text-2xl font-bold text-foreground">{workspaceName}</h1>
          <p className="text-sm text-muted mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
            <span className="capitalize text-accent">{currentUserRole}</span>
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-black hover:bg-accent/90 transition"
          >
            <UserPlus size={15} /> Invite Member
          </button>
        )}
      </div>

      {/* Members table */}
      <div className="rounded-xl border border-line/60 bg-panel/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#12161d] border-b border-line/50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                User ID
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Role
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Joined
              </th>
              {isOwner && (
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isMe = member.userId === currentUserId;
              const isOwnerRow = member.userId === ownerUserId;
              const joined = new Date(member.joinedAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              );

              return (
                <tr
                  key={member.id}
                  className="border-b border-line/30 last:border-0 hover:bg-white/3 transition"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                        {member.userId.slice(5, 7).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-mono text-xs text-foreground truncate max-w-[180px]">
                          {member.userId}
                        </p>
                        {isMe && (
                          <p className="text-[10px] text-accent mt-0.5">
                            You
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {isOwner && !isOwnerRow ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.userId,
                            e.target.value as "analyst" | "observer"
                          )
                        }
                        disabled={isPending}
                        className="rounded border border-line/60 bg-black/40 px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
                      >
                        <option value="analyst">Analyst</option>
                        <option value="observer">Observer</option>
                      </select>
                    ) : (
                      <RoleBadge role={member.role} />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted">{joined}</td>
                  {isOwner && (
                    <td className="px-5 py-3.5 text-center">
                      {!isOwnerRow && (
                        <button
                          onClick={() => handleRemove(member.userId)}
                          disabled={isPending}
                          className="text-danger hover:text-red-400 transition disabled:opacity-40"
                          title="Remove member"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Roles explainer */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <RoleCard
          icon={<Crown size={16} className="text-yellow-400" />}
          title="Owner"
          desc="Full control. Manage members, create/edit tournaments, enter all data."
          color="yellow"
        />
        <RoleCard
          icon={<BarChart3 size={16} className="text-accent" />}
          title="Analyst"
          desc="Create tournaments, enter match data, edit scoring config."
          color="accent"
        />
        <RoleCard
          icon={<Eye size={16} className="text-muted" />}
          title="Observer"
          desc="Read-only access to all workspace data including live standings."
          color="muted"
        />
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-line/70 bg-[#12161d] p-6 shadow-[0_0_40px_rgba(60,190,170,0.08)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold">Invite Team Member</h2>
                <p className="text-xs text-muted mt-0.5">
                  Add a collaborator using their Clerk user ID
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInvite(false);
                  setInviteError("");
                  setInviteSuccess(false);
                }}
                className="text-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">
                  Clerk User ID
                </label>
                <input
                  required
                  autoFocus
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  placeholder="user_2abc..."
                  className="w-full h-10 rounded-md bg-black/40 border border-line/70 px-3 text-sm font-mono focus:border-accent outline-none transition"
                />
                <p className="text-[10px] text-muted mt-1">
                  They can find their user ID in their Clerk profile.
                </p>
              </div>

              <div>
                <label className="text-xs text-muted block mb-1.5">
                  Assign Role
                </label>
                <div className="flex gap-3">
                  {(["analyst", "observer"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`flex-1 h-10 rounded-md border text-sm font-semibold capitalize transition ${
                        inviteRole === r
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-line/60 text-muted hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {inviteError && (
                <div className="flex items-center gap-2 text-xs text-danger">
                  <AlertCircle size={13} />
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="flex items-center gap-2 text-xs text-success">
                  <Check size={13} />
                  Member added successfully!
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 h-10 rounded-md border border-line/60 text-sm text-muted hover:text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-10 rounded-md bg-accent text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <UserPlus size={15} />
                  )}
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const classes =
    role === "owner"
      ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      : role === "analyst"
        ? "text-accent bg-accent/10 border-accent/20"
        : "text-muted bg-white/5 border-line/40";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}
    >
      {role === "owner" && <Crown size={10} />}
      {role === "analyst" && <BarChart3 size={10} />}
      {role === "observer" && <Eye size={10} />}
      {role}
    </span>
  );
}

function RoleCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: "yellow" | "accent" | "muted";
}) {
  const border =
    color === "yellow"
      ? "border-yellow-400/20"
      : color === "accent"
        ? "border-accent/20"
        : "border-line/40";

  return (
    <div className={`rounded-lg border ${border} bg-panel/40 p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-xs text-muted leading-relaxed">{desc}</p>
    </div>
  );
}
