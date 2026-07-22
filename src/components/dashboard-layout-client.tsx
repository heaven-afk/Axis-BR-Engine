"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Shield,
  LayoutDashboard,
  Plus,
  ChevronRight,
  Users,
  X,
  Loader2,
} from "lucide-react";
import { createTeamWorkspace } from "@/lib/actions/workspace";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  workspaces: Array<{
    workspace: {
      id: string;
      name: string;
      type: string;
      ownerUserId: string;
    };
    role: string;
  }>;
}

export function DashboardLayoutClient({
  children,
  workspaces,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [wsName, setWsName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    setCreating(true);
    try {
      const ws = await createTeamWorkspace(wsName.trim());
      setShowCreateWs(false);
      setWsName("");
      router.push(`/dashboard/workspace/${ws.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-line/40 bg-[#0b0f14]/90 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-line/30">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-accent/15 text-accent shadow-[0_0_12px_rgba(60,190,170,0.2)]">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">
                Axis Engine
              </p>
              <p className="text-[9px] text-muted leading-tight">
                Nova Technologies
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            href="/dashboard"
            icon={<LayoutDashboard size={16} />}
            label="Dashboard"
            active={pathname === "/dashboard"}
          />

          {/* Workspaces */}
          <div className="mt-5 mb-2 px-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              Workspaces
            </p>
          </div>

          {workspaces.map(({ workspace, role }) => {
            const isActive = pathname.startsWith(
              `/dashboard/workspace/${workspace.id}`
            );
            return (
              <Link
                key={workspace.id}
                href={`/dashboard/workspace/${workspace.id}`}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition group ${
                  isActive
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-muted hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <div
                  className={`grid size-6 place-items-center rounded shrink-0 ${
                    workspace.type === "team"
                      ? "bg-purple-500/15 text-purple-400"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {workspace.type === "team" ? (
                    <Users size={13} />
                  ) : (
                    <Shield size={13} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-[13px]">
                    {workspace.name}
                  </p>
                  <p className="text-[10px] text-muted capitalize">{role}</p>
                </div>
                <ChevronRight
                  size={13}
                  className="shrink-0 opacity-0 group-hover:opacity-60 transition"
                />
              </Link>
            );
          })}

          {/* Create workspace button */}
          <button
            onClick={() => setShowCreateWs(true)}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground transition"
          >
            <div className="grid size-6 place-items-center rounded border border-line/60 border-dashed text-muted">
              <Plus size={12} />
            </div>
            <span className="text-[13px]">New team workspace</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-line/30 space-y-3">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted truncate">My Account</p>
            </div>
          </div>
          <p className="text-[9px] text-muted/50 leading-relaxed">
            Powered by Axis Stat Engine
            <br />
            Built on Nova Technologies
          </p>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-line/40 bg-[#0b0f14]/90 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-accent" />
            <span className="text-sm font-bold">Axis Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateWs(true)}
              className="flex items-center gap-1 text-xs text-accent border border-accent/30 rounded px-2 py-1"
            >
              <Plus size={12} /> Workspace
            </button>
            <UserButton />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      {/* ── Create Workspace Modal ── */}
      {showCreateWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-line/70 bg-[#12161d] p-6 shadow-[0_0_40px_rgba(60,190,170,0.08)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold">Create Team Workspace</h2>
              <button
                onClick={() => setShowCreateWs(false)}
                className="text-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">
                  Workspace Name
                </label>
                <input
                  required
                  autoFocus
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. Esports Africa Analysts"
                  className="w-full h-10 rounded-md bg-black/40 border border-line/70 px-3 text-sm focus:border-accent outline-none transition"
                />
              </div>
              <p className="text-xs text-muted">
                Team workspaces let you invite analysts and observers to
                collaborate on tournament data.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateWs(false)}
                  className="flex-1 h-10 rounded-md border border-line/60 text-sm text-muted hover:text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 h-10 rounded-md bg-accent text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Plus size={15} />
                  )}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
        active
          ? "bg-foreground/8 text-foreground font-semibold"
          : "text-muted hover:bg-white/5 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
