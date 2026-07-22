import { defaultPlacementPoints } from "@/lib/scoring";
import type {
  MatchResult,
  Player,
  PlayerMatchStat,
  ScoringConfig,
  Team,
  Tournament,
  Workspace,
} from "@/lib/types";

export const workspace: Workspace = {
  id: "ws-nightfall",
  name: "Nightfall Esports Ops",
  type: "team",
  ownerUserId: "user_zion",
  currentUserRole: "analyst",
};

export const workspaces: Workspace[] = [
  workspace,
  {
    id: "ws-personal",
    name: "Zion Personal",
    type: "personal",
    ownerUserId: "user_zion",
    currentUserRole: "owner",
  },
];

export const tournament: Tournament = {
  id: "trn-br-masters",
  workspaceId: workspace.id,
  name: "BR Masters Invitational",
  gameMode: "squad",
  format: "both",
  numDays: 3,
  lobbiesPerDay: 4,
  createdBy: "user_zion",
  createdAt: "2026-07-16T17:00:00Z",
};

export const tournaments: Tournament[] = [
  tournament,
  {
    id: "trn-weekly",
    workspaceId: workspace.id,
    name: "Thursday Scrim League",
    gameMode: "squad",
    format: "team",
    numDays: 2,
    lobbiesPerDay: 3,
    createdBy: "user_zion",
    createdAt: "2026-07-12T17:00:00Z",
  },
];

export const scoringConfig: ScoringConfig = {
  id: "score-default",
  tournamentId: tournament.id,
  pointsPerKill: 1,
  placementPoints: defaultPlacementPoints(18),
};

export const teams: Team[] = [
  ["tm-aurora", "Aurora Five", "AUR", "Pro", 1],
  ["tm-onyx", "Onyx Reign", "ONX", "Pro", 2],
  ["tm-vector", "Vector Black", "VEC", "Elite", 3],
  ["tm-kairo", "Kairo Unit", "KRU", "Elite", 4],
  ["tm-nova", "Nova Guard", "NVG", "Contender", 5],
  ["tm-lagos", "Lagos Storm", "LGS", "Contender", 6],
  ["tm-rift", "Riftline", "RFT", "Open", 7],
  ["tm-sable", "Sable Order", "SBL", "Open", 8],
].map(([id, teamName, clanName, tier, slotNumber]) => ({
  id: String(id),
  tournamentId: tournament.id,
  teamName: String(teamName),
  clanName: String(clanName),
  tier: String(tier),
  slotNumber: Number(slotNumber),
}));

export const matchResults: MatchResult[] = [
  ["tm-aurora", 1, 1, 1, 14, 0, 0],
  ["tm-onyx", 1, 1, 2, 11, 0, 0],
  ["tm-vector", 1, 1, 3, 9, 0, 0],
  ["tm-kairo", 1, 1, 6, 7, 2, 0],
  ["tm-nova", 1, 1, 4, 6, 0, 0],
  ["tm-lagos", 1, 1, 8, 5, 0, 0],
  ["tm-rift", 1, 1, 5, 3, 0, 0],
  ["tm-sable", 1, 1, 7, 2, 0, 1],
  ["tm-onyx", 1, 2, 1, 16, 0, 0],
  ["tm-kairo", 1, 2, 2, 10, 0, 0],
  ["tm-aurora", 1, 2, 5, 8, 0, 0],
  ["tm-vector", 1, 2, 3, 9, 0, 0],
  ["tm-nova", 1, 2, 6, 5, 0, 0],
  ["tm-lagos", 1, 2, 4, 7, 0, 0],
  ["tm-rift", 1, 2, 8, 3, 0, 0],
  ["tm-sable", 1, 2, 7, 2, 0, 0],
  ["tm-vector", 2, 1, 1, 13, 0, 0],
  ["tm-aurora", 2, 1, 2, 12, 0, 0],
  ["tm-kairo", 2, 1, 4, 8, 0, 0],
  ["tm-onyx", 2, 1, 3, 8, 0, 0],
  ["tm-nova", 2, 1, 5, 7, 0, 0],
  ["tm-lagos", 2, 1, 7, 5, 0, 0],
  ["tm-rift", 2, 1, 6, 4, 1, 0],
  ["tm-sable", 2, 1, 8, 3, 0, 0],
  ["tm-aurora", 2, 2, 1, 15, 0, 0],
  ["tm-vector", 2, 2, 2, 12, 0, 0],
  ["tm-onyx", 2, 2, 4, 9, 0, 0],
  ["tm-kairo", 2, 2, 3, 8, 0, 0],
  ["tm-lagos", 2, 2, 5, 6, 0, 0],
  ["tm-nova", 2, 2, 6, 6, 0, 0],
  ["tm-rift", 2, 2, 8, 4, 0, 0],
  ["tm-sable", 2, 2, 7, 3, 0, 0],
  ["tm-kairo", 3, 1, 1, 17, 0, 0],
  ["tm-aurora", 3, 1, 3, 10, 0, 0],
  ["tm-onyx", 3, 1, 2, 11, 0, 0],
  ["tm-vector", 3, 1, 4, 8, 0, 0],
  ["tm-nova", 3, 1, 5, 7, 0, 0],
  ["tm-lagos", 3, 1, 6, 6, 0, 0],
  ["tm-rift", 3, 1, 8, 4, 0, 0],
  ["tm-sable", 3, 1, 7, 3, 0, 0],
].map(([teamId, dayNumber, lobbyNumber, placement, kills, bonusAdd, bonusMinus], index) => ({
  id: `match-${index + 1}`,
  tournamentId: tournament.id,
  teamId: String(teamId),
  dayNumber: Number(dayNumber),
  lobbyNumber: Number(lobbyNumber),
  placement: Number(placement),
  kills: Number(kills),
  bonusAdd: Number(bonusAdd),
  bonusMinus: Number(bonusMinus),
}));

export const players: Player[] = teams.flatMap((team) =>
  Array.from({ length: 4 }, (_, index) => ({
    id: `${team.id}-p${index + 1}`,
    tournamentId: tournament.id,
    teamId: team.id,
    professionalName: `${team.clanName}.${["Ace", "Reign", "Pulse", "Vex"][index]}`,
    inGameName: `${team.clanName}_${index + 1}`,
    gender: "Not specified",
    region: "Africa",
    country: index % 2 === 0 ? "Nigeria" : "Ghana",
    device: "Mobile",
    deviceModel: index % 2 === 0 ? "iPhone 15 Pro" : "RedMagic 9",
    slotNumber: team.slotNumber * 10 + index,
  })),
);

export const playerMatchStats: PlayerMatchStat[] = players.flatMap((player, playerIndex) =>
  Array.from({ length: 5 }, (_, index) => ({
    id: `${player.id}-stat-${index + 1}`,
    tournamentId: tournament.id,
    playerId: player.id,
    dayNumber: index < 2 ? 1 : index < 4 ? 2 : 3,
    lobbyNumber: (index % 2) + 1,
    kills: Math.max(0, ((playerIndex + index * 2) % 7) - 1),
    damage: 420 + ((playerIndex * 137 + index * 211) % 1120),
    accuracy: 16 + ((playerIndex * 3 + index * 5) % 22),
  })),
);
