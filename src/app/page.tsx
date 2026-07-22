import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AxisWordmark } from "@/components/axis-wordmark";
import {
  ArrowRight,
  Shield,
  Check,
  Zap,
  TrendingUp,
  TrendingDown,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-void text-text-primary overflow-x-hidden font-sans">
      {/* ── Technical Nav Bar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-line bg-void/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-7 place-items-center rounded bg-signal-orange/15 text-signal-orange border border-signal-orange/30 font-mono text-xs font-bold">
              AX
            </div>
            <div>
              <p className="font-display text-sm font-bold tracking-tight text-text-primary">
                AXIS ENGINE
              </p>
              <p className="font-mono text-[9px] text-text-muted tracking-wider">
                OPS.CONSOLE // V1.0
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="font-mono text-xs text-text-muted hover:text-text-primary transition uppercase tracking-wider"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-sm bg-signal-orange px-4 py-2 font-mono text-xs font-bold text-black hover:bg-signal-orange/90 transition tracking-wider uppercase"
            >
              Launch Console <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Telemetry Hero Section ── */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Animated Logo + Telemetry Readout + CTAs */}
          <div className="lg:col-span-6 space-y-8">
            <AxisWordmark />

            <p className="text-base text-text-muted leading-relaxed max-w-xl">
              Live esports operations console for CODM Battle Royale analysts. Enter match telemetry, run real-time point re-computations, and manage tournament workspaces with zero delay.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-sm bg-signal-orange px-6 py-3 font-mono text-xs font-bold text-black uppercase tracking-wider hover:bg-signal-orange/90 transition shadow-panel-glow"
              >
                Start Workspace <ArrowRight size={14} />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-sm border border-line bg-panel px-6 py-3 font-mono text-xs font-medium text-text-primary uppercase tracking-wider hover:border-text-muted transition"
              >
                Sign In To Console
              </Link>
            </div>

            <div className="pt-4 border-t border-line/60 flex items-center gap-6 font-mono text-[11px] text-text-muted">
              <span>NO SPREADSHEETS</span>
              <span className="text-line">•</span>
              <span>LEVENSHTEIN MATCHING</span>
              <span className="text-line">•</span>
              <span>ROLE RBAC</span>
            </div>
          </div>

          {/* Right Column: Live Standings Telemetry Mockup */}
          <div className="lg:col-span-6">
            <div className="telemetry-panel p-4 shadow-cyan-glow">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-signal-cyan animate-pulse" />
                  <span className="telemetry-channel text-signal-cyan">
                    CHANNEL // STANDINGS.LIVE
                  </span>
                </div>
                <span className="font-mono text-[10px] text-text-muted">
                  MATCH 6/6 · GRAND FINALS
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="text-left text-text-muted border-b border-line/50">
                      <th className="py-2 px-2 text-[10px] uppercase">RANK</th>
                      <th className="py-2 px-2 text-[10px] uppercase">TEAM</th>
                      <th className="py-2 px-2 text-right text-[10px] uppercase">PTS</th>
                      <th className="py-2 px-2 text-right text-[10px] uppercase">PLACE</th>
                      <th className="py-2 px-2 text-right text-[10px] uppercase">ELIMS</th>
                      <th className="py-2 px-2 text-center text-[10px] uppercase">TREND</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/30">
                    {heroStandings.map((row) => (
                      <tr key={row.team} className="hover:bg-panel-raised/50 transition">
                        <td className="py-2.5 px-2 font-bold text-text-primary">#{row.rank}</td>
                        <td className="py-2.5 px-2 font-bold text-text-primary flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-signal-orange" />
                          {row.team}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-signal-cyan">{row.pts}</td>
                        <td className="py-2.5 px-2 text-right text-text-muted">{row.place}</td>
                        <td className="py-2.5 px-2 text-right text-text-muted">{row.elims}</td>
                        <td className="py-2.5 px-2 text-center">
                          {row.trend > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-signal-cyan font-bold">
                              <TrendingUp size={12} />+{row.trend}
                            </span>
                          ) : row.trend < 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-signal-red font-bold">
                              <TrendingDown size={12} />{row.trend}
                            </span>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 pt-2 border-t border-line/40 flex items-center justify-between text-[10px] font-mono text-text-muted">
                <span>RECOMPUTATION TIME: 0.02s</span>
                <span className="text-signal-cyan">AUTO-SYNCED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Telemetry Feature Panels Grid ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-line">
        <div className="mb-12">
          <p className="telemetry-channel text-signal-orange mb-1">
            OPS.SYSTEM // CAPABILITIES
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight uppercase">
            Telemetry & Data Infrastructure
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Panel 1: Live Standings */}
          <div className="telemetry-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
                <span className="telemetry-channel">STANDINGS.LIVE</span>
                <span className="size-2 rounded-full bg-signal-cyan" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Live Real-time Standings</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Recomputes rank standings instantly on match data submission. Zero page reloads required.
              </p>
            </div>
            <div className="telemetry-panel-raised p-3 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between text-text-muted">
                <span>1. GodLike Esports</span>
                <span className="text-signal-cyan font-bold">142 PTS</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>2. Team Vitality</span>
                <span className="text-signal-cyan font-bold">128 PTS</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Smart Data Entry */}
          <div className="telemetry-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
                <span className="telemetry-channel">DATA.ENTRY</span>
                <span className="font-mono text-[10px] text-signal-orange">PARSER v2</span>
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Delimited Paste Parser</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Paste tabular data directly from Excel or Sheets. Auto-detects delimiters and column structures.
              </p>
            </div>
            <div className="telemetry-panel-raised p-3 font-mono text-[10px] text-text-muted">
              <p className="text-signal-orange font-semibold">RAW INPUT DETECTED:</p>
              <p className="truncate text-text-primary/70 mt-1">S8UL Esports | Placement: 1 | Kills: 14</p>
              <p className="text-signal-cyan font-semibold mt-2">Parsed into 3 columns clean.</p>
            </div>
          </div>

          {/* Panel 3: RBAC Roles */}
          <div className="telemetry-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
                <span className="telemetry-channel">WORKSPACE.ROLES</span>
                <Lock size={12} className="text-text-muted" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Role Permission Matrix</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Enforces strict access controls across team members: Owners, Analysts, and Observers.
              </p>
            </div>
            <div className="telemetry-panel-raised p-3 font-mono text-[11px] space-y-1 text-text-muted">
              <div className="flex justify-between">
                <span>OWNER</span>
                <span className="text-signal-orange">FULL ADMIN</span>
              </div>
              <div className="flex justify-between">
                <span>ANALYST</span>
                <span className="text-signal-cyan">DATA ENTRY</span>
              </div>
              <div className="flex justify-between">
                <span>OBSERVER</span>
                <span className="text-text-muted">READ ONLY</span>
              </div>
            </div>
          </div>

          {/* Panel 4: Player Telemetry */}
          <div className="telemetry-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
                <span className="telemetry-channel">LB.KILLS</span>
                <span className="font-mono text-[10px] text-signal-cyan">TELEMETRY</span>
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Player Leaderboard Engine</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Per-player kill tracking, damage averages, and accuracy metrics updated per match.
              </p>
            </div>
            <div className="telemetry-panel-raised p-3 font-mono text-[11px] space-y-1">
              <div className="flex justify-between text-text-muted">
                <span>1. Learn (GodLike)</span>
                <span className="text-signal-orange font-bold">28 KILLS</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>2. Neutrino (Vitality)</span>
                <span className="text-signal-orange font-bold">24 KILLS</span>
              </div>
            </div>
          </div>

          {/* Panel 5: Custom Scoring */}
          <div className="telemetry-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
                <span className="telemetry-channel">SCORING.CONFIG</span>
                <Zap size={12} className="text-signal-orange" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Dynamic Scoring Matrix</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Custom points tables per tournament format. Adjust placement rules and point values live.
              </p>
            </div>
            <div className="telemetry-panel-raised p-3 font-mono text-[11px] flex justify-between text-text-muted">
              <span>#1 = 15 PTS</span>
              <span>#2 = 12 PTS</span>
              <span className="text-signal-orange">KILL = 1 PT</span>
            </div>
          </div>

          {/* Panel 6: Fuzzy Dedup */}
          <div className="telemetry-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
                <span className="telemetry-channel">IMPORT.WIZARD</span>
                <Sparkles size={12} className="text-signal-cyan" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Levenshtein Deduplication</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Fuzzy similarity matching prevents duplicate team and player registrations.
              </p>
            </div>
            <div className="telemetry-panel-raised p-3 font-mono text-[10px] space-y-1 text-text-muted">
              <div className="flex justify-between">
                <span>"GodLike_BR" → GodLike Esports</span>
                <span className="text-signal-cyan font-bold">96% MATCH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Monospace Footer ── */}
      <footer className="border-t border-line py-8 px-6 bg-void">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-signal-orange" />
            <span className="text-text-primary font-bold">AXIS BR RESULTS ENGINE</span>
          </div>
          <span>POWERED BY AXIS STAT ENGINE · NOVA TECHNOLOGIES</span>
          <span>© 2026 NOVA TECHNOLOGIES · AXIS.ENGINE.V1</span>
        </div>
      </footer>
    </main>
  );
}

const heroStandings = [
  { rank: 1, team: "GodLike Esports", pts: 142, place: 48, elims: 94, trend: 2 },
  { rank: 2, team: "Team Vitality", pts: 128, place: 42, elims: 86, trend: -1 },
  { rank: 3, team: "S8UL Esports", pts: 115, place: 35, elims: 80, trend: 1 },
  { rank: 4, team: "Team Secret", pts: 98, place: 30, elims: 68, trend: 0 },
  { rank: 5, team: "TDM Gaming", pts: 84, place: 24, elims: 60, trend: -2 },
];
