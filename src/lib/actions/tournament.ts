"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { defaultPlacementPoints } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";

// ── LIST tournaments in a workspace ───────────────────────────────────────
export async function getTournaments(workspaceId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new Error("Forbidden");

  const tournaments = await prisma.tournament.findMany({
    where: { workspaceId },
    include: { scoringConfig: true },
    orderBy: { createdAt: "desc" },
  });

  return tournaments.map((t) => ({
    ...t,
    scoringConfig: t.scoringConfig
      ? {
          ...t.scoringConfig,
          pointsPerKill: Number(t.scoringConfig.pointsPerKill),
        }
      : null,
  }));
}

// ── CREATE tournament ──────────────────────────────────────────────────────
export async function createTournament(
  workspaceId: string,
  data: {
    name: string;
    gameMode: "solo" | "duo" | "squad";
    format: "player" | "team" | "both";
    numDays: number;
    lobbiesPerDay: number;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member || member.role === "observer") throw new Error("Forbidden");

  const placementPoints = defaultPlacementPoints(25);

  const tournament = await prisma.tournament.create({
    data: {
      workspaceId,
      name: data.name,
      gameMode: data.gameMode,
      format: data.format,
      numDays: data.numDays,
      lobbiesPerDay: data.lobbiesPerDay,
      createdBy: userId,
      scoringConfig: {
        create: {
          pointsPerKill: 1,
          placementPoints,
        },
      },
    },
    include: { scoringConfig: true },
  });

  revalidatePath(`/dashboard/workspace/${workspaceId}`);
  return tournament;
}

// ── DELETE tournament ──────────────────────────────────────────────────────
export async function deleteTournament(tournamentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) throw new Error("Not found");

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: tournament.workspaceId, userId } },
  });
  if (!member || member.role === "observer") throw new Error("Forbidden");

  await prisma.tournament.delete({ where: { id: tournamentId } });
  revalidatePath(`/dashboard/workspace/${tournament.workspaceId}`);
}

// ── GET full tournament data (teams, players, results, stats) ──────────────
export async function getTournamentData(tournamentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { scoringConfig: true },
  });
  if (!tournament) throw new Error("Not found");

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: tournament.workspaceId, userId },
    },
  });
  if (!member) throw new Error("Forbidden");

  const [teams, players, matchResults, playerStats] = await Promise.all([
    prisma.team.findMany({
      where: { tournamentId },
      orderBy: { slotNumber: "asc" },
    }),
    prisma.player.findMany({
      where: { tournamentId },
      orderBy: [{ slotNumber: "asc" }, { professionalName: "asc" }],
    }),
    prisma.matchResult.findMany({
      where: { tournamentId },
      orderBy: [{ dayNumber: "asc" }, { lobbyNumber: "asc" }],
    }),
    prisma.playerMatchStat.findMany({
      where: { tournamentId },
      orderBy: [{ dayNumber: "asc" }, { lobbyNumber: "asc" }],
    }),
  ]);

  return {
    tournament: {
      ...tournament,
      scoringConfig: tournament.scoringConfig
        ? {
            ...tournament.scoringConfig,
            pointsPerKill: Number(tournament.scoringConfig.pointsPerKill),
          }
        : null,
    },
    role: member.role,
    teams,
    players,
    matchResults,
    playerStats: playerStats.map((s) => ({
      ...s,
      accuracy: Number(s.accuracy),
    })),
  };
}
