"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Loader2,
  Trophy,
  Calendar,
  Gamepad2,
  Layers3,
} from "lucide-react";
import { createTournament } from "@/lib/actions/tournament";

interface Tournament {
  id: string;
  name: string;
  gameMode: string;
  format: string;
  numDays: number;
  lobbiesPerDay: number;
  createdAt: Date;
}

interface WorkspaceHomeClientProps {
  workspaceId: string;
  workspaceName: string;
  workspaceType: string;
  role: string;
  tournaments: Tournament[];
}

export function WorkspaceHomeClient({
  workspaceId,
  workspaceName,
  workspaceType,
  role,
  tournaments: initialTournaments,
}: WorkspaceHomeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    gameMode: "squad" as "solo" | "duo" | "squad",
    format: "team" as "player" | "team" | "both",
    numDays: "3",
    lobbiesPerDay: "6",
  });

  const canEdit = role !== "observer";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const tournament = await createTournament(workspaceId, {
        name: form.name,
        gameMode: form.gameMode,
        format: form.format,
        numDays: Number(form.numDays),
        lobbiesPerDay: Number(form.lobbiesPerDay),
      });
      setShowCreate(false);
      setForm({
        name: "",
        gameMode: "squad",
        format: "team",
        numDays: "3",
        lobbiesPerDay: "6",
      });
      router.push(
        `/dashboard/workspace/${workspaceId}/tournament/${tournament.id}`
      );
    });
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-1">
            {workspaceType === "team" ? "Team Workspace" : "Personal Workspace"}
          </p>
          <h1 className="text-3xl font-bold text-foreground">{workspaceName}</h1>
          <p className="text-sm text-muted mt-1 capitalize">
            Your role: <span className="text-accent font-semibold">{role}</span>
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-black hover:bg-accent/90 transition shadow-[0_0_16px_rgba(60,190,170,0.25)]"
          >
            <Plus size={16} /> New Tournament
          </button>
        )}
      </div>

      {/* Tournament Grid */}
      {initialTournaments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line/50 p-16 text-center">
          <Trophy size={36} className="text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No tournaments yet
          </h2>
          <p className="text-sm text-muted mb-6">
            {canEdit
              ? "Create your first tournament to start entering match results."
              : "No tournaments have been created in this workspace yet."}
          </p>
          {canEdit && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-black hover:bg-accent/90 transition"
            >
              <Plus size={16} /> Create Tournament
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {initialTournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              workspaceId={workspaceId}
            />
          ))}
          {canEdit && (
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-xl border border-dashed border-line/50 p-5 flex flex-col items-center justify-center gap-3 min-h-[180px] hover:border-accent/30 hover:bg-accent/3 transition-colors group text-center"
            >
              <div className="grid size-10 place-items-center rounded-lg border border-dashed border-line/60 text-muted group-hover:border-accent/40 group-hover:text-accent transition">
                <Plus size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  New Tournament
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Start a new event
                </p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-line/70 bg-[#12161d] p-6 shadow-[0_0_40px_rgba(60,190,170,0.08)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold">Create Tournament</h2>
                <p className="text-xs text-muted mt-0.5">
                  Configure the event format and scoring structure
                </p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="text-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">
                  Tournament Name
                </label>
                <input
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. CODM Africa Open 2026 — Day 1"
                  className="w-full h-10 rounded-md bg-black/40 border border-line/70 px-3 text-sm focus:border-accent outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted block mb-1.5">
                    Game Mode
                  </label>
                  <select
                    value={form.gameMode}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        gameMode: e.target.value as "solo" | "duo" | "squad",
                      }))
                    }
                    className="w-full h-10 rounded-md bg-black/40 border border-line/70 px-3 text-sm focus:border-accent outline-none"
                  >
                    <option value="solo">Solo</option>
                    <option value="duo">Duo</option>
                    <option value="squad">Squad</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1.5">
                    Format
                  </label>
                  <select
                    value={form.format}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        format: e.target.value as "player" | "team" | "both",
                      }))
                    }
                    className="w-full h-10 rounded-md bg-black/40 border border-line/70 px-3 text-sm focus:border-accent outline-none"
                  >
                    <option value="team">Team</option>
                    <option value="player">Player</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted block mb-1.5">
                    Number of Days
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="30"
                    value={form.numDays}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, numDays: e.target.value }))
                    }
                    className="w-full h-10 rounded-md bg-black/40 border border-line/70 px-3 text-sm focus:border-accent outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1.5">
                    Lobbies per Day
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="20"
                    value={form.lobbiesPerDay}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        lobbiesPerDay: e.target.value,
                      }))
                    }
                    className="w-full h-10 rounded-md bg-black/40 border border-line/70 px-3 text-sm focus:border-accent outline-none font-mono"
                  />
                </div>
              </div>

              <div className="rounded-md border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-muted">
                A default scoring config (1st=25, 2nd=20, 3rd=15, 4th=10,
                5th=5, 6th+=0 · 1pt/kill) will be created. You can edit it
                inside the tournament.
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
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
                    <Trophy size={15} />
                  )}
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TournamentCard({
  tournament,
  workspaceId,
}: {
  tournament: Tournament;
  workspaceId: string;
}) {
  const created = new Date(tournament.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <a
      href={`/dashboard/workspace/${workspaceId}/tournament/${tournament.id}`}
      className="group rounded-xl border border-line/60 bg-panel/60 p-5 hover:border-accent/30 hover:bg-panel/80 transition-all hover:shadow-[0_0_24px_rgba(60,190,170,0.06)] flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="grid size-10 place-items-center rounded-lg bg-yellow-400/10 text-yellow-400">
          <Trophy size={20} />
        </div>
        <span className="text-[10px] text-muted border border-line/40 rounded px-2 py-0.5 capitalize">
          {tournament.format}
        </span>
      </div>

      <div>
        <h3 className="font-bold text-foreground text-sm leading-snug">
          {tournament.name}
        </h3>
        <p className="text-xs text-muted mt-0.5 capitalize">
          {tournament.gameMode} mode
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted mt-auto">
        <span className="flex items-center gap-1">
          <Calendar size={11} /> {created}
        </span>
        <span className="flex items-center gap-1">
          <Layers3 size={11} /> {tournament.numDays}d ·{" "}
          {tournament.lobbiesPerDay}L
        </span>
        <span className="flex items-center gap-1">
          <Gamepad2 size={11} /> {tournament.gameMode}
        </span>
      </div>
    </a>
  );
}
