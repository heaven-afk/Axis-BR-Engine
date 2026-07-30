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
  Mail,
  Copy,
  Link2,
  Clock,
  Send,
} from "lucide-react";
import { inviteMember, removeMember, updateMemberRole } from "@/lib/actions/workspace";

interface Member {
  id: string;
  userId: string | null;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  inviteToken: string | null;
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
  const [filterTab, setFilterTab] = useState<"all" | "active" | "pending">("all");
  
  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteTab, setInviteTab] = useState<"email" | "link">("email");
  const [inviteInput, setInviteInput] = useState("");
  const [inviteRole, setInviteRole] = useState<"analyst" | "observer">("analyst");
  const [inviteError, setInviteError] = useState("");
  const [inviteResult, setInviteResult] = useState<{
    success: boolean;
    isPending?: boolean;
    email?: string;
    inviteToken?: string | null;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const isOwner = currentUserRole === "owner";

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteResult(null);

    const cleanInput = inviteInput.trim();
    if (!cleanInput) return;

    startTransition(async () => {
      try {
        const res = await inviteMember(workspaceId, cleanInput, inviteRole);
        
        // Update local members state
        const newMember: Member = {
          id: res.member.id,
          userId: res.member.userId ?? null,
          name: cleanInput.includes("@") ? cleanInput : res.member.userId || cleanInput,
          email: res.member.email ?? (cleanInput.includes("@") ? cleanInput : null),
          avatarUrl: null,
          role: res.member.role,
          status: res.member.status,
          inviteToken: res.member.inviteToken ?? null,
          joinedAt: res.member.joinedAt,
          invitedBy: res.member.invitedBy ?? null,
        };

        setMembers((prev) => [
          ...prev.filter((m) => m.id !== newMember.id),
          newMember,
        ]);

        setInviteResult({
          success: true,
          isPending: res.isPending,
          email: cleanInput.includes("@") ? cleanInput : undefined,
          inviteToken: res.inviteToken,
        });

        setInviteInput("");
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setInviteError(errorMsg);
      }
    });
  };

  const handleRemove = (memberId: string) => {
    startTransition(async () => {
      await removeMember(workspaceId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    });
  };

  const handleRoleChange = (memberId: string, role: "analyst" | "observer") => {
    startTransition(async () => {
      await updateMemberRole(workspaceId, memberId, role);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m))
      );
    });
  };

  const copyInviteUrl = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const filteredMembers = members.filter((m) => {
    if (filterTab === "active") return m.status === "active";
    if (filterTab === "pending") return m.status === "pending";
    return true;
  });

  const activeCount = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "pending").length;

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Back link */}
      <Link
        href={`/dashboard/workspace/${workspaceId}`}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition"
      >
        <ArrowLeft size={13} /> BACK TO {workspaceName.toUpperCase()}
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-signal-orange uppercase tracking-[0.2em] mb-1">
            <span className="size-2 rounded-full bg-signal-orange" />
            WORKSPACE // COLLABORATORS
          </div>
          <h1 className="font-display text-3xl font-bold text-text-primary uppercase tracking-tight">
            {workspaceName}
          </h1>
          <p className="text-text-muted text-xs font-mono mt-1">
            {activeCount} ACTIVE MEMBER{activeCount !== 1 ? "S" : ""}
            {pendingCount > 0 && ` · ${pendingCount} PENDING INVITATIONS`}
            {" · "}
            <span className="capitalize text-signal-cyan">{currentUserRole}</span>
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => {
              setShowInvite(true);
              setInviteError("");
              setInviteResult(null);
            }}
            className="inline-flex items-center gap-2 rounded-sm bg-signal-orange px-5 py-2.5 font-mono text-xs font-bold text-black uppercase tracking-wider hover:bg-signal-orange/90 transition shadow-panel-glow"
          >
            <UserPlus size={15} /> Invite Member
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-sm border uppercase transition ${
              filterTab === "all"
                ? "bg-panel-raised border-signal-orange text-signal-orange font-bold"
                : "border-line text-text-muted hover:text-text-primary"
            }`}
          >
            ALL ({members.length})
          </button>
          <button
            onClick={() => setFilterTab("active")}
            className={`px-3 py-1.5 rounded-sm border uppercase transition ${
              filterTab === "active"
                ? "bg-panel-raised border-signal-cyan text-signal-cyan font-bold"
                : "border-line text-text-muted hover:text-text-primary"
            }`}
          >
            ACTIVE ({activeCount})
          </button>
          {pendingCount > 0 && (
            <button
              onClick={() => setFilterTab("pending")}
              className={`px-3 py-1.5 rounded-sm border uppercase transition ${
                filterTab === "pending"
                  ? "bg-panel-raised border-yellow-400 text-yellow-400 font-bold"
                  : "border-line text-text-muted hover:text-text-primary"
              }`}
            >
              PENDING ({pendingCount})
            </button>
          )}
        </div>
      </div>

      {/* Members table */}
      <div className="telemetry-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-line text-left text-text-muted bg-panel-raised/50">
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider">COLLABORATOR</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider">EMAIL / ID</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider">ROLE</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider">STATUS</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider">JOINED</th>
                {isOwner && (
                  <th className="px-5 py-3 text-center text-[10px] uppercase tracking-wider w-32">ACTIONS</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {filteredMembers.map((member) => {
                const isMe = member.userId === currentUserId;
                const isOwnerRow = member.userId === ownerUserId;
                const isPendingMember = member.status === "pending";
                const joined = new Date(member.joinedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <tr key={member.id} className="hover:bg-panel-raised/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {member.avatarUrl ? (
                          // eslint-disable-next-next-line @next/next/no-img-element
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="size-8 rounded-full border border-line object-cover"
                          />
                        ) : (
                          <div className="grid size-8 place-items-center rounded-full bg-signal-orange/15 text-signal-orange border border-signal-orange/30 font-bold text-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                            {member.name}
                            {isMe && (
                              <span className="text-[9px] bg-signal-orange/20 text-signal-orange px-1.5 py-0.5 rounded uppercase font-bold">
                                YOU
                              </span>
                            )}
                          </p>
                          {member.email && (
                            <p className="text-[10px] text-text-muted truncate max-w-[200px]">
                              {member.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-text-muted font-mono text-[11px]">
                      {member.email ? (
                        <span className="text-text-primary">{member.email}</span>
                      ) : member.userId ? (
                        <span className="text-text-muted/80">{member.userId}</span>
                      ) : (
                        <span className="text-yellow-400/80">Pending Email</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {isOwner && !isOwnerRow && !isPendingMember ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.id,
                              e.target.value as "analyst" | "observer"
                            )
                          }
                          disabled={isPending}
                          className="rounded border border-line bg-void px-2 py-1 text-xs text-text-primary outline-none focus:border-signal-orange"
                        >
                          <option value="analyst">Analyst</option>
                          <option value="observer">Observer</option>
                        </select>
                      ) : (
                        <RoleBadge role={member.role} />
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {isPendingMember ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-full uppercase">
                          <Clock size={10} /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-signal-cyan bg-signal-cyan/10 border border-signal-cyan/30 px-2 py-0.5 rounded-full uppercase">
                          <Check size={10} /> Active
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-text-muted text-[11px]">{joined}</td>

                    {isOwner && (
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isPendingMember && member.inviteToken && (
                            <button
                              onClick={() => copyInviteUrl(member.inviteToken!)}
                              className="text-signal-cyan hover:text-white p-1 rounded transition"
                              title="Copy invitation link"
                            >
                              {copiedToken === member.inviteToken ? (
                                <Check size={14} className="text-signal-cyan" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          )}
                          {!isOwnerRow && (
                            <button
                              onClick={() => handleRemove(member.id)}
                              disabled={isPending}
                              className="text-signal-red hover:text-red-400 p-1 rounded transition disabled:opacity-40"
                              title={isPendingMember ? "Revoke invitation" : "Remove member"}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles explainer */}
      <div className="grid sm:grid-cols-3 gap-4">
        <RoleCard
          icon={<Crown size={16} className="text-yellow-400" />}
          title="Owner"
          desc="Full workspace control. Manage members, create tournaments, edit match telemetry."
          color="yellow"
        />
        <RoleCard
          icon={<BarChart3 size={16} className="text-signal-orange" />}
          title="Analyst"
          desc="Create tournaments, submit delimited match logs, edit point tables."
          color="accent"
        />
        <RoleCard
          icon={<Eye size={16} className="text-signal-cyan" />}
          title="Observer"
          desc="Read-only access to live standings, telemetry readouts, and leaderboards."
          color="cyan"
        />
      </div>

      {/* Modern Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-panel p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-bold font-display uppercase tracking-wide">
                  Invite Workspace Collaborator
                </h2>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  Invite by email address or share direct workspace link
                </p>
              </div>
              <button
                onClick={() => setShowInvite(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-line font-mono text-xs">
              <button
                onClick={() => setInviteTab("email")}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 border-b-2 font-bold uppercase transition ${
                  inviteTab === "email"
                    ? "border-signal-orange text-signal-orange"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                <Mail size={14} /> Send Email / ID Invite
              </button>
              <button
                onClick={() => setInviteTab("link")}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 border-b-2 font-bold uppercase transition ${
                  inviteTab === "link"
                    ? "border-signal-cyan text-signal-cyan"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                <Link2 size={14} /> Direct Share Link
              </button>
            </div>

            {inviteTab === "email" ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase text-text-muted block mb-1.5">
                    Email Address or Clerk User ID
                  </label>
                  <input
                    required
                    autoFocus
                    type="text"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    placeholder="e.g. analyst@esports.com or user_2abc..."
                    className="w-full h-10 rounded-md bg-void border border-line px-3 text-sm font-mono text-text-primary focus:border-signal-orange outline-none transition"
                  />
                  <p className="text-[10px] text-text-muted font-mono mt-1">
                    Enter an email address to send an invite or add existing Clerk user directly.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-text-muted block mb-1.5">
                    Assign Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["analyst", "observer"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setInviteRole(r)}
                        className={`h-10 rounded-md border text-xs font-mono font-bold uppercase transition ${
                          inviteRole === r
                            ? "border-signal-orange bg-signal-orange/10 text-signal-orange"
                            : "border-line text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {inviteError && (
                  <div className="flex items-center gap-2 text-xs font-mono text-signal-red bg-signal-red/10 border border-signal-red/30 p-3 rounded-md">
                    <AlertCircle size={14} className="shrink-0" />
                    {inviteError}
                  </div>
                )}

                {inviteResult?.success && (
                  <div className="space-y-3 bg-signal-cyan/10 border border-signal-cyan/30 p-3 rounded-md font-mono text-xs text-signal-cyan">
                    <div className="flex items-center gap-2 font-bold">
                      <Check size={14} />
                      {inviteResult.isPending
                        ? `Invitation token generated for ${inviteResult.email}!`
                        : "Member added successfully to workspace!"}
                    </div>

                    {inviteResult.isPending && inviteResult.inviteToken && (
                      <div className="pt-2 border-t border-signal-cyan/20 space-y-2 text-text-primary">
                        <p className="text-[11px]">Share this invitation link with the recipient:</p>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={`${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteResult.inviteToken}`}
                            className="flex-1 h-8 rounded bg-void border border-line px-2 text-[10px] font-mono select-all outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => copyInviteUrl(inviteResult.inviteToken!)}
                            className="h-8 px-3 rounded bg-signal-cyan text-black font-bold text-[11px] flex items-center gap-1 hover:bg-signal-cyan/90 transition"
                          >
                            <Copy size={12} />
                            {copiedToken === inviteResult.inviteToken ? "COPIED" : "COPY"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="flex-1 h-10 rounded-md border border-line font-mono text-xs text-text-muted hover:text-text-primary transition uppercase font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 h-10 rounded-md bg-signal-orange text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-signal-orange/90 transition disabled:opacity-60 shadow-panel-glow"
                  >
                    {isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    Send Invite
                  </button>
                </div>
              </form>
            ) : (
              /* Tab 2: Direct Shareable Link */
              <div className="space-y-4 font-mono text-xs">
                <p className="text-text-muted leading-relaxed">
                  Anyone with an active invitation link can join <strong className="text-text-primary">{workspaceName}</strong> as an analyst or observer.
                </p>

                <div className="telemetry-panel p-4 space-y-3">
                  <label className="text-[11px] text-signal-cyan font-bold uppercase tracking-wider block">
                    GENERAL INVITATION LINK (7 DAYS EXPR)
                  </label>
                  <p className="text-text-muted text-[11px]">
                    To generate a unique single-use link for an analyst, enter their email address in the Email Invite tab.
                  </p>
                </div>

                <div className="flex gap-3 pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="w-full h-10 rounded-md border border-line font-mono text-xs text-text-muted hover:text-text-primary transition uppercase font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const classes =
    role === "owner"
      ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
      : role === "analyst"
        ? "text-signal-orange bg-signal-orange/10 border-signal-orange/30"
        : "text-signal-cyan bg-signal-cyan/10 border-signal-cyan/30";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-bold capitalize ${classes}`}
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
  color: "yellow" | "accent" | "cyan";
}) {
  const border =
    color === "yellow"
      ? "border-yellow-400/20"
      : color === "accent"
        ? "border-signal-orange/20"
        : "border-signal-cyan/20";

  return (
    <div className={`telemetry-panel p-4 border ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-display font-bold uppercase text-sm">{title}</span>
      </div>
      <p className="font-mono text-xs text-text-muted leading-relaxed">{desc}</p>
    </div>
  );
}
