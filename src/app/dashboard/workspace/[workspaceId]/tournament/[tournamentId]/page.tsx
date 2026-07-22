import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTournamentData } from "@/lib/actions/tournament";
import { AppShell } from "@/components/app-shell";
import type {
  Tournament,
  Workspace,
  ScoringConfig,
  Team,
  Player,
  MatchResult,
  PlayerMatchStat,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ workspaceId: string; tournamentId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceId, tournamentId } = await params;

  let data;
  try {
    data = await getTournamentData(tournamentId);
  } catch {
    redirect(`/dashboard/workspace/${workspaceId}`);
  }

  if (!data) redirect(`/dashboard/workspace/${workspaceId}`);

  const { tournament, role, teams, players, matchResults, playerStats } = data;

  // Build typed objects for AppShell
  const activeWorkspace: Workspace = {
    id: workspaceId,
    name: tournament.workspaceId, // will be replaced below
    type: "team",
    ownerUserId: tournament.createdBy,
    currentUserRole: role as "owner" | "analyst" | "observer",
  };

  const activeTournament: Tournament = {
    id: tournament.id,
    workspaceId: tournament.workspaceId,
    name: tournament.name,
    gameMode: tournament.gameMode as Tournament["gameMode"],
    format: tournament.format as Tournament["format"],
    numDays: tournament.numDays,
    lobbiesPerDay: tournament.lobbiesPerDay,
    createdBy: tournament.createdBy,
    createdAt: tournament.createdAt.toISOString(),
  };

  const scoringConfigRaw = tournament.scoringConfig;
  const scoringConfig: ScoringConfig = {
    id: scoringConfigRaw?.id ?? `sc-${tournamentId}`,
    tournamentId: tournamentId,
    pointsPerKill: Number(scoringConfigRaw?.pointsPerKill ?? 1),
    placementPoints: (scoringConfigRaw?.placementPoints as Record<number, number>) ?? {
      1: 25,
      2: 20,
      3: 15,
      4: 10,
      5: 5,
    },
  };

  const typedTeams: Team[] = teams.map((t: { id: string; tournamentId: string; teamName: string; clanName?: string | null; tier?: string | null; slotNumber: number }) => ({
    id: t.id,
    tournamentId: t.tournamentId,
    teamName: t.teamName,
    clanName: t.clanName ?? "",
    tier: t.tier ?? "Pro",
    slotNumber: t.slotNumber,
  }));

  const typedPlayers: Player[] = players.map((p: { id: string; tournamentId: string; teamId: string | null; professionalName: string; inGameName: string; gender?: string | null; region?: string | null; country?: string | null; device?: string | null; deviceModel?: string | null; slotNumber?: number | null }) => ({
    id: p.id,
    tournamentId: p.tournamentId,
    teamId: p.teamId,
    professionalName: p.professionalName,
    inGameName: p.inGameName,
    gender: p.gender ?? "Not specified",
    region: p.region ?? "Africa",
    country: p.country ?? "Nigeria",
    device: p.device ?? "Mobile",
    deviceModel: p.deviceModel ?? "",
    slotNumber: p.slotNumber ?? 0,
  }));

  const typedMatchResults: MatchResult[] = matchResults.map((m: { id: string; tournamentId: string; teamId: string; dayNumber: number; lobbyNumber: number; placement: number | null; kills: number; bonusAdd: number; bonusMinus: number }) => ({
    id: m.id,
    tournamentId: m.tournamentId,
    teamId: m.teamId,
    dayNumber: m.dayNumber,
    lobbyNumber: m.lobbyNumber,
    placement: m.placement,
    kills: m.kills,
    bonusAdd: m.bonusAdd,
    bonusMinus: m.bonusMinus,
  }));

  const typedPlayerStats: PlayerMatchStat[] = playerStats.map((s: { id: string; tournamentId: string; playerId: string; dayNumber: number; lobbyNumber: number; kills: number; damage: number; accuracy: unknown }) => ({
    id: s.id,
    tournamentId: s.tournamentId,
    playerId: s.playerId,
    dayNumber: s.dayNumber,
    lobbyNumber: s.lobbyNumber,
    kills: s.kills,
    damage: s.damage,
    accuracy: Number(s.accuracy),
  }));

  // Build a minimal workspace list and tournament list for the switchers
  const workspaceObj: Workspace = {
    ...activeWorkspace,
    name: activeTournament.name, // Use tournament name for display in switcher
  };

  return (
    <AppShell
      workspaces={[workspaceObj]}
      tournaments={[activeTournament]}
      activeWorkspace={{ ...activeWorkspace, name: workspaceId }}
      activeTournament={activeTournament}
      scoringConfig={scoringConfig}
      initialTeams={typedTeams}
      initialPlayers={typedPlayers}
      initialMatchResults={typedMatchResults}
      initialPlayerMatchStats={typedPlayerStats}
      workspaceId={workspaceId}
    />
  );
}
