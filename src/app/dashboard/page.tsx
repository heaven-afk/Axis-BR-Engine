import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserWorkspaces } from "@/lib/actions/workspace";
import {
  Shield,
  Users,
  Trophy,
  Plus,
  ChevronRight,
  Calendar,
  Gamepad2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user, workspaceList] = await Promise.all([
    currentUser(),
    getUserWorkspaces(),
  ]);

  const firstName = user?.firstName || user?.username || "Analyst";

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-1">
          Welcome back
        </p>
        <h1 className="text-3xl font-bold text-foreground">
          Hey, {firstName} 👋
        </h1>
        <p className="text-muted text-sm mt-1">
          Select a workspace to view tournaments, or create a new team
          workspace to collaborate with your analysts.
        </p>
      </div>

      {workspaceList.length === 0 && (
        <div className="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-sm">
          <p className="font-bold text-yellow-400 mb-1">
            ⚠️ Database Connection Required
          </p>
          <p className="text-yellow-200/80 leading-relaxed">
            Your database tables have not been created yet or your PostgreSQL connection in <code className="bg-black/40 px-1.5 py-0.5 rounded text-yellow-300">.env</code> needs to be configured.
          </p>
          <div className="mt-3 bg-black/50 p-3 rounded-lg border border-yellow-500/20 text-xs font-mono text-yellow-100">
            1. Update DATABASE_URL in .env<br />
            2. Run: <span className="text-accent font-bold">npx prisma db push</span>
          </div>
        </div>
      )}

      {/* Workspace Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {workspaceList.map(({ workspace, role }: { workspace: { id: string; name: string; type: string; ownerUserId: string; tournaments?: Array<{ id: string; name: string; gameMode: string; numDays: number; createdAt: Date }> }; role: string }) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            role={role as string}
          />
        ))}

        {/* Create team workspace CTA */}
        <CreateWorkspaceCTA />
      </div>

      {/* Quick stats */}
      {workspaceList.length > 0 && (
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-4">
            Platform Overview
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard
              icon={<Shield size={18} className="text-accent" />}
              label="Workspaces"
              value={workspaceList.length}
            />
            <StatCard
              icon={<Trophy size={18} className="text-yellow-400" />}
              label="Tournaments"
              value={workspaceList.reduce(
                (acc: number, { workspace }: { workspace: { tournaments?: unknown[] } }) =>
                  acc + (workspace.tournaments?.length ?? 0),
                0
              )}
            />
            <StatCard
              icon={<Users size={18} className="text-purple-400" />}
              label="Team Workspaces"
              value={
                workspaceList.filter(({ workspace }: { workspace: { type: string } }) => workspace.type === "team")
                  .length
              }
            />
          </div>
        </div>
      )}

      {/* Footer brand */}
      <p className="mt-16 text-center text-[10px] text-muted/50">
        Powered by Axis Stat Engine · Built on Nova Technologies
      </p>
    </div>
  );
}

function WorkspaceCard({
  workspace,
  role,
}: {
  workspace: {
    id: string;
    name: string;
    type: string;
    tournaments?: Array<{ id: string; name: string; gameMode: string; numDays: number; createdAt: Date }>;
  };
  role: string;
}) {
  const isTeam = workspace.type === "team";
  const tournaments = workspace.tournaments ?? [];

  return (
    <Link
      href={`/dashboard/workspace/${workspace.id}`}
      className="group rounded-xl border border-line/60 bg-panel/60 p-5 hover:border-accent/30 hover:bg-panel/80 transition-all hover:shadow-[0_0_24px_rgba(60,190,170,0.06)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`grid size-10 place-items-center rounded-lg ${
            isTeam
              ? "bg-purple-500/15 text-purple-400"
              : "bg-accent/10 text-accent"
          }`}
        >
          {isTeam ? <Users size={20} /> : <Shield size={20} />}
        </div>
        <ChevronRight
          size={16}
          className="text-muted opacity-0 group-hover:opacity-100 transition mt-0.5"
        />
      </div>

      <h2 className="font-bold text-foreground text-base leading-tight">
        {workspace.name}
      </h2>
      <p className="text-xs text-muted capitalize mt-0.5 mb-4">
        {isTeam ? "Team workspace" : "Personal workspace"} · {role}
      </p>

      {/* Tournament count */}
      <div className="flex items-center gap-2 text-xs text-muted mt-auto">
        <Trophy size={13} />
        <span>
          {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Latest tournament */}
      {tournaments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-line/40">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
            Latest
          </p>
          <div className="flex items-center gap-2 text-xs">
            <Gamepad2 size={12} className="text-accent shrink-0" />
            <span className="truncate text-foreground font-medium">
              {tournaments[0].name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted mt-1">
            <Calendar size={11} />
            <span>{tournaments[0].numDays} days · {tournaments[0].gameMode}</span>
          </div>
        </div>
      )}
    </Link>
  );
}

function CreateWorkspaceCTA() {
  return (
    <div className="rounded-xl border border-dashed border-line/50 bg-transparent p-5 flex flex-col items-center justify-center text-center gap-3 min-h-[160px] hover:border-accent/30 hover:bg-accent/3 transition-colors group">
      <div className="grid size-10 place-items-center rounded-lg border border-dashed border-line/60 text-muted group-hover:border-accent/40 group-hover:text-accent transition">
        <Plus size={20} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          New Team Workspace
        </p>
        <p className="text-xs text-muted mt-1">
          Invite analysts to collaborate
        </p>
      </div>
      <p className="text-[10px] text-muted/60">
        Use the sidebar button to create
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-line/50 bg-panel/50 p-4 flex items-center gap-4">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
