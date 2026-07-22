import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Shield,
  Trophy,
  Users,
  ClipboardList,
  Zap,
  ArrowRight,
  BarChart3,
  Globe,
} from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-line/30 bg-[#080a0e]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-md bg-accent/15 text-accent">
              <Shield size={16} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-foreground">
                Axis Engine
              </p>
              <p className="text-[9px] text-muted leading-tight">
                by Nova Technologies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-muted hover:text-foreground transition"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-bold text-black hover:bg-accent/90 transition"
            >
              Get started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-28 px-6 text-center">
        {/* Glow blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-accent/10 blur-[120px]" />
          <div className="absolute top-10 right-[5%] w-[300px] h-[300px] rounded-full bg-danger/8 blur-[90px]" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent mb-6">
            <Zap size={12} />
            Powered by Axis Stat Engine · Built on Nova Technologies
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05]">
            CODM Battle Royale
            <br />
            <span className="bg-gradient-to-r from-accent via-[#60e8d0] to-accent bg-clip-text text-transparent">
              Axis Results Engine
            </span>
          </h1>

          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            A multi-user esports analytics platform for CODM BR analysts.
            Create tournament workspaces, invite your team, enter match data,
            and watch live standings compute in real-time.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-3.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(60,190,170,0.35)] hover:bg-accent/90 hover:shadow-[0_0_32px_rgba(60,190,170,0.5)] transition-all"
            >
              Start your workspace <ArrowRight size={16} />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg border border-line/70 bg-white/5 px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-white/10 transition"
            >
              Sign in to existing account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-3">
              Platform Features
            </p>
            <h2 className="text-3xl font-bold text-foreground">
              Everything your analyst team needs
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Multi-user callout ── */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-5xl rounded-2xl border border-accent/20 bg-accent/5 p-10 text-center relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full bg-accent/10 blur-[60px]" />
          </div>
          <div className="relative">
            <Users className="text-accent mx-auto mb-4" size={36} />
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Built for analyst teams
            </h2>
            <p className="text-muted max-w-xl mx-auto leading-relaxed text-sm">
              Create a team workspace, invite your analysts and observers.
              Everyone works on the same tournament data in real-time — no
              more emailing spreadsheets back and forth.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-muted">
              <RolePill role="Owner" desc="Full control" color="accent" />
              <RolePill role="Analyst" desc="Enter & edit data" color="success" />
              <RolePill role="Observer" desc="Read-only view" color="muted" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-line/30 px-6 py-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-accent" />
            <span>Axis BR Results Engine</span>
          </div>
          <p>Powered by Axis Stat Engine · Built on Nova Technologies</p>
          <p>© {new Date().getFullYear()} Nova Technologies</p>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: Trophy,
    title: "Live Team Standings",
    desc: "Standings recompute instantly as you enter match results. Rank change indicators, day-by-day breakdown, placement points + kill points.",
  },
  {
    icon: ClipboardList,
    title: "Smart Data Entry",
    desc: "Manual row entry or copy-paste from Excel/Google Sheets. The auto-parser detects columns and delimiters heuristically.",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    desc: "Create shared workspaces, invite analysts and observers. Role-aware UI — Observers see live data but cannot modify anything.",
  },
  {
    icon: BarChart3,
    title: "Player Leaderboard",
    desc: "Per-player kill leaderboard with total kills, avg damage, avg accuracy, kills per match — computed dynamically.",
  },
  {
    icon: Zap,
    title: "Paste Import Wizard",
    desc: "Paste tabular data directly from spreadsheets. Levenshtein similarity matching deduplicates players and teams against the global registry.",
  },
  {
    icon: Globe,
    title: "Custom Scoring Engine",
    desc: "Fully custom points-per-kill and placement points table per tournament. Edit anytime and standings recompute live.",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-line/60 bg-panel/60 p-6 backdrop-blur-sm hover:border-accent/30 transition-colors group">
      <div className="mb-4 grid size-10 place-items-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/15 transition-colors">
        <Icon size={20} />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{desc}</p>
    </div>
  );
}

function RolePill({
  role,
  desc,
  color,
}: {
  role: string;
  desc: string;
  color: "accent" | "success" | "muted";
}) {
  const colorClass =
    color === "accent"
      ? "text-accent border-accent/30 bg-accent/10"
      : color === "success"
        ? "text-success border-success/30 bg-success/10"
        : "text-muted border-line/50 bg-white/5";

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-4 py-2 ${colorClass}`}
    >
      <span className="font-bold">{role}</span>
      <span className="opacity-70">—</span>
      <span>{desc}</span>
    </div>
  );
}
