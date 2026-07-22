"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function assertCanEdit(tournamentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) throw new Error("Not found");

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: tournament.workspaceId, userId },
    },
  });
  if (!member || member.role === "observer") throw new Error("Forbidden");

  return { userId, tournament };
}

// ── TEAMS ──────────────────────────────────────────────────────────────────
export async function upsertTeam(
  tournamentId: string,
  data: {
    id?: string;
    teamName: string;
    clanName: string;
    tier: string;
    slotNumber: number;
  }
) {
  await assertCanEdit(tournamentId);

  if (data.id) {
    return prisma.team.update({
      where: { id: data.id },
      data: {
        teamName: data.teamName,
        clanName: data.clanName,
        tier: data.tier,
        slotNumber: data.slotNumber,
      },
    });
  }

  return prisma.team.create({
    data: {
      tournamentId,
      teamName: data.teamName,
      clanName: data.clanName,
      tier: data.tier,
      slotNumber: data.slotNumber,
    },
  });
}

export async function deleteTeam(tournamentId: string, teamId: string) {
  await assertCanEdit(tournamentId);
  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath(`/dashboard`);
}

// ── PLAYERS ────────────────────────────────────────────────────────────────
export async function upsertPlayer(
  tournamentId: string,
  data: {
    id?: string;
    teamId: string | null;
    professionalName: string;
    inGameName: string;
    gender: string;
    region: string;
    country: string;
    device: string;
    deviceModel: string;
    slotNumber: number;
  }
) {
  await assertCanEdit(tournamentId);

  if (data.id) {
    return prisma.player.update({
      where: { id: data.id },
      data: {
        teamId: data.teamId,
        professionalName: data.professionalName,
        inGameName: data.inGameName,
        gender: data.gender,
        region: data.region,
        country: data.country,
        device: data.device,
        deviceModel: data.deviceModel,
        slotNumber: data.slotNumber,
      },
    });
  }

  return prisma.player.create({
    data: {
      tournamentId,
      teamId: data.teamId,
      professionalName: data.professionalName,
      inGameName: data.inGameName,
      gender: data.gender,
      region: data.region,
      country: data.country,
      device: data.device,
      deviceModel: data.deviceModel,
      slotNumber: data.slotNumber,
    },
  });
}

export async function deletePlayer(tournamentId: string, playerId: string) {
  await assertCanEdit(tournamentId);
  await prisma.player.delete({ where: { id: playerId } });
}

// ── MATCH RESULTS ──────────────────────────────────────────────────────────
export async function upsertMatchResult(
  tournamentId: string,
  data: {
    id?: string;
    teamId: string;
    dayNumber: number;
    lobbyNumber: number;
    placement: number | null;
    kills: number;
    bonusAdd: number;
    bonusMinus: number;
  }
) {
  await assertCanEdit(tournamentId);

  if (data.id) {
    return prisma.matchResult.update({
      where: { id: data.id },
      data: {
        teamId: data.teamId,
        dayNumber: data.dayNumber,
        lobbyNumber: data.lobbyNumber,
        placement: data.placement,
        kills: data.kills,
        bonusAdd: data.bonusAdd,
        bonusMinus: data.bonusMinus,
      },
    });
  }

  return prisma.matchResult.create({
    data: {
      tournamentId,
      teamId: data.teamId,
      dayNumber: data.dayNumber,
      lobbyNumber: data.lobbyNumber,
      placement: data.placement,
      kills: data.kills,
      bonusAdd: data.bonusAdd,
      bonusMinus: data.bonusMinus,
    },
  });
}

export async function deleteMatchResult(
  tournamentId: string,
  resultId: string
) {
  await assertCanEdit(tournamentId);
  await prisma.matchResult.delete({ where: { id: resultId } });
}

// ── PLAYER STATS ───────────────────────────────────────────────────────────
export async function upsertPlayerStat(
  tournamentId: string,
  data: {
    id?: string;
    playerId: string;
    dayNumber: number;
    lobbyNumber: number;
    kills: number;
    damage: number;
    accuracy: number;
  }
) {
  await assertCanEdit(tournamentId);

  if (data.id) {
    return prisma.playerMatchStat.update({
      where: { id: data.id },
      data: {
        playerId: data.playerId,
        dayNumber: data.dayNumber,
        lobbyNumber: data.lobbyNumber,
        kills: data.kills,
        damage: data.damage,
        accuracy: data.accuracy,
      },
    });
  }

  return prisma.playerMatchStat.create({
    data: {
      tournamentId,
      playerId: data.playerId,
      dayNumber: data.dayNumber,
      lobbyNumber: data.lobbyNumber,
      kills: data.kills,
      damage: data.damage,
      accuracy: data.accuracy,
    },
  });
}

export async function deletePlayerStat(
  tournamentId: string,
  statId: string
) {
  await assertCanEdit(tournamentId);
  await prisma.playerMatchStat.delete({ where: { id: statId } });
}

// ── SCORING CONFIG ─────────────────────────────────────────────────────────
export async function updateScoringConfig(
  tournamentId: string,
  data: {
    pointsPerKill: number;
    placementPoints: Record<number, number>;
  }
) {
  await assertCanEdit(tournamentId);

  return prisma.scoringConfig.upsert({
    where: { tournamentId },
    create: {
      tournamentId,
      pointsPerKill: data.pointsPerKill,
      placementPoints: data.placementPoints,
    },
    update: {
      pointsPerKill: data.pointsPerKill,
      placementPoints: data.placementPoints,
    },
  });
}

// ── BULK IMPORT ────────────────────────────────────────────────────────────
export async function bulkImportTeams(
  tournamentId: string,
  teams: Array<{
    teamName: string;
    clanName: string;
    tier: string;
    slotNumber: number;
  }>
) {
  await assertCanEdit(tournamentId);

  const created = await Promise.all(
    teams.map((t) =>
      prisma.team.create({
        data: { ...t, tournamentId },
      })
    )
  );
  return created;
}

export async function bulkImportPlayers(
  tournamentId: string,
  players: Array<{
    teamId: string | null;
    professionalName: string;
    inGameName: string;
    gender: string;
    region: string;
    country: string;
    device: string;
    deviceModel: string;
    slotNumber: number;
  }>
) {
  await assertCanEdit(tournamentId);

  const created = await Promise.all(
    players.map((p) =>
      prisma.player.create({
        data: { ...p, tournamentId },
      })
    )
  );
  return created;
}

export async function bulkImportMatchResults(
  tournamentId: string,
  results: Array<{
    teamId: string;
    dayNumber: number;
    lobbyNumber: number;
    placement: number | null;
    kills: number;
    bonusAdd: number;
    bonusMinus: number;
  }>
) {
  await assertCanEdit(tournamentId);

  const created = await Promise.all(
    results.map((r) =>
      prisma.matchResult.create({
        data: { ...r, tournamentId },
      })
    )
  );
  return created;
}

export async function bulkImportPlayerStats(
  tournamentId: string,
  stats: Array<{
    playerId: string;
    dayNumber: number;
    lobbyNumber: number;
    kills: number;
    damage: number;
    accuracy: number;
  }>
) {
  await assertCanEdit(tournamentId);

  const created = await Promise.all(
    stats.map((s) =>
      prisma.playerMatchStat.create({
        data: { ...s, tournamentId },
      })
    )
  );
  return created;
}
