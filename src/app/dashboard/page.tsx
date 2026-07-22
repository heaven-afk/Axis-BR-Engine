import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserWorkspaces } from "@/lib/actions/workspace";
import {
  Shield,
  Users,
  Trophy,
  Plus,
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
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Telemetry Header */}
      <div className="border-b border-line pb-6">
        <div className="flex items-center gap-2 font-mono text-[11px] text-signal-orange uppercase tracking-[0.2em] mb-1">
          <span className="size-2 rounded-full bg-signal-orange animate-pulse" />
          OPERATIONS.CONSOLE // WORKSPACES
        </div>
        <h1 className="font-display text-3xl font-bold text-text-primary uppercase tracking-tight">
          Welcome, {firstName}
        </h1>
        <p className="text-text-muted text-xs font-mono mt-1">
          SELECT AN OPERATIONAL WORKSPACE TO ENTER MATCH TELEMETRY OR MANAGE TOURNAMENT STANDINGS.
        </p>
      </div>

      {workspaceList.length === 0 && (
        <div className="telemetry-panel p-5 border-l-4 border-l-warning text-xs font-mono space-y-2">
          <p className="font-bold text-warning uppercase">
            ⚠️ DATABASE CONFIGURATION REQUIRED
          </p>
          <p className="text-text-muted">
            PostgreSQL connection needs initialization. Run <code className="text-signal-orange">npx prisma db push</code> to apply schemas.
          </p>
        </div>
      )}

      {/* Workspace Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaceList.map(({ workspace, role }: { workspace: { id: string; name: string; type: string; ownerUserId: string; tournaments?: Array<{ id: string; name: string; gameMode: string; numDays: number; createdAt: Date }> }; role: string }) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            role={role as string}
          />
        ))}

        <CreateWorkspaceCTA />
      </div>

      {/* Quick stats telemetry panel */}
      {workspaceList.length > 0 && (
        <div className="pt-8 border-t border-line">
          <p className="telemetry-channel text-signal-cyan mb-4">
            SYSTEM.OVERVIEW // METRICS
          </p>
          <div className="grid sm:grid-cols-3 gap-5 font-mono">
            <StatCard
              icon={<Shield size={18} className="text-signal-orange" />}
              label="ACTIVE WORKSPACES"
              value={workspaceList.length}
            />
            <StatCard
              icon={<Trophy size={18} className="text-signal-cyan" />}
              label="TOTAL TOURNAMENTS"
              value={workspaceList.reduce(
                (acc: number, { workspace }: { workspace: { tournaments?: unknown[] } }) =>
                  acc + (workspace.tournaments?.length ?? 0),
                0
              )}
            />
            <StatCard
              icon={<Users size={18} className="text-text-primary" />}
              label="TEAM WORKSPACES"
              value={
                workspaceList.filter(({ workspace }: { workspace: { type: string } }) => workspace.type === "team")
                  .length
              }
            />
          </div>
        </div>
      )}

      {/* Footer brand */}
      <div className="pt-12 text-center font-mono text-[10px] text-text-muted/60">
        AXIS STAT ENGINE v1.0 · POWERED BY NOVA TECHNOLOGIES
      </div>
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
      className="telemetry-panel p-5 hover:border-signal-orange/60 transition-all flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-line/60 pb-2">
          <span className="telemetry-channel">
            {isTeam ? "TEAM.WORKSPACE" : "PERSONAL.WORKSPACE"}
          </span>
          <span className="font-mono text-[10px] uppercase font-bold text-signal-cyan">
            {role}
          </span>
        </div>

        <h2 className="font-display font-bold text-text-primary text-lg leading-tight uppercase group-hover:text-signal-orange transition">
          {workspace.name}
        </h2>
      </div>

      <div className="mt-6 pt-4 border-t border-line/40 space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Trophy size={13} className="text-signal-orange" />
            <span className="font-bold text-text-primary">{tournaments.length}</span> EVENTS
          </span>
          <span className="text-[11px] font-semibold text-signal-cyan flex items-center gap-1">
            <Users size={12} /> MEMBERS
          </span>
        </div>

        {tournaments.length > 0 && (
          <div className="font-mono text-[11px] bg-panel-raised p-2 rounded-sm border border-line/40">
            <p className="text-text-muted text-[9px] uppercase tracking-wider">LATEST EVENT</p>
            <p className="text-text-primary font-bold truncate mt-0.5">{tournaments[0].name}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{tournaments[0].numDays} DAYS · {tournaments[0].gameMode.toUpperCase()}</p>
          </div>
        )}
      </div>
    </Link>
  );
}

function CreateWorkspaceCTA() {
  return (
    <div className="telemetry-panel border-dashed p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[180px] hover:border-signal-orange/50 transition group cursor-pointer">
      <div className="grid size-9 place-items-center rounded-sm bg-signal-orange/10 border border-signal-orange/30 text-signal-orange group-hover:bg-signal-orange group-hover:text-black transition">
        <Plus size={18} />
      </div>
      <div>
        <p className="font-display text-sm font-bold uppercase text-text-primary">
          Create Team Workspace
        </p>
        <p className="font-mono text-[11px] text-text-muted mt-1">
          INVITE ANALYSTS & OBSERVERS
        </p>
      </div>
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
    <div className="telemetry-panel p-4 flex items-center gap-4">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="font-mono text-2xl font-bold text-text-primary">{value}</p>
        <p className="font-mono text-[10px] text-text-muted tracking-wider">{label}</p>
      </div>
    </div>
  );
}
