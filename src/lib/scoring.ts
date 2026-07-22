import type {
  MatchResult,
  Player,
  PlayerMatchStat,
  PlayerStanding,
  ScoringConfig,
  Team,
  TeamDayStanding,
  TeamStanding,
} from "@/lib/types";

export const defaultPlacementPoints = (lobbySize = 25) => {
  const points: Record<number, number> = {};

  for (let placement = 1; placement <= lobbySize; placement += 1) {
    points[placement] =
      placement === 1
        ? 25
        : placement === 2
          ? 20
          : placement === 3
            ? 15
            : placement === 4
              ? 10
              : placement === 5
                ? 5
                : 0;
  }

  return points;
};

const round = (value: number, digits = 1) =>
  Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;

export function getPlacementPoints(
  scoringConfig: ScoringConfig,
  placement: number | null,
) {
  if (!placement) {
    return 0;
  }

  return scoringConfig.placementPoints[placement] ?? 0;
}

export function buildTeamStandings({
  teams,
  matchResults,
  scoringConfig,
  numDays,
}: {
  teams: Team[];
  matchResults: MatchResult[];
  scoringConfig: ScoringConfig;
  numDays: number;
}): TeamStanding[] {
  const current = buildTeamSnapshot({
    teams,
    matchResults,
    scoringConfig,
    numDays,
  });

  const previous = buildTeamSnapshot({
    teams,
    matchResults: matchResults.filter((result) => result.dayNumber < numDays),
    scoringConfig,
    numDays: Math.max(numDays - 1, 1),
  });

  const previousRanks = new Map(
    previous.map((standing) => [standing.team.id, standing.rank]),
  );

  return current.map((standing) => ({
    ...standing,
    previousRank: previousRanks.get(standing.team.id) ?? null,
  }));
}

function buildTeamSnapshot({
  teams,
  matchResults,
  scoringConfig,
  numDays,
}: {
  teams: Team[];
  matchResults: MatchResult[];
  scoringConfig: ScoringConfig;
  numDays: number;
}): TeamStanding[] {
  const rows = teams.map((team) => {
    const teamResults = matchResults.filter((result) => result.teamId === team.id);
    const dayBreakdown = Array.from({ length: numDays }, (_, index) =>
      buildDayStanding({
        dayNumber: index + 1,
        results: teamResults.filter((result) => result.dayNumber === index + 1),
        scoringConfig,
      }),
    );

    const placementPoints = sum(dayBreakdown, "placementPoints");
    const killPoints = sum(dayBreakdown, "killPoints");
    const bonus = sum(dayBreakdown, "bonus");
    const totalKills = sum(dayBreakdown, "totalKills");
    const matchesPlayed = sum(dayBreakdown, "matchesPlayed");
    const wins = sum(dayBreakdown, "wins");
    const placements = teamResults
      .map((result) => result.placement)
      .filter((placement): placement is number => Boolean(placement));

    return {
      rank: 0,
      previousRank: null,
      team,
      matchesPlayed,
      wins,
      placementPoints,
      killPoints,
      bonus,
      totalKills,
      totalPoints: placementPoints + killPoints + bonus,
      avgPlacement: placements.length
        ? round(placements.reduce((total, placement) => total + placement, 0) / placements.length)
        : null,
      dayBreakdown,
    };
  });

  return rows
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      if (b.totalKills !== a.totalKills) {
        return b.totalKills - a.totalKills;
      }

      return a.team.slotNumber - b.team.slotNumber;
    })
    .map((standing, index) => ({ ...standing, rank: index + 1 }));
}

function buildDayStanding({
  dayNumber,
  results,
  scoringConfig,
}: {
  dayNumber: number;
  results: MatchResult[];
  scoringConfig: ScoringConfig;
}): TeamDayStanding {
  const placementPoints = results.reduce(
    (total, result) => total + getPlacementPoints(scoringConfig, result.placement),
    0,
  );
  const totalKills = results.reduce((total, result) => total + result.kills, 0);
  const bonus = results.reduce(
    (total, result) => total + result.bonusAdd - result.bonusMinus,
    0,
  );
  const placements = results
    .map((result) => result.placement)
    .filter((placement): placement is number => Boolean(placement));

  return {
    dayNumber,
    matchesPlayed: results.length,
    wins: results.filter((result) => result.placement === 1).length,
    placementPoints,
    killPoints: totalKills * scoringConfig.pointsPerKill,
    bonus,
    totalKills,
    totalPoints: placementPoints + totalKills * scoringConfig.pointsPerKill + bonus,
    avgPlacement: placements.length
      ? round(placements.reduce((total, placement) => total + placement, 0) / placements.length)
      : null,
  };
}

export function buildPlayerStandings({
  players,
  teams,
  playerMatchStats,
}: {
  players: Player[];
  teams: Team[];
  playerMatchStats: PlayerMatchStat[];
}): PlayerStanding[] {
  return players
    .map((player) => {
      const stats = playerMatchStats.filter((stat) => stat.playerId === player.id);
      const totalKills = stats.reduce((total, stat) => total + stat.kills, 0);
      const matchesPlayed = stats.length;
      const avgDamage = matchesPlayed
        ? stats.reduce((total, stat) => total + stat.damage, 0) / matchesPlayed
        : 0;
      const avgAccuracy = matchesPlayed
        ? stats.reduce((total, stat) => total + stat.accuracy, 0) / matchesPlayed
        : 0;

      return {
        rank: 0,
        player,
        team: teams.find((team) => team.id === player.teamId) ?? null,
        totalKills,
        avgDamage: round(avgDamage, 0),
        avgAccuracy: round(avgAccuracy, 1),
        matchesPlayed,
        killsPerMatch: matchesPlayed ? round(totalKills / matchesPlayed, 2) : 0,
        killsPerEvent: totalKills,
      };
    })
    .sort((a, b) => {
      if (b.totalKills !== a.totalKills) {
        return b.totalKills - a.totalKills;
      }

      if (b.avgDamage !== a.avgDamage) {
        return b.avgDamage - a.avgDamage;
      }

      return a.player.slotNumber - b.player.slotNumber;
    })
    .map((standing, index) => ({ ...standing, rank: index + 1 }));
}

function sum(rows: TeamDayStanding[], key: keyof Pick<TeamDayStanding, "placementPoints" | "killPoints" | "bonus" | "totalKills" | "matchesPlayed" | "wins">) {
  return rows.reduce((total, row) => total + row[key], 0);
}

