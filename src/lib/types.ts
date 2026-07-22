export type WorkspaceRole = "owner" | "analyst" | "observer";
export type WorkspaceType = "personal" | "team";
export type GameMode = "solo" | "duo" | "squad";
export type TournamentFormat = "player" | "team" | "both";

export type Workspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerUserId: string;
  currentUserRole: WorkspaceRole;
};

export type Tournament = {
  id: string;
  workspaceId: string;
  name: string;
  gameMode: GameMode;
  format: TournamentFormat;
  numDays: number;
  lobbiesPerDay: number;
  createdBy: string;
  createdAt: string;
};

export type ScoringConfig = {
  id: string;
  tournamentId: string;
  pointsPerKill: number;
  placementPoints: Record<number, number>;
};

export type Team = {
  id: string;
  tournamentId: string;
  teamName: string;
  clanName: string;
  tier: string;
  slotNumber: number;
};

export type Player = {
  id: string;
  tournamentId: string;
  teamId: string | null;
  professionalName: string;
  inGameName: string;
  gender: string;
  region: string;
  country: string;
  device: string;
  deviceModel: string;
  slotNumber: number;
};

export type MatchResult = {
  id: string;
  tournamentId: string;
  teamId: string;
  dayNumber: number;
  lobbyNumber: number;
  placement: number | null;
  kills: number;
  bonusAdd: number;
  bonusMinus: number;
};

export type PlayerMatchStat = {
  id: string;
  tournamentId: string;
  playerId: string;
  dayNumber: number;
  lobbyNumber: number;
  kills: number;
  damage: number;
  accuracy: number;
};

export type TeamStanding = {
  rank: number;
  previousRank: number | null;
  team: Team;
  matchesPlayed: number;
  wins: number;
  placementPoints: number;
  killPoints: number;
  bonus: number;
  totalKills: number;
  totalPoints: number;
  avgPlacement: number | null;
  dayBreakdown: TeamDayStanding[];
};

export type TeamDayStanding = {
  dayNumber: number;
  matchesPlayed: number;
  wins: number;
  placementPoints: number;
  killPoints: number;
  bonus: number;
  totalKills: number;
  totalPoints: number;
  avgPlacement: number | null;
};

export type PlayerStanding = {
  rank: number;
  player: Player;
  team: Team | null;
  totalKills: number;
  avgDamage: number;
  avgAccuracy: number;
  matchesPlayed: number;
  killsPerMatch: number;
  killsPerEvent: number;
};

export type GlobalPlayer = {
  id: string;
  professionalName: string;
  professionalNameLower: string;
  ign: string;
  ignLower: string;
  gender?: string;
  region?: string;
  country?: string;
  device?: string;
  deviceModel?: string;
  category?: string;
  tournamentIds: string[];
  createdAt: string;
};

export type GlobalTeam = {
  id: string;
  teamName: string;
  teamNameLower: string;
  clanName?: string;
  clanNameLower?: string;
  tournamentIds: string[];
  createdAt: string;
};

