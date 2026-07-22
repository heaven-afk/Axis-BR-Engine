"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  ClipboardList,
  Gauge,
  Layers3,
  LockKeyhole,
  Settings2,
  Shield,
  Trophy,
  Users,
  Plus,
  Trash2,
  X,
  Sparkles,
  ArrowLeft,
  Home,
  ChevronDown,
  ChevronUp,
  Save,
  Lock,
  Unlock,
  Upload,
} from "lucide-react";
import type {
  PlayerStanding,
  ScoringConfig,
  TeamStanding,
  Tournament,
  Workspace,
  WorkspaceRole,
  Team,
  Player,
  MatchResult,
  PlayerMatchStat,
  GlobalPlayer,
  GlobalTeam,
} from "@/lib/types";
import { buildTeamStandings, buildPlayerStandings, defaultPlacementPoints } from "@/lib/scoring";
import {
  cleanString,
  getSimilarityScore,
  getSimilarPlayers,
  getSimilarTeams,
  parseDelimiterText,
  detectHeaders,
  scorePlayerMatch,
} from "@/lib/entry-logic";

const navItems = [
  { label: "Overview", icon: Home },
  { label: "Register", icon: Layers3 },
  { label: "Player Entry", icon: Users },
  { label: "Team Entry", icon: ClipboardList },
  { label: "Standings", icon: Trophy },
  { label: "Scoring", icon: Settings2 },
  { label: "Import", icon: Sparkles },
];

interface ParsedTeamItem {
  tempId: string;
  teamName: string;
  clanName: string;
  tier: string;
  slotNumber: number;
  similar: { team: GlobalTeam; score: number }[];
  choice: "new" | "link";
  selectedGlobalId?: string;
}

interface ParsedPlayerItem {
  tempId: string;
  professionalName: string;
  inGameName: string;
  teamId: string | null;
  teamName: string;
  slotNumber: number;
  gender: string;
  region: string;
  country: string;
  device: string;
  deviceModel: string;
  similar: { player: GlobalPlayer; score: number }[];
  choice: "new" | "link";
  selectedGlobalId?: string;
}

interface ParsedResultItem {
  tempId: string;
  teamNameVal: string;
  teamId: string | null;
  dayNumber: number;
  lobbyNumber: number;
  placement: number;
  kills: number;
  bonusAdd: number;
  bonusMinus: number;
  confidence: "high" | "medium" | "low";
  score: number;
}

interface ParsedStatItem {
  tempId: string;
  nameVal: string;
  ignVal: string;
  teamNameVal: string;
  playerId: string | null;
  dayNumber: number;
  lobbyNumber: number;
  kills: number;
  damage: number;
  accuracy: number;
  confidence: "high" | "medium" | "low";
  score: number;
}

type ParsedImportItem = ParsedTeamItem | ParsedPlayerItem | ParsedResultItem | ParsedStatItem;
type ConflictItem = ParsedTeamItem | ParsedPlayerItem;

export function AppShell({
  workspaces,
  tournaments,
  activeWorkspace,
  activeTournament,
  scoringConfig,
  initialTeams,
  initialPlayers,
  initialMatchResults,
  initialPlayerMatchStats,
  workspaceId,
}: {
  workspaces: Workspace[];
  tournaments: Tournament[];
  activeWorkspace: Workspace;
  activeTournament: Tournament;
  scoringConfig: ScoringConfig;
  initialTeams: Team[];
  initialPlayers: Player[];
  initialMatchResults: MatchResult[];
  initialPlayerMatchStats: PlayerMatchStat[];
  workspaceId?: string;
}) {
  const canEdit = activeWorkspace.currentUserRole !== "observer";

  // State Management
  const [activeTab, setActiveTab] = useState<string>("team entry");
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [matchResults, setMatchResults] = useState<MatchResult[]>(initialMatchResults);
  const [playerMatchStats, setPlayerMatchStats] = useState<PlayerMatchStat[]>(initialPlayerMatchStats);
  const [localScoringConfig, setLocalScoringConfig] = useState<ScoringConfig>(scoringConfig);

  // Global Registries state
  const [globalPlayers, setGlobalPlayers] = useState<GlobalPlayer[]>(() => {
    return initialPlayers.map((p) => ({
      id: `gp-${p.id}`,
      professionalName: p.professionalName,
      professionalNameLower: p.professionalName.toLowerCase(),
      ign: p.inGameName,
      ignLower: p.inGameName.toLowerCase(),
      gender: p.gender,
      region: p.region,
      country: p.country,
      device: p.device,
      deviceModel: p.deviceModel,
      tournamentIds: [p.tournamentId],
      createdAt: new Date().toISOString(),
    }));
  });

  const [globalTeams, setGlobalTeams] = useState<GlobalTeam[]>(() => {
    return initialTeams.map((t) => ({
      id: `gt-${t.id}`,
      teamName: t.teamName,
      teamNameLower: t.teamName.toLowerCase(),
      clanName: t.clanName,
      clanNameLower: (t.clanName || "").toLowerCase(),
      tournamentIds: [t.tournamentId],
      createdAt: new Date().toISOString(),
    }));
  });

  // Roster view state inside Register tab
  const [rosterView, setRosterView] = useState<"teams" | "players">("teams");

  // Dynamic Standings Recalculations
  const teamStandings = useMemo(() => {
    return buildTeamStandings({
      teams,
      matchResults,
      scoringConfig: localScoringConfig,
      numDays: activeTournament.numDays,
    });
  }, [teams, matchResults, localScoringConfig, activeTournament.numDays]);

  const playerStandings = useMemo(() => {
    return buildPlayerStandings({
      players,
      teams,
      playerMatchStats,
    });
  }, [players, teams, playerMatchStats]);

  const leaders = teamStandings.slice(0, 3);

  // Manual Add Form states
  const [newTeam, setNewTeam] = useState({ teamName: "", clanName: "", tier: "Pro", slotNumber: "" });
  const [newPlayer, setNewPlayer] = useState({
    professionalName: "",
    inGameName: "",
    teamId: "",
    slotNumber: "",
    gender: "Not specified",
    region: "Africa",
    country: "Nigeria",
    device: "Mobile",
    deviceModel: "iPhone 15 Pro",
  });

  // Importer states
  const [importType, setImportType] = useState<"teams" | "players" | "results" | "stats">("players");
  const [pasteText, setPasteText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<ParsedImportItem[] | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<Record<string, number> | null>(null);
  const [importConflictItems, setImportConflictItems] = useState<ConflictItem[]>([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // Cell Update Handler for Team Placements (Team Entry Grid)
  const handleUpdateMatchResultField = (
    teamId: string,
    dayNumber: number,
    lobbyNumber: number,
    field: "placement" | "kills" | "bonusAdd" | "bonusMinus",
    val: number | null
  ) => {
    setMatchResults((prev) => {
      const idx = prev.findIndex(
        (m) => m.teamId === teamId && m.dayNumber === dayNumber && m.lobbyNumber === lobbyNumber
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: val ?? 0 };
        return updated;
      } else {
        const newRecord: MatchResult = {
          id: `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tournamentId: activeTournament.id,
          teamId,
          dayNumber,
          lobbyNumber,
          placement: field === "placement" ? val : null,
          kills: field === "kills" ? (val ?? 0) : 0,
          bonusAdd: field === "bonusAdd" ? (val ?? 0) : 0,
          bonusMinus: field === "bonusMinus" ? (val ?? 0) : 0,
        };
        return [...prev, newRecord];
      }
    });
  };

  // Cell Update Handler for Player Match Stats (Player Entry Grid)
  const handleUpdatePlayerStatField = (
    playerId: string,
    dayNumber: number,
    lobbyNumber: number,
    field: "kills" | "damage" | "accuracy",
    val: number
  ) => {
    setPlayerMatchStats((prev) => {
      const idx = prev.findIndex(
        (s) => s.playerId === playerId && s.dayNumber === dayNumber && s.lobbyNumber === lobbyNumber
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: val };
        return updated;
      } else {
        const newRecord: PlayerMatchStat = {
          id: `stat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tournamentId: activeTournament.id,
          playerId,
          dayNumber,
          lobbyNumber,
          kills: field === "kills" ? val : 0,
          damage: field === "damage" ? val : 0,
          accuracy: field === "accuracy" ? val : 0,
        };
        return [...prev, newRecord];
      }
    });
  };

  // Inline Cell update handlers for Teams / Players registries
  const handleUpdateTeam = (teamId: string, field: keyof Team, value: string | number) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, [field]: value } : t))
    );
  };

  const handleUpdatePlayer = (playerId: string, field: keyof Player, value: string | number | null) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, [field]: value } : p))
    );
  };

  // Manual submission handlers
  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.teamName || !newTeam.slotNumber) return;

    const teamId = `tm-${Date.now()}`;
    const added: Team = {
      id: teamId,
      tournamentId: activeTournament.id,
      teamName: newTeam.teamName,
      clanName: newTeam.clanName,
      tier: newTeam.tier,
      slotNumber: Number(newTeam.slotNumber),
    };

    setTeams((prev) => [...prev, added]);

    const globalAdded: GlobalTeam = {
      id: `gt-${teamId}`,
      teamName: newTeam.teamName,
      teamNameLower: newTeam.teamName.toLowerCase(),
      clanName: newTeam.clanName,
      clanNameLower: newTeam.clanName.toLowerCase(),
      tournamentIds: [activeTournament.id],
      createdAt: new Date().toISOString(),
    };
    setGlobalTeams((prev) => [...prev, globalAdded]);

    setNewTeam({ teamName: "", clanName: "", tier: "Pro", slotNumber: "" });
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.professionalName || !newPlayer.inGameName || !newPlayer.slotNumber) return;

    const playerId = `pl-${Date.now()}`;
    const added: Player = {
      id: playerId,
      tournamentId: activeTournament.id,
      teamId: newPlayer.teamId || null,
      professionalName: newPlayer.professionalName,
      inGameName: newPlayer.inGameName,
      gender: newPlayer.gender,
      region: newPlayer.region,
      country: newPlayer.country,
      device: newPlayer.device,
      deviceModel: newPlayer.deviceModel,
      slotNumber: Number(newPlayer.slotNumber),
    };

    setPlayers((prev) => [...prev, added]);

    const globalAdded: GlobalPlayer = {
      id: `gp-${playerId}`,
      professionalName: newPlayer.professionalName,
      professionalNameLower: newPlayer.professionalName.toLowerCase(),
      ign: newPlayer.inGameName,
      ignLower: newPlayer.inGameName.toLowerCase(),
      gender: newPlayer.gender,
      region: newPlayer.region,
      country: newPlayer.country,
      device: newPlayer.device,
      deviceModel: newPlayer.deviceModel,
      tournamentIds: [activeTournament.id],
      createdAt: new Date().toISOString(),
    };
    setGlobalPlayers((prev) => [...prev, globalAdded]);

    setNewPlayer({
      professionalName: "",
      inGameName: "",
      teamId: teams[0]?.id || "",
      slotNumber: "",
      gender: "Not specified",
      region: "Africa",
      country: "Nigeria",
      device: "Mobile",
      deviceModel: "iPhone 15 Pro",
    });
  };

  // Parser import flow
  const handleParseImport = () => {
    if (!pasteText.trim()) return;

    const rows = parseDelimiterText(pasteText);
    if (rows.length === 0) return;

    const headers = detectHeaders(rows);
    setParsedHeaders(headers);

    const startIdx = headers ? 1 : 0;
    const recordsToProcess = rows.slice(startIdx);

    const previewList: ParsedImportItem[] = [];
    const conflicts: ConflictItem[] = [];

    if (importType === "teams") {
      recordsToProcess.forEach((row, index) => {
        const teamName = row[headers?.teamName ?? 0] || `Parsed Team ${index + 1}`;
        const clanName = row[headers?.clanName ?? 1] || "";
        const tier = row[headers?.tier ?? 2] || "Pro";
        const slotNumber = Number(row[headers?.slotNumber ?? 3]) || (teams.length + index + 1);

        const similar = getSimilarTeams(teamName, globalTeams, 0.75);

        const tempItem: ParsedTeamItem = {
          tempId: `tmp-team-${index}`,
          teamName,
          clanName,
          tier,
          slotNumber,
          similar,
          choice: similar.length > 0 ? "link" : "new",
          selectedGlobalId: similar[0]?.team.id || undefined,
        };

        previewList.push(tempItem);
        if (similar.length > 0) conflicts.push(tempItem);
      });
    } else if (importType === "players") {
      recordsToProcess.forEach((row, index) => {
        const professionalName = row[headers?.professionalName ?? 0] || `Parsed Player ${index + 1}`;
        const inGameName = row[headers?.ign ?? 1] || `IGN_${index + 1}`;
        const teamNameVal = row[headers?.teamName ?? 2] || "";
        const slotNumber = Number(row[headers?.slotNumber ?? 3]) || (players.length + index + 1);

        const matchedTeam = teams.find(
          (t) =>
            cleanString(t.teamName) === cleanString(teamNameVal) ||
            cleanString(t.clanName || "") === cleanString(teamNameVal)
        );

        const similar = getSimilarPlayers(professionalName, inGameName, globalPlayers, 0.75);

        const tempItem: ParsedPlayerItem = {
          tempId: `tmp-pl-${index}`,
          professionalName,
          inGameName,
          teamId: matchedTeam?.id || null,
          teamName: teamNameVal,
          slotNumber,
          gender: "Not specified",
          region: "Africa",
          country: "Nigeria",
          device: "Mobile",
          deviceModel: "iPhone 15 Pro",
          similar,
          choice: similar.length > 0 ? "link" : "new",
          selectedGlobalId: similar[0]?.player.id || undefined,
        };

        previewList.push(tempItem);
        if (similar.length > 0) conflicts.push(tempItem);
      });
    } else if (importType === "results") {
      recordsToProcess.forEach((row, index) => {
        const teamNameVal = row[headers?.teamName ?? 0] || "";
        const dayNumber = Number(row[headers?.dayNumber ?? 1]) || 1;
        const lobbyNumber = Number(row[headers?.lobbyNumber ?? 2]) || 1;
        const placement = Number(row[headers?.placement ?? 3]) || 1;
        const kills = Number(row[headers?.kills ?? 4]) || 0;
        const bonusAdd = Number(row[headers?.bonusAdd ?? 5]) || 0;
        const bonusMinus = Number(row[headers?.bonusMinus ?? 6]) || 0;

        let bestTeamId: string | null = null;
        let bestScore = 0;
        teams.forEach((t) => {
          const score = getSimilarityScore(teamNameVal, t.teamName);
          if (score > bestScore) {
            bestScore = score;
            bestTeamId = t.id;
          }
        });

        let confidence: "high" | "medium" | "low" = "low";
        if (bestScore >= 0.85) confidence = "high";
        else if (bestScore >= 0.7) confidence = "medium";

        previewList.push({
          tempId: `tmp-res-${index}`,
          teamNameVal,
          teamId: bestTeamId,
          dayNumber,
          lobbyNumber,
          placement,
          kills,
          bonusAdd,
          bonusMinus,
          confidence,
          score: bestScore,
        });
      });
    } else if (importType === "stats") {
      recordsToProcess.forEach((row, index) => {
        const nameVal = row[headers?.professionalName ?? 0] || "";
        const ignVal = row[headers?.ign ?? 1] || "";
        const teamNameVal = row[headers?.teamName ?? 2] || "";
        const dayNumber = Number(row[headers?.dayNumber ?? 3]) || 1;
        const lobbyNumber = Number(row[headers?.lobbyNumber ?? 4]) || 1;
        const kills = Number(row[headers?.kills ?? 5]) || 0;
        const damage = Number(row[headers?.damage ?? 6]) || 0;
        const accuracy = Number(row[headers?.accuracy ?? 7]) || 0;

        const match = scorePlayerMatch(nameVal, ignVal, teamNameVal, players, teams);

        previewList.push({
          tempId: `tmp-stat-${index}`,
          nameVal,
          ignVal,
          teamNameVal,
          playerId: match.matchedPlayerId,
          dayNumber,
          lobbyNumber,
          kills,
          damage,
          accuracy,
          confidence: match.confidence,
          score: match.score,
        });
      });
    }

    setParsedPreview(previewList);
    setImportConflictItems(conflicts);

    if (conflicts.length > 0) {
      setIsConflictModalOpen(true);
    }
  };

  const handleCommitImport = () => {
    if (!parsedPreview) return;

    if (importType === "teams") {
      const addedTeams: Team[] = [];
      const newGlobalTeams: GlobalTeam[] = [];

      (parsedPreview as ParsedTeamItem[]).forEach((item) => {
        let finalTeamId = "";

        if (item.choice === "link" && item.selectedGlobalId) {
          finalTeamId = item.selectedGlobalId.replace("gt-", "");
          setGlobalTeams((prev) =>
            prev.map((gt) =>
              gt.id === item.selectedGlobalId
                ? { ...gt, tournamentIds: Array.from(new Set([...gt.tournamentIds, activeTournament.id])) }
                : gt
            )
          );
        } else {
          finalTeamId = `tm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          newGlobalTeams.push({
            id: `gt-${finalTeamId}`,
            teamName: item.teamName,
            teamNameLower: item.teamName.toLowerCase(),
            clanName: item.clanName,
            clanNameLower: item.clanName.toLowerCase(),
            tournamentIds: [activeTournament.id],
            createdAt: new Date().toISOString(),
          });
        }

        addedTeams.push({
          id: finalTeamId,
          tournamentId: activeTournament.id,
          teamName: item.teamName,
          clanName: item.clanName,
          tier: item.tier,
          slotNumber: item.slotNumber,
        });
      });

      setTeams((prev) => [...prev, ...addedTeams]);
      setGlobalTeams((prev) => [...prev, ...newGlobalTeams]);
    } else if (importType === "players") {
      const addedPlayers: Player[] = [];
      const newGlobalPlayers: GlobalPlayer[] = [];

      (parsedPreview as ParsedPlayerItem[]).forEach((item) => {
        let finalPlayerId = "";

        if (item.choice === "link" && item.selectedGlobalId) {
          finalPlayerId = item.selectedGlobalId.replace("gp-", "");
          setGlobalPlayers((prev) =>
            prev.map((gp) =>
              gp.id === item.selectedGlobalId
                ? { ...gp, tournamentIds: Array.from(new Set([...gp.tournamentIds, activeTournament.id])) }
                : gp
            )
          );
        } else {
          finalPlayerId = `pl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          newGlobalPlayers.push({
            id: `gp-${finalPlayerId}`,
            professionalName: item.professionalName,
            professionalNameLower: item.professionalName.toLowerCase(),
            ign: item.inGameName,
            ignLower: item.inGameName.toLowerCase(),
            gender: item.gender,
            region: item.region,
            country: item.country,
            device: item.device,
            deviceModel: item.deviceModel,
            tournamentIds: [activeTournament.id],
            createdAt: new Date().toISOString(),
          });
        }

        addedPlayers.push({
          id: finalPlayerId,
          tournamentId: activeTournament.id,
          teamId: item.teamId,
          professionalName: item.professionalName,
          inGameName: item.inGameName,
          gender: item.gender,
          region: item.region,
          country: item.country,
          device: item.device,
          deviceModel: item.deviceModel,
          slotNumber: item.slotNumber,
        });
      });

      setPlayers((prev) => [...prev, ...addedPlayers]);
      setGlobalPlayers((prev) => [...prev, ...newGlobalPlayers]);
    } else if (importType === "results") {
      const addedResults: MatchResult[] = (parsedPreview as ParsedResultItem[])
        .filter((item) => item.teamId)
        .map((item) => ({
          id: `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tournamentId: activeTournament.id,
          teamId: item.teamId!,
          dayNumber: item.dayNumber,
          lobbyNumber: item.lobbyNumber,
          placement: item.placement,
          kills: item.kills,
          bonusAdd: item.bonusAdd,
          bonusMinus: item.bonusMinus,
        }));

      setMatchResults((prev) => [...prev, ...addedResults]);
    } else if (importType === "stats") {
      const addedStats: PlayerMatchStat[] = (parsedPreview as ParsedStatItem[])
        .filter((item) => item.playerId)
        .map((item) => ({
          id: `stat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tournamentId: activeTournament.id,
          playerId: item.playerId!,
          dayNumber: item.dayNumber,
          lobbyNumber: item.lobbyNumber,
          kills: item.kills,
          damage: item.damage,
          accuracy: item.accuracy,
        }));

      setPlayerMatchStats((prev) => [...prev, ...addedStats]);
    }

    setPasteText("");
    setParsedPreview(null);
    setParsedHeaders(null);

    // Switch to corresponding tab after import
    if (importType === "teams") {
      setActiveTab("team entry");
    } else if (importType === "players") {
      setActiveTab("player entry");
    } else if (importType === "results") {
      setActiveTab("team entry");
    } else if (importType === "stats") {
      setActiveTab("player entry");
    }
  };

  return (
    <main className="min-h-screen pb-24 lg:pb-0 text-foreground bg-[#0a0d12]">
      <div className="mx-auto flex w-full max-w-[1750px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Command Center Header (Replaces Left Sidebar) */}
        <header className="rounded-xl border border-slate-700/70 bg-[#0e131c]/95 p-4 shadow-2xl backdrop-blur-xl space-y-4">
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/30 pb-3">
            <div className="flex flex-wrap items-center gap-4">
              {/* Back to Workspace Link */}
              {workspaceId ? (
                <a
                  href={`/dashboard/workspace/${workspaceId}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-foreground transition bg-white/5 px-3 py-1.5 rounded-lg border border-line/50"
                >
                  <ArrowLeft size={13} /> Back to workspace
                </a>
              ) : (
                <a
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-foreground transition bg-white/5 px-3 py-1.5 rounded-lg border border-line/50"
                >
                  <Home size={13} /> Dashboard
                </a>
              )}

              {/* Axis Engine Brand Badge */}
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent border border-accent/30 shadow-sm">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-foreground leading-none">Axis Engine</p>
                  <p className="text-[10px] text-muted font-mono mt-0.5">Results Command Center</p>
                </div>
              </div>

              {/* Workspace & Tournament Pills */}
              <div className="hidden sm:flex items-center gap-2 border-l border-line/40 pl-4">
                <span className="text-xs font-mono font-bold text-muted bg-black/40 px-2.5 py-1 rounded-md border border-line/50">
                  Workspace: <span className="text-foreground">{activeWorkspace.name}</span>
                </span>
                <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-md border border-accent/30">
                  Tournament: <span className="text-accent">{activeTournament.name}</span>
                </span>
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-bold capitalize ${
                canEdit ? "bg-accent/15 text-accent border-accent/30" : "bg-white/5 text-muted border-line/50"
              }`}>
                <Shield size={13} />
                Role: {activeWorkspace.currentUserRole}
              </span>
            </div>
          </div>

          {/* Main Top Navigation Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
              {[
                { label: "Overview", icon: Home },
                { label: "Register", icon: Layers3 },
                { label: "Player Entry", icon: Users },
                { label: "Team Entry", icon: ClipboardList },
                { label: "Standings", icon: Trophy },
                { label: "Scoring", icon: Settings2 },
                { label: "Import", icon: Sparkles },
              ].map((item) => {
                const itemTab = item.label.toLowerCase();
                const isActive = activeTab === itemTab;
                return (
                  <button
                    key={item.label}
                    onClick={() => setActiveTab(itemTab)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
                      isActive
                        ? "bg-[#3cbeba] text-black shadow-[0_0_16px_rgba(60,190,170,0.4)]"
                        : "text-muted hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Content Section (Full-Width Span) */}
        <section className="min-w-0 flex-1">

          {/* Render Active Tab Views */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-lg border border-line/70 bg-[#0e131b]/90 p-5 shadow-glow backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    Tournament Command Center
                  </p>
                  <h1 className="mt-2 text-3xl font-extrabold text-foreground">
                    {activeTournament.name}
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    Multi-user tournament engine powered by Axis Stat Engine.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {leaders.map((standing) => (
                      <LeaderCard key={standing.team.id} standing={standing} />
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-line/70 bg-[#0e131b]/90 p-5 shadow-glow backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        Event Details
                      </p>
                      <h2 className="mt-1 text-lg font-bold">Tournament Format</h2>
                    </div>
                    <Gauge className="text-accent" size={22} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Metric label="Days" value={activeTournament.numDays} />
                    <Metric label="Lobbies/day" value={activeTournament.lobbiesPerDay} />
                    <Metric label="Mode" value={activeTournament.gameMode.toUpperCase()} />
                    <Metric label="Format" value={activeTournament.format.toUpperCase()} />
                  </dl>
                </div>
              </div>

              <StandingsTable standings={teamStandings} />
            </div>
          )}

          {activeTab === "register" && (
            <div className="space-y-6 rounded-lg border border-line/70 bg-[#0e131b]/90 p-5 shadow-glow backdrop-blur-xl">
              <div className="flex gap-4 border-b border-line/30 pb-3">
                <button
                  onClick={() => setRosterView("teams")}
                  className={`text-sm font-bold transition ${
                    rosterView === "teams" ? "text-accent border-b-2 border-accent pb-1" : "text-muted hover:text-foreground"
                  }`}
                >
                  Registered Teams ({teams.length})
                </button>
                <button
                  onClick={() => setRosterView("players")}
                  className={`text-sm font-bold transition ${
                    rosterView === "players" ? "text-accent border-b-2 border-accent pb-1" : "text-muted hover:text-foreground"
                  }`}
                >
                  Registered Players ({players.length})
                </button>
              </div>

              {rosterView === "teams" ? (
                <div className="space-y-6">
                  <div className="overflow-x-auto rounded-md border border-line/60 bg-black/25">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-[#12161c] text-xs font-semibold uppercase text-muted">
                        <tr>
                          <th className="px-4 py-2.5 border-b border-line/50 w-24">Slot</th>
                          <th className="px-4 py-2.5 border-b border-line/50">Team Name</th>
                          <th className="px-4 py-2.5 border-b border-line/50">Clan Tag</th>
                          <th className="px-4 py-2.5 border-b border-line/50 w-32">Tier</th>
                          {canEdit && <th className="px-4 py-2.5 border-b border-line/50 w-20 text-center">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map((t) => (
                          <tr key={t.id} className="border-b border-line/40 last:border-0 hover:bg-white/5">
                            <td className="px-4 py-2 font-mono">
                              {canEdit ? (
                                <EditableCell
                                  value={t.slotNumber}
                                  type="number"
                                  onChange={(val) => handleUpdateTeam(t.id, "slotNumber", Number(val))}
                                />
                              ) : (
                                t.slotNumber
                              )}
                            </td>
                            <td className="px-4 py-2 font-bold text-foreground">
                              {canEdit ? (
                                <EditableCell
                                  value={t.teamName}
                                  onChange={(val) => handleUpdateTeam(t.id, "teamName", val)}
                                />
                              ) : (
                                t.teamName
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {canEdit ? (
                                <EditableCell
                                  value={t.clanName}
                                  onChange={(val) => handleUpdateTeam(t.id, "clanName", val)}
                                />
                              ) : (
                                t.clanName
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {canEdit ? (
                                <select
                                  value={t.tier}
                                  onChange={(e) => handleUpdateTeam(t.id, "tier", e.target.value)}
                                  className="rounded border border-line bg-black/60 px-2 py-1 text-xs text-foreground outline-none"
                                >
                                  <option value="Pro">Pro</option>
                                  <option value="Elite">Elite</option>
                                  <option value="Contender">Contender</option>
                                  <option value="Open">Open</option>
                                </select>
                              ) : (
                                t.tier
                              )}
                            </td>
                            {canEdit && (
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => setTeams((prev) => prev.filter((item) => item.id !== t.id))}
                                  className="text-danger hover:text-red-400 transition"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {canEdit && (
                    <form onSubmit={handleAddTeam} className="grid gap-3 sm:grid-cols-4 p-4 rounded-md border border-line bg-black/20">
                      <div>
                        <span className="text-xs text-muted block mb-1">Team Name</span>
                        <input
                          required
                          value={newTeam.teamName}
                          onChange={(e) => setNewTeam((prev) => ({ ...prev, teamName: e.target.value }))}
                          placeholder="e.g. 12AM ESPORTS"
                          className="w-full h-9 rounded bg-black/45 border border-line/60 px-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-muted block mb-1">Clan Tag</span>
                        <input
                          value={newTeam.clanName}
                          onChange={(e) => setNewTeam((prev) => ({ ...prev, clanName: e.target.value }))}
                          placeholder="e.g. 12AM"
                          className="w-full h-9 rounded bg-black/45 border border-line/60 px-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-muted block mb-1">Tier</span>
                        <select
                          value={newTeam.tier}
                          onChange={(e) => setNewTeam((prev) => ({ ...prev, tier: e.target.value }))}
                          className="w-full h-9 rounded bg-black/45 border border-line/60 px-2.5 text-sm"
                        >
                          <option value="Pro">Pro</option>
                          <option value="Elite">Elite</option>
                          <option value="Contender">Contender</option>
                          <option value="Open">Open</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-xs text-muted block mb-1">Slot #</span>
                        <div className="flex gap-2">
                          <input
                            required
                            type="number"
                            value={newTeam.slotNumber}
                            onChange={(e) => setNewTeam((prev) => ({ ...prev, slotNumber: e.target.value }))}
                            placeholder="e.g. 9"
                            className="w-full h-9 rounded bg-black/45 border border-line/60 px-2.5 text-sm"
                          />
                          <button type="submit" className="h-9 px-4 rounded bg-accent text-black font-bold text-sm flex items-center gap-1 shrink-0 hover:bg-accent/90 transition">
                            <Plus size={16} /> Add Team
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="overflow-x-auto rounded-md border border-line/60 bg-black/25">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-[#12161c] text-xs font-semibold uppercase text-muted">
                        <tr>
                          <th className="px-4 py-2.5 border-b border-line/50 w-24">Slot</th>
                          <th className="px-4 py-2.5 border-b border-line/50">Pro Name</th>
                          <th className="px-4 py-2.5 border-b border-line/50">IGN</th>
                          <th className="px-4 py-2.5 border-b border-line/50">Assigned Team</th>
                          {canEdit && <th className="px-4 py-2.5 border-b border-line/50 w-20 text-center">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((p) => {
                          const pTeam = teams.find((t) => t.id === p.teamId);
                          return (
                            <tr key={p.id} className="border-b border-line/40 last:border-0 hover:bg-white/5">
                              <td className="px-4 py-2 font-mono">
                                {canEdit ? (
                                  <EditableCell
                                    value={p.slotNumber}
                                    type="number"
                                    onChange={(val) => handleUpdatePlayer(p.id, "slotNumber", Number(val))}
                                  />
                                ) : (
                                  p.slotNumber
                                )}
                              </td>
                              <td className="px-4 py-2 font-bold">
                                {canEdit ? (
                                  <EditableCell
                                    value={p.professionalName}
                                    onChange={(val) => handleUpdatePlayer(p.id, "professionalName", val)}
                                  />
                                ) : (
                                  p.professionalName
                                )}
                              </td>
                              <td className="px-4 py-2 font-mono text-muted">
                                {canEdit ? (
                                  <EditableCell
                                    value={p.inGameName}
                                    onChange={(val) => handleUpdatePlayer(p.id, "inGameName", val)}
                                  />
                                ) : (
                                  p.inGameName
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {canEdit ? (
                                  <select
                                    value={p.teamId || ""}
                                    onChange={(e) => handleUpdatePlayer(p.id, "teamId", e.target.value || null)}
                                    className="rounded border border-line bg-black/60 px-2 py-1 text-xs text-foreground outline-none"
                                  >
                                    <option value="">-- Free Agent --</option>
                                    {teams.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.teamName}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  pTeam?.teamName ?? "Free Agent"
                                )}
                              </td>
                              {canEdit && (
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => setPlayers((prev) => prev.filter((item) => item.id !== p.id))}
                                    className="text-danger hover:text-red-400 transition"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {canEdit && (
                    <form onSubmit={handleAddPlayer} className="grid gap-3 sm:grid-cols-4 p-4 rounded-md border border-line bg-black/20">
                      <div>
                        <span className="text-xs text-muted block mb-1">Professional Name</span>
                        <input
                          required
                          value={newPlayer.professionalName}
                          onChange={(e) => setNewPlayer((prev) => ({ ...prev, professionalName: e.target.value }))}
                          placeholder="e.g. TONY"
                          className="w-full h-9 rounded bg-black/45 border border-line/60 px-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-muted block mb-1">In-Game Name</span>
                        <input
                          required
                          value={newPlayer.inGameName}
                          onChange={(e) => setNewPlayer((prev) => ({ ...prev, inGameName: e.target.value }))}
                          placeholder="e.g. 12 | TXNY"
                          className="w-full h-9 rounded bg-black/45 border border-line/60 px-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-muted block mb-1">Assigned Team</span>
                        <select
                          value={newPlayer.teamId}
                          onChange={(e) => setNewPlayer((prev) => ({ ...prev, teamId: e.target.value }))}
                          className="w-full h-9 rounded bg-black/45 border border-line/60 px-2.5 text-sm"
                        >
                          <option value="">-- Free Agent --</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.teamName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="text-xs text-muted block mb-1">Slot #</span>
                        <div className="flex gap-2">
                          <input
                            required
                            type="number"
                            value={newPlayer.slotNumber}
                            onChange={(e) => setNewPlayer((prev) => ({ ...prev, slotNumber: e.target.value }))}
                            placeholder="e.g. 9"
                            className="w-full h-9 rounded bg-black/45 border border-line/60 px-2.5 text-sm"
                          />
                          <button type="submit" className="h-9 px-4 rounded bg-accent text-black font-bold text-sm flex items-center gap-1 shrink-0 hover:bg-accent/90 transition">
                            <Plus size={16} /> Add Player
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TEAM ENTRY TAB (MATCHING SCREENSHOT 2) */}
          {activeTab === "team entry" && (
            <TeamEntryGrid
              teams={teams}
              matchResults={matchResults}
              scoringConfig={localScoringConfig}
              numDays={activeTournament.numDays}
              lobbiesPerDay={activeTournament.lobbiesPerDay}
              canEdit={canEdit}
              tournamentName={activeTournament.name}
              onUpdateMatchResult={handleUpdateMatchResultField}
            />
          )}

          {/* PLAYER ENTRY TAB (MATCHING SCREENSHOT 1 WITH COMBINED KILLS/DAMAGE/ACC) */}
          {activeTab === "player entry" && (
            <PlayerEntryGrid
              teams={teams}
              players={players}
              playerMatchStats={playerMatchStats}
              numDays={activeTournament.numDays}
              lobbiesPerDay={activeTournament.lobbiesPerDay}
              canEdit={canEdit}
              tournamentName={activeTournament.name}
              onUpdatePlayerStat={handleUpdatePlayerStatField}
              onSwitchToImport={() => setActiveTab("import")}
            />
          )}

          {activeTab === "standings" && (
            <div className="space-y-5">
              <StandingsTable standings={teamStandings} />
              <PlayerLeaderboard standings={playerStandings} />
            </div>
          )}

          {activeTab === "scoring" && (
            <ScoringPanel
              scoringConfig={localScoringConfig}
              canEdit={canEdit}
              setScoringConfig={setLocalScoringConfig}
            />
          )}

          {activeTab === "import" && (
            <ImportWizard
              importType={importType}
              setImportType={setImportType}
              pasteText={pasteText}
              setPasteText={setPasteText}
              parsedPreview={parsedPreview}
              parsedHeaders={parsedHeaders}
              handleParseImport={handleParseImport}
              handleCommitImport={handleCommitImport}
              canEdit={canEdit}
            />
          )}
        </section>
      </div>

      {/* Conflict Modal */}
      {isConflictModalOpen && (
        <ConflictModal
          conflictItems={importConflictItems}
          setConflictItems={setImportConflictItems}
          onClose={() => setIsConflictModalOpen(false)}
        />
      )}
    </main>
  );
}

{/* ── SUBCOMPONENT: TEAM ENTRY GRID (CELL-BASED SPREADSHEET MATRIX) ── */}
function TeamEntryGrid({
  teams,
  matchResults,
  scoringConfig,
  numDays,
  lobbiesPerDay,
  canEdit,
  tournamentName,
  onUpdateMatchResult,
}: {
  teams: Team[];
  matchResults: MatchResult[];
  scoringConfig: ScoringConfig;
  numDays: number;
  lobbiesPerDay: number;
  canEdit: boolean;
  tournamentName: string;
  onUpdateMatchResult: (
    teamId: string,
    dayNumber: number,
    lobbyNumber: number,
    field: "placement" | "kills" | "bonusAdd" | "bonusMinus",
    val: number | null
  ) => void;
}) {
  const [activeDay, setActiveDay] = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  const [showPointRef, setShowPointRef] = useState(false);

  const daysList = Array.from({ length: Math.max(numDays, 5) }, (_, i) => i + 1);
  const lobbiesList = Array.from({ length: Math.max(lobbiesPerDay, 3) }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Team Entry
          </h1>
          <p className="text-xs text-muted mt-1">
            Cell-based match data entry matrix · <span className="text-accent font-bold">{tournamentName}</span>
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition shadow-md ${
              isLocked
                ? "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
            }`}
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            {isLocked ? `Day ${activeDay} Locked` : `Lock Day ${activeDay}`}
          </button>
        )}
      </div>

      {/* Day Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-line/40 pb-3">
        <span className="text-xs font-bold text-muted uppercase tracking-wider mr-2">DAY:</span>
        {daysList.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`px-4.5 py-2 text-xs font-extrabold rounded-lg transition shadow-sm ${
              activeDay === d
                ? "bg-[#3cbeba] text-black shadow-[0_0_14px_rgba(60,190,170,0.4)]"
                : "bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
            }`}
          >
            Day {d}
          </button>
        ))}
      </div>

      {/* Point System Reference Accordion */}
      <div className="rounded-xl border border-line/60 bg-[#0e131b]/90 overflow-hidden shadow-md">
        <button
          onClick={() => setShowPointRef(!showPointRef)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-foreground hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent animate-pulse" />
            <span>Point System Reference Guide</span>
          </div>
          {showPointRef ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showPointRef && (
          <div className="px-5 pb-5 pt-2 border-t border-line/40 text-xs space-y-4 bg-black/20">
            <div className="flex items-center gap-3">
              <span className="font-bold text-accent">Points Per Kill:</span>
              <span className="font-mono bg-black/60 px-3 py-1 rounded-md border border-line/50 font-extrabold text-sm text-foreground">
                {scoringConfig.pointsPerKill} pts
              </span>
            </div>
            <div>
              <span className="font-bold text-muted block mb-2">Placement Points Matrix:</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(scoringConfig.placementPoints).map(([place, pts]) => (
                  <div key={place} className="rounded-md bg-black/60 border border-line/50 px-2.5 py-1 text-xs font-mono">
                    <span className="text-muted font-bold">#{place}:</span> <span className="font-extrabold text-accent">{pts}pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Uniform Rectangular/Square Cell Spreadsheet Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-[#070a0f] shadow-2xl">
        <table className="w-full text-left text-xs border-collapse min-w-[1150px]">
          {/* Double-tiered Table Header */}
          <thead className="select-none font-extrabold uppercase tracking-wider text-muted">
            {/* Top Grouping Header Row */}
            <tr>
              <th rowSpan={2} className="px-3 py-3 border-b-2 border-r-2 border-slate-700/80 w-14 text-center bg-[#111622]">SLOT</th>
              <th rowSpan={2} className="px-5 py-3 border-b-2 border-r-2 border-slate-700/80 min-w-[170px] bg-[#111622]">TEAM NAME</th>

              {lobbiesList.map((l) => (
                <th key={l} colSpan={2} className={`px-2 py-2 border-b border-r-2 border-slate-700/80 text-center font-black tracking-wider text-xs ${
                  l === 1 ? "bg-blue-900/60 text-blue-300" : l === 2 ? "bg-indigo-900/60 text-indigo-300" : "bg-teal-900/60 text-teal-300"
                }`}>
                  LOBBY {l}
                </th>
              ))}

              <th colSpan={2} className="px-2 py-2 border-b border-r-2 border-slate-700/80 text-center font-black tracking-wider text-xs bg-emerald-950/70 text-emerald-300">
                BONUS
              </th>

              <th colSpan={5} className="px-3 py-2 border-b border-slate-700/80 text-center font-black tracking-wider text-xs bg-[#881337] text-white">
                SUMMARY TOTALS
              </th>
            </tr>

            {/* Sub-Header Column Titles Row */}
            <tr>
              {lobbiesList.map((l) => (
                <React.Fragment key={l}>
                  <th className={`px-2 py-2 border-b-2 border-r border-slate-700/80 text-center w-16 text-[10px] font-extrabold ${
                    l === 1 ? "bg-blue-950/40 text-blue-200" : l === 2 ? "bg-indigo-950/40 text-indigo-200" : "bg-teal-950/40 text-teal-200"
                  }`}>POS</th>
                  <th className={`px-2 py-2 border-b-2 border-r-2 border-slate-700/80 text-center w-16 text-[10px] font-extrabold ${
                    l === 1 ? "bg-blue-950/40 text-blue-200" : l === 2 ? "bg-indigo-950/40 text-indigo-200" : "bg-teal-950/40 text-teal-200"
                  }`}>KILLS</th>
                </React.Fragment>
              ))}
              <th className="px-2 py-2 border-b-2 border-r border-slate-700/80 text-center w-16 text-[10px] font-extrabold bg-emerald-950/40 text-emerald-200">+ ADD</th>
              <th className="px-2 py-2 border-b-2 border-r-2 border-slate-700/80 text-center w-16 text-[10px] font-extrabold bg-rose-950/40 text-rose-200">- SUB</th>
              <th className="px-2 py-2 border-b-2 border-r border-slate-700/80 text-center w-14 text-[10px] font-extrabold bg-[#7f1d1d] text-white">WINS</th>
              <th className="px-2 py-2 border-b-2 border-r border-slate-700/80 text-center w-16 text-[10px] font-extrabold bg-[#7f1d1d] text-white">MATCHES</th>
              <th className="px-2 py-2 border-b-2 border-r border-slate-700/80 text-center w-20 text-[10px] font-extrabold bg-[#7f1d1d] text-white">PLACE PTS</th>
              <th className="px-2 py-2 border-b-2 border-r border-slate-700/80 text-center w-16 text-[10px] font-extrabold bg-[#7f1d1d] text-white">KILLS</th>
              <th className="px-3 py-2 border-b-2 border-slate-700/80 text-center w-24 text-[10px] font-black bg-[#991b1b] text-white">TOTAL PTS</th>
            </tr>
          </thead>

          <tbody>
            {teams.map((t) => {
              const dayResults = matchResults.filter(
                (m) => m.teamId === t.id && m.dayNumber === activeDay
              );

              let totalWins = 0;
              let matchesPlayed = 0;
              let placePts = 0;
              let dayKills = 0;
              let bonusAddSum = 0;
              let bonusMinusSum = 0;

              dayResults.forEach((m) => {
                if (m.placement === 1) totalWins += 1;
                if (m.placement || m.kills) matchesPlayed += 1;
                if (m.placement && scoringConfig.placementPoints[m.placement]) {
                  placePts += scoringConfig.placementPoints[m.placement];
                }
                dayKills += m.kills;
                bonusAddSum += m.bonusAdd;
                bonusMinusSum += m.bonusMinus;
              });

              const totalPts = placePts + dayKills * scoringConfig.pointsPerKill + bonusAddSum - bonusMinusSum;

              return (
                <tr key={t.id} className="border-b border-slate-800/60 hover:bg-white/[0.05] transition-colors">
                  {/* Slot Number Square Badge */}
                  <td className="p-2 border-r border-slate-700/80 text-center font-bold">
                    <span className="inline-flex size-8 items-center justify-center rounded bg-red-600 font-extrabold text-white text-xs shadow grid place-items-center font-mono">
                      {t.slotNumber}
                    </span>
                  </td>

                  {/* Team Name */}
                  <td className="px-5 py-3 border-r-2 border-slate-700/80 font-bold text-foreground text-sm">
                    {t.teamName}
                  </td>

                  {/* Uniform Square Input Cells for Lobby 1, Lobby 2, Lobby 3 */}
                  {lobbiesList.map((l) => {
                    const matchRes = dayResults.find((m) => m.lobbyNumber === l);
                    return (
                      <React.Fragment key={l}>
                        <td className="p-1.5 border-r border-slate-800/80 text-center bg-black/20">
                          <input
                            disabled={!canEdit || isLocked}
                            type="number"
                            value={matchRes?.placement ?? ""}
                            onChange={(e) =>
                              onUpdateMatchResult(
                                t.id,
                                activeDay,
                                l,
                                "placement",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            placeholder="-"
                            className="w-14 h-10 mx-auto rounded-md bg-[#090d14] border border-slate-700/80 text-center font-mono text-sm font-extrabold text-white focus:border-[#3cbeba] focus:ring-2 focus:ring-[#3cbeba]/40 focus:bg-[#0f172a] outline-none disabled:opacity-50 transition-all shadow-inner"
                          />
                        </td>
                        <td className="p-1.5 border-r-2 border-slate-700/80 text-center bg-black/20">
                          <input
                            disabled={!canEdit || isLocked}
                            type="number"
                            value={matchRes?.kills ?? ""}
                            onChange={(e) =>
                              onUpdateMatchResult(
                                t.id,
                                activeDay,
                                l,
                                "kills",
                                Number(e.target.value)
                              )
                            }
                            placeholder="0"
                            className="w-14 h-10 mx-auto rounded-md bg-[#090d14] border border-slate-700/80 text-center font-mono text-sm font-extrabold text-white focus:border-[#3cbeba] focus:ring-2 focus:ring-[#3cbeba]/40 focus:bg-[#0f172a] outline-none disabled:opacity-50 transition-all shadow-inner"
                          />
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* Bonus + */}
                  <td className="p-1.5 border-r border-slate-800/80 text-center bg-emerald-950/20">
                    <input
                      disabled={!canEdit || isLocked}
                      type="number"
                      value={dayResults[0]?.bonusAdd ?? ""}
                      onChange={(e) =>
                        onUpdateMatchResult(
                          t.id,
                          activeDay,
                          1,
                          "bonusAdd",
                          Number(e.target.value)
                        )
                      }
                      placeholder="-"
                      className="w-14 h-10 mx-auto rounded-md bg-[#090d14] border border-emerald-500/50 text-center font-mono text-sm font-extrabold text-emerald-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 outline-none disabled:opacity-50 transition-all shadow-inner"
                    />
                  </td>

                  {/* Bonus - */}
                  <td className="p-1.5 border-r-2 border-slate-700/80 text-center bg-rose-950/20">
                    <input
                      disabled={!canEdit || isLocked}
                      type="number"
                      value={dayResults[0]?.bonusMinus ?? ""}
                      onChange={(e) =>
                        onUpdateMatchResult(
                          t.id,
                          activeDay,
                          1,
                          "bonusMinus",
                          Number(e.target.value)
                        )
                      }
                      placeholder="-"
                      className="w-14 h-10 mx-auto rounded-md bg-[#090d14] border border-rose-500/50 text-center font-mono text-sm font-extrabold text-rose-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/40 outline-none disabled:opacity-50 transition-all shadow-inner"
                    />
                  </td>

                  {/* Crimson Summary Output Cells */}
                  <td className="px-3 py-3 border-r border-slate-800/80 text-center font-mono font-bold bg-[#450a0a]/70 text-white text-sm">
                    {totalWins}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-800/80 text-center font-mono font-bold bg-[#450a0a]/70 text-white text-sm">
                    {matchesPlayed}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-800/80 text-center font-mono font-bold bg-[#450a0a]/70 text-white text-sm">
                    {placePts}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-800/80 text-center font-mono font-bold bg-[#7f1d1d] text-white text-sm">
                    {dayKills}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-extrabold bg-[#991b1b] text-white text-base shadow-inner">
                    {totalPts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

{/* ── SUBCOMPONENT: PLAYER ENTRY GRID (SINGLE-PAGE MULTI-LOBBY CELL MATRIX) ── */}
function PlayerEntryGrid({
  teams,
  players,
  playerMatchStats,
  numDays,
  lobbiesPerDay,
  canEdit,
  tournamentName,
  onUpdatePlayerStat,
  onSwitchToImport,
}: {
  teams: Team[];
  players: Player[];
  playerMatchStats: PlayerMatchStat[];
  numDays: number;
  lobbiesPerDay: number;
  canEdit: boolean;
  tournamentName: string;
  onUpdatePlayerStat: (
    playerId: string,
    dayNumber: number,
    lobbyNumber: number,
    field: "kills" | "damage" | "accuracy",
    val: number
  ) => void;
  onSwitchToImport: () => void;
}) {
  const [activeDay, setActiveDay] = useState(1);
  const [isLocked, setIsLocked] = useState(false);

  const daysList = Array.from({ length: Math.max(numDays, 5) }, (_, i) => i + 1);
  const lobbiesList = Array.from({ length: Math.max(lobbiesPerDay, 3) }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Player Entry</h1>
          <p className="text-xs text-muted mt-1">
            Single-page multi-lobby player statistics matrix · <span className="text-accent font-bold">{tournamentName}</span>
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onSwitchToImport}
              className="inline-flex items-center gap-2 rounded-lg border border-line/70 bg-white/5 px-4 py-2 text-xs font-bold text-foreground hover:bg-white/10 transition shadow-sm"
            >
              <Upload size={14} /> Paste / Upload CSV
            </button>
            <button
              onClick={() => alert("All player stat entries saved!")}
              className="inline-flex items-center gap-2 rounded-lg border border-line/70 bg-white/5 px-4 py-2 text-xs font-bold text-foreground hover:bg-white/10 transition shadow-sm"
            >
              <Save size={14} /> Save All
            </button>
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-extrabold transition shadow-md ${
                isLocked ? "bg-red-500 hover:bg-red-600 text-white" : "bg-[#e0a618] hover:bg-[#c99415] text-black"
              }`}
            >
              {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
              {isLocked ? "Unlock Stats" : "Save & Lock Stats"}
            </button>
          </div>
        )}
      </div>

      {/* Day Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-line/40 pb-3">
        <span className="text-xs font-bold text-muted uppercase tracking-wider mr-2">DAY:</span>
        {daysList.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition shadow-sm ${
              activeDay === d
                ? "bg-[#e0a618] text-black shadow-[0_0_14px_rgba(224,166,24,0.4)]"
                : "bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
            }`}
          >
            Day {d}
          </button>
        ))}
      </div>

      {/* Team Cards with Single-Page Multi-Lobby Cell Matrix */}
      <div className="space-y-6">
        {teams.map((t) => {
          const teamPlayers = players.filter((p) => p.teamId === t.id);

          return (
            <div
              key={t.id}
              className="rounded-xl border border-line/70 bg-[#0d121c]/95 p-5 shadow-2xl backdrop-blur-xl space-y-4 hover:border-line transition-all"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-line/40 pb-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-8 items-center justify-center rounded-md bg-red-600 font-extrabold text-white text-xs shadow-md font-mono">
                    {t.slotNumber}
                  </span>
                  <h3 className="font-extrabold text-base text-[#e0a618] tracking-wide">
                    {t.teamName}
                  </h3>
                  <span className="text-xs text-muted font-mono">
                    ({t.clanName || "No Tag"})
                  </span>
                </div>
                <span className="text-xs font-bold text-[#e0a618] bg-[#e0a618]/10 border border-[#e0a618]/30 px-3 py-1 rounded-full">
                  {teamPlayers.length} Players
                </span>
              </div>

              {/* Uniform Rectangular Cell Table for All Lobbies */}
              <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-[#070a0f]">
                <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                  {/* Double-tiered Table Header */}
                  <thead className="select-none font-extrabold uppercase tracking-wider text-muted">
                    {/* Top Grouping Header Row */}
                    <tr>
                      <th rowSpan={2} className="px-3 py-3 border-b-2 border-r border-slate-700/80 w-14 text-center bg-[#111622]">SLOT</th>
                      <th rowSpan={2} className="px-5 py-3 border-b-2 border-r-2 border-slate-700/80 min-w-[160px] bg-[#111622]">PLAYER NAME</th>

                      {lobbiesList.map((l) => (
                        <th key={l} colSpan={3} className={`px-2 py-2 border-b border-r-2 border-slate-700/80 text-center font-black tracking-wider text-xs ${
                          l === 1 ? "bg-blue-900/60 text-blue-300" : l === 2 ? "bg-indigo-900/60 text-indigo-300" : "bg-teal-900/60 text-teal-300"
                        }`}>
                          LOBBY {l}
                        </th>
                      ))}

                      <th rowSpan={2} className="px-4 py-3 border-b-2 border-slate-700/80 text-center w-28 bg-[#7f1d1d] text-white font-extrabold">
                        DAY KILLS
                      </th>
                    </tr>

                    {/* Sub-Header Column Titles Row */}
                    <tr>
                      {lobbiesList.map((l) => (
                        <React.Fragment key={l}>
                          <th className={`px-2 py-2 border-b-2 border-r border-slate-700/80 text-center w-16 text-[10px] font-extrabold ${
                            l === 1 ? "bg-blue-950/40 text-blue-200" : l === 2 ? "bg-indigo-950/40 text-indigo-200" : "bg-teal-950/40 text-teal-200"
                          }`}>KILLS</th>
                          <th className={`px-2 py-2 border-b-2 border-r border-slate-700/80 text-center w-16 text-[10px] font-extrabold ${
                            l === 1 ? "bg-blue-950/40 text-blue-200" : l === 2 ? "bg-indigo-950/40 text-indigo-200" : "bg-teal-950/40 text-teal-200"
                          }`}>DMG</th>
                          <th className={`px-2 py-2 border-b-2 border-r-2 border-slate-700/80 text-center w-16 text-[10px] font-extrabold ${
                            l === 1 ? "bg-blue-950/40 text-blue-200" : l === 2 ? "bg-indigo-950/40 text-indigo-200" : "bg-teal-950/40 text-teal-200"
                          }`}>ACC %</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {teamPlayers.map((p) => {
                      let dayKillsSum = 0;

                      lobbiesList.forEach((l) => {
                        const s = playerMatchStats.find(
                          (stat) =>
                            stat.playerId === p.id &&
                            stat.dayNumber === activeDay &&
                            stat.lobbyNumber === l
                        );
                        if (s) dayKillsSum += s.kills;
                      });

                      return (
                        <tr key={p.id} className="border-b border-slate-800/60 hover:bg-white/[0.05] transition-colors">
                          {/* Slot */}
                          <td className="p-2 border-r border-slate-800/80 text-center font-mono font-bold text-muted">
                            {p.slotNumber || 0}
                          </td>

                          {/* Player info */}
                          <td className="px-5 py-3 border-r-2 border-slate-700/80 font-bold text-foreground">
                            <p className="text-sm font-bold text-foreground leading-tight">{p.professionalName}</p>
                            <p className="text-xs text-muted font-mono">{p.inGameName}</p>
                          </td>

                          {/* All Lobbies Cells Side-by-Side (Uniform Rectangles) */}
                          {lobbiesList.map((l) => {
                            const stat = playerMatchStats.find(
                              (s) =>
                                s.playerId === p.id &&
                                s.dayNumber === activeDay &&
                                s.lobbyNumber === l
                            );

                            return (
                              <React.Fragment key={l}>
                                <td className="p-1.5 border-r border-slate-800/80 text-center bg-black/20">
                                  <input
                                    disabled={!canEdit || isLocked}
                                    type="number"
                                    value={stat?.kills ?? ""}
                                    onChange={(e) =>
                                      onUpdatePlayerStat(
                                        p.id,
                                        activeDay,
                                        l,
                                        "kills",
                                        Number(e.target.value)
                                      )
                                    }
                                    placeholder="0"
                                    className="w-14 h-10 mx-auto rounded-md bg-[#090d14] border border-[#e0a618]/50 text-center font-mono text-sm font-extrabold text-[#e0a618] focus:border-[#e0a618] focus:ring-2 focus:ring-[#e0a618]/40 focus:bg-[#0f172a] outline-none disabled:opacity-50 transition-all shadow-inner"
                                  />
                                </td>

                                <td className="p-1.5 border-r border-slate-800/80 text-center bg-black/20">
                                  <input
                                    disabled={!canEdit || isLocked}
                                    type="number"
                                    value={stat?.damage ?? ""}
                                    onChange={(e) =>
                                      onUpdatePlayerStat(
                                        p.id,
                                        activeDay,
                                        l,
                                        "damage",
                                        Number(e.target.value)
                                      )
                                    }
                                    placeholder="0"
                                    className="w-14 h-10 mx-auto rounded-md bg-[#090d14] border border-slate-700/80 text-center font-mono text-sm font-extrabold text-white focus:border-[#3cbeba] focus:ring-2 focus:ring-[#3cbeba]/40 focus:bg-[#0f172a] outline-none disabled:opacity-50 transition-all shadow-inner"
                                  />
                                </td>

                                <td className="p-1.5 border-r-2 border-slate-700/80 text-center bg-black/20">
                                  <input
                                    disabled={!canEdit || isLocked}
                                    type="number"
                                    value={stat?.accuracy ?? ""}
                                    onChange={(e) =>
                                      onUpdatePlayerStat(
                                        p.id,
                                        activeDay,
                                        l,
                                        "accuracy",
                                        Number(e.target.value)
                                      )
                                    }
                                    placeholder="0"
                                    className="w-14 h-10 mx-auto rounded-md bg-[#090d14] border border-slate-700/80 text-center font-mono text-sm font-extrabold text-white focus:border-[#3cbeba] focus:ring-2 focus:ring-[#3cbeba]/40 focus:bg-[#0f172a] outline-none disabled:opacity-50 transition-all shadow-inner"
                                  />
                                </td>
                              </React.Fragment>
                            );
                          })}

                          {/* Day Kills Total Cell */}
                          <td className="px-3 py-3 text-center font-mono font-extrabold bg-[#7f1d1d] text-white text-base shadow-inner">
                            {dayKillsSum}
                          </td>
                        </tr>
                      );
                    })}

                    {teamPlayers.length === 0 && (
                      <tr>
                        <td colSpan={2 + lobbiesList.length * 3 + 1} className="text-center py-6 text-xs text-muted italic">
                          No players assigned to team yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

{/* ── SUBCOMPONENTS & HELPERS ── */}
function LeaderCard({ standing }: { standing: TeamStanding }) {
  return (
    <div className="rounded-md border border-line/60 bg-black/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-accent">Rank #{standing.rank}</span>
        <span className="font-mono text-xs text-muted">{standing.wins} wins</span>
      </div>
      <p className="mt-1 font-bold text-sm text-foreground truncate">{standing.team.teamName}</p>
      <p className="font-mono text-lg font-extrabold text-accent">{standing.totalPoints} <span className="text-xs font-normal text-muted">pts</span></p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-line/70 bg-black/20 p-2.5">
      <dt className="text-[10px] font-bold uppercase text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-base font-bold text-foreground">{value}</dd>
    </div>
  );
}

function StandingsTable({ standings }: { standings: TeamStanding[] }) {
  return (
    <div className="rounded-lg border border-line/70 bg-[#0e131b]/90 shadow-glow backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-line/70 p-4">
        <div>
          <h2 className="text-lg font-bold">Team Standings Leaderboard</h2>
          <p className="text-xs text-muted mt-0.5">Ranked by total points, tie-broken by total kills.</p>
        </div>
        <BarChart3 className="text-accent" size={20} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-xs text-left">
          <thead className="bg-[#12161c] text-xs font-bold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 border-b border-line/70 w-16">Rank</th>
              <th className="px-4 py-3 border-b border-line/70">Team</th>
              <th className="px-4 py-3 border-b border-line/70 text-center font-extrabold text-foreground">Total Pts</th>
              <th className="px-4 py-3 border-b border-line/70 text-center">Kills</th>
              <th className="px-4 py-3 border-b border-line/70 text-center">Place Pts</th>
              <th className="px-4 py-3 border-b border-line/70 text-center">Bonus</th>
              <th className="px-4 py-3 border-b border-line/70 text-center">Wins</th>
              <th className="px-4 py-3 border-b border-line/70 text-center">Avg Place</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr key={standing.team.id} className="border-b border-line/40 hover:bg-white/5 transition">
                <td className="px-4 py-3 font-mono font-bold text-sm">
                  #{standing.rank}
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-foreground text-sm">{standing.team.teamName}</p>
                  <p className="text-[10px] text-muted">
                    {standing.team.clanName} · Slot {standing.team.slotNumber}
                  </p>
                </td>
                <td className="px-4 py-3 text-center font-mono text-base font-extrabold text-accent">
                  {standing.totalPoints}
                </td>
                <td className="px-4 py-3 text-center font-mono font-bold">{standing.totalKills}</td>
                <td className="px-4 py-3 text-center font-mono">{standing.placementPoints}</td>
                <td className="px-4 py-3 text-center font-mono">{standing.bonus}</td>
                <td className="px-4 py-3 text-center font-mono">{standing.wins}</td>
                <td className="px-4 py-3 text-center font-mono">{standing.avgPlacement ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerLeaderboard({ standings }: { standings: PlayerStanding[] }) {
  return (
    <div className="rounded-lg border border-line/70 bg-[#0e131b]/90 shadow-glow backdrop-blur-xl">
      <div className="border-b border-line/70 p-4">
        <h2 className="text-lg font-bold">Player Stats Leaderboard</h2>
        <p className="text-xs text-muted mt-0.5">Top players sorted by total kills, average damage, and accuracy.</p>
      </div>
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full min-w-[700px] text-xs text-left">
          <thead className="sticky top-0 bg-[#12161c] font-bold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 border-b border-line/70 w-16">Rank</th>
              <th className="px-4 py-3 border-b border-line/70">Player</th>
              <th className="px-4 py-3 border-b border-line/70">Team</th>
              <th className="px-4 py-3 border-b border-line/70 text-center font-extrabold text-accent">Kills</th>
              <th className="px-4 py-3 border-b border-line/70 text-center">K/Match</th>
              <th className="px-4 py-3 border-b border-line/70 text-center">Avg Damage</th>
              <th className="px-4 py-3 border-b border-line/70 text-center">Acc (%)</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr key={standing.player.id} className="border-b border-line/40 hover:bg-white/5 transition">
                <td className="px-4 py-3 font-mono font-bold">#{standing.rank}</td>
                <td className="px-4 py-3">
                  <p className="font-bold text-foreground text-sm">{standing.player.professionalName}</p>
                  <p className="text-[10px] text-muted">{standing.player.inGameName}</p>
                </td>
                <td className="px-4 py-3 text-muted">{standing.team?.teamName ?? "Free Agent"}</td>
                <td className="px-4 py-3 text-center font-mono font-extrabold text-accent text-sm">{standing.totalKills}</td>
                <td className="px-4 py-3 text-center font-mono font-bold">{standing.killsPerMatch}</td>
                <td className="px-4 py-3 text-center font-mono">{standing.avgDamage}</td>
                <td className="px-4 py-3 text-center font-mono">{standing.avgAccuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoringPanel({
  scoringConfig,
  canEdit,
  setScoringConfig,
}: {
  scoringConfig: ScoringConfig;
  canEdit: boolean;
  setScoringConfig: React.Dispatch<React.SetStateAction<ScoringConfig>>;
}) {
  const rows = Object.entries(scoringConfig.placementPoints).sort(
    (a, b) => Number(a[0]) - Number(b[0])
  );

  const handleUpdateKillPoints = (val: string) => {
    const num = Number(val);
    if (!isNaN(num)) {
      setScoringConfig((prev) => ({ ...prev, pointsPerKill: num }));
    }
  };

  const handleUpdatePlacementPoints = (place: number, val: string) => {
    const num = Number(val);
    if (!isNaN(num)) {
      setScoringConfig((prev) => ({
        ...prev,
        placementPoints: {
          ...prev.placementPoints,
          [place]: num,
        },
      }));
    }
  };

  const handleAddPlacementRow = () => {
    const maxPlace = rows.length > 0 ? Math.max(...rows.map((r) => Number(r[0]))) : 0;
    const newPlace = maxPlace + 1;
    setScoringConfig((prev) => ({
      ...prev,
      placementPoints: {
        ...prev.placementPoints,
        [newPlace]: 0,
      },
    }));
  };

  const handleRemovePlacementRow = () => {
    if (rows.length <= 1) return;
    const maxPlace = Math.max(...rows.map((r) => Number(r[0])));
    setScoringConfig((prev) => {
      const updated = { ...prev.placementPoints };
      delete updated[maxPlace];
      return { ...prev, placementPoints: updated };
    });
  };

  const handleSetPreset = (size: number) => {
    setScoringConfig((prev) => ({
      ...prev,
      placementPoints: defaultPlacementPoints(size),
    }));
  };

  return (
    <div className="rounded-lg border border-line/70 bg-[#0e131b]/90 p-5 shadow-glow backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between border-b border-line/70 pb-3">
        <div>
          <h2 className="text-xl font-bold">Custom Scoring Engine</h2>
          <p className="text-xs text-muted mt-0.5">Editable placement points table & kills multiplier.</p>
        </div>
        <Settings2 className="text-accent" size={22} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Points Per Kill Multiplier
            </span>
            <input
              disabled={!canEdit}
              type="number"
              value={scoringConfig.pointsPerKill}
              onChange={(e) => handleUpdateKillPoints(e.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-line/70 bg-black/40 px-3 font-mono text-sm text-foreground outline-none focus:border-accent disabled:opacity-50"
            />
          </label>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">
            Preset Allocation Buttons
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!canEdit}
              onClick={() => handleSetPreset(25)}
              className="px-3 py-1.5 text-xs font-bold rounded border border-line/60 bg-white/5 hover:bg-white/10 transition"
            >
              25 Placements
            </button>
            <button
              disabled={!canEdit}
              onClick={() => handleSetPreset(32)}
              className="px-3 py-1.5 text-xs font-bold rounded border border-line/60 bg-white/5 hover:bg-white/10 transition"
            >
              32 Placements
            </button>
            <button
              disabled={!canEdit}
              onClick={() => handleSetPreset(50)}
              className="px-3 py-1.5 text-xs font-bold rounded border border-line/60 bg-white/5 hover:bg-white/10 transition"
            >
              50 Placements
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Placement Points Distribution ({rows.length} Placements)
          </span>
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={handleAddPlacementRow}
                className="inline-flex items-center gap-1 rounded bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent hover:bg-accent/25 transition border border-accent/30"
              >
                <Plus size={12} /> Add Placement
              </button>
              <button
                onClick={handleRemovePlacementRow}
                className="inline-flex items-center gap-1 rounded bg-danger/15 px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger/25 transition border border-danger/30"
              >
                <Trash2 size={12} /> Remove Last
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {rows.map(([placement, points]) => (
            <label key={placement} className="rounded-md border border-line/60 bg-black/30 p-2.5">
              <span className="text-[11px] font-bold text-muted block mb-1">Place #{placement}</span>
              <input
                disabled={!canEdit}
                type="number"
                value={points}
                onChange={(e) => handleUpdatePlacementPoints(Number(placement), e.target.value)}
                className="h-8 w-full rounded border border-line/60 bg-black/60 px-2 font-mono text-xs font-bold text-foreground outline-none focus:border-accent disabled:opacity-50"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImportWizard({
  importType,
  setImportType,
  pasteText,
  setPasteText,
  parsedPreview,
  parsedHeaders,
  handleParseImport,
  handleCommitImport,
  canEdit,
}: {
  importType: "teams" | "players" | "results" | "stats";
  setImportType: (val: "teams" | "players" | "results" | "stats") => void;
  pasteText: string;
  setPasteText: (val: string) => void;
  parsedPreview: ParsedImportItem[] | null;
  parsedHeaders: Record<string, number> | null;
  handleParseImport: () => void;
  handleCommitImport: () => void;
  canEdit: boolean;
}) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleTeams = () => {
    setImportType("teams");
    setPasteText(
      `Slot\tTeam Name\tClan Tag\tTier\n1\tEnvy 7\tENVY\tPro\n2\tB2M Vixens\tB2M\tPro\n3\tLegion Sierra\tLGN\tPro\n4\tFaze Fusion\tFAZE\tPro\n5\tDeveloper Purple\tDEV\tPro\n6\tCartel Esports\tCRTL\tPro\n7\tElitas Outlaws\tELT\tPro\n8\tPrime Pixies\tPRM\tPro\n9\t12AM ESPORTS\t12AM\tPro`
    );
  };

  const handleLoadSamplePlayers = () => {
    setImportType("players");
    setPasteText(
      `Slot\tProfessional Name\tIn-Game Name\tTeam Name\n1\tTONY\t12 | TXNY\t12AM ESPORTS\n2\tRAGEQUEEN\t12 | SIMP\t12AM ESPORTS\n3\tKITSUNE\t12 | ⚔\t12AM ESPORTS\n4\tE11EVEN\t12 | 11\t12AM ESPORTS\n5\tPAPAGINI\tB2M | PAPA\tB2M Vixens\n6\tAREOLA\tB2M | AREOLA\tB2M Vixens\n7\tMRS SAAD\tB2M | HOLYMAMA\tB2M Vixens\n8\tKALI\tB2M | KALI\tB2M Vixens`
    );
  };

  return (
    <div className="rounded-lg border border-line/70 bg-[#0e131b]/90 p-5 shadow-glow backdrop-blur-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">Import Teams, Players & Results</h2>
        <p className="text-xs text-muted mt-0.5">
          Upload a CSV file or paste tab-separated spreadsheet columns from Excel or Google Sheets. The auto-parser automatically detects headers and maps profiles.
        </p>
      </div>

      {/* Sub-tabs for import type */}
      <div className="flex flex-wrap gap-2 border-b border-line/40 pb-3">
        {[
          { key: "teams", label: "Import Teams" },
          { key: "players", label: "Import Players" },
          { key: "results", label: "Import Match Results" },
          { key: "stats", label: "Import Player Stats" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setImportType(t.key as "teams" | "players" | "results" | "stats");
              setPasteText("");
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded transition ${
              importType === t.key
                ? "bg-accent text-black shadow-[0_0_12px_rgba(60,190,170,0.3)]"
                : "bg-white/5 text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Helper Quick Templates & Upload */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black/30 p-3 rounded-md border border-line/50">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted">Quick Sample Data:</span>
          <button
            onClick={handleLoadSampleTeams}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-white/5 hover:bg-white/10 text-accent border border-accent/30 transition"
          >
            Load Sample Teams
          </button>
          <button
            onClick={handleLoadSamplePlayers}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-white/5 hover:bg-white/10 text-accent border border-accent/30 transition"
          >
            Load Sample Players
          </button>
        </div>

        <label className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 cursor-pointer transition">
          <Upload size={13} />
          <span>Upload CSV File</span>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted block">
          Spreadsheet Paste Box ({importType.toUpperCase()})
        </label>
        <textarea
          rows={6}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={
            importType === "teams"
              ? "Slot\tTeam Name\tClan Tag\tTier\n1\t12AM ESPORTS\t12AM\tPro"
              : importType === "players"
              ? "Slot\tProfessional Name\tIn-Game Name\tTeam Name\n1\tTONY\t12 | TXNY\t12AM ESPORTS"
              : "Paste rows from Excel or Google Sheets here..."
          }
          className="w-full rounded-md border border-line/70 bg-black/40 p-3 font-mono text-xs text-foreground outline-none focus:border-accent"
        />
        <div className="flex gap-3">
          <button
            disabled={!pasteText.trim()}
            onClick={handleParseImport}
            className="px-5 py-2 rounded bg-accent text-black font-bold text-xs hover:bg-accent/90 transition disabled:opacity-50 shadow-[0_0_12px_rgba(60,190,170,0.3)]"
          >
            Parse & Detect Headers
          </button>
        </div>
      </div>

      {parsedPreview && (
        <div className="space-y-4 pt-4 border-t border-line/40">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-accent">
              Parsed Preview ({parsedPreview.length} {importType} ready to import)
            </h3>
            <button
              disabled={!canEdit}
              onClick={handleCommitImport}
              className="px-5 py-2 rounded bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400 transition shadow-[0_0_14px_rgba(16,185,129,0.4)]"
            >
              Commit Ingestion to Database
            </button>
          </div>

          <div className="overflow-x-auto rounded border border-line/60 bg-black/40 max-h-80">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-[#12161c] font-bold uppercase text-muted">
                <tr>
                  <th className="px-3 py-2 border-b border-line/50 w-12">#</th>
                  {importType === "teams" && (
                    <>
                      <th className="px-3 py-2 border-b border-line/50 w-16">Slot</th>
                      <th className="px-3 py-2 border-b border-line/50">Team Name</th>
                      <th className="px-3 py-2 border-b border-line/50">Clan Tag</th>
                      <th className="px-3 py-2 border-b border-line/50">Tier</th>
                    </>
                  )}
                  {importType === "players" && (
                    <>
                      <th className="px-3 py-2 border-b border-line/50 w-16">Slot</th>
                      <th className="px-3 py-2 border-b border-line/50">Pro Name</th>
                      <th className="px-3 py-2 border-b border-line/50">IGN</th>
                      <th className="px-3 py-2 border-b border-line/50">Team</th>
                    </>
                  )}
                  {importType !== "teams" && importType !== "players" && (
                    <th className="px-3 py-2 border-b border-line/50">Parsed Item Details</th>
                  )}
                  <th className="px-3 py-2 border-b border-line/50 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedPreview.map((item, idx) => {
                  const teamItem = item as ParsedTeamItem;
                  const playerItem = item as ParsedPlayerItem;

                  return (
                    <tr key={idx} className="border-b border-line/30 last:border-0 hover:bg-white/5">
                      <td className="px-3 py-2 text-muted">{idx + 1}</td>

                      {importType === "teams" && (
                        <>
                          <td className="px-3 py-2 font-bold text-accent">{teamItem.slotNumber}</td>
                          <td className="px-3 py-2 font-bold text-foreground">{teamItem.teamName}</td>
                          <td className="px-3 py-2 text-muted">{teamItem.clanName || "-"}</td>
                          <td className="px-3 py-2 text-muted">{teamItem.tier}</td>
                        </>
                      )}

                      {importType === "players" && (
                        <>
                          <td className="px-3 py-2 font-bold text-accent">{playerItem.slotNumber}</td>
                          <td className="px-3 py-2 font-bold text-foreground">{playerItem.professionalName}</td>
                          <td className="px-3 py-2 text-muted">{playerItem.inGameName}</td>
                          <td className="px-3 py-2 text-foreground font-semibold">{playerItem.teamName || "Free Agent"}</td>
                        </>
                      )}

                      {importType !== "teams" && importType !== "players" && (
                        <td className="px-3 py-2 text-foreground">{JSON.stringify(item)}</td>
                      )}

                      <td className="px-3 py-2 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Ready to Import
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ConflictModal({
  conflictItems,
  setConflictItems,
  onClose,
}: {
  conflictItems: ConflictItem[];
  setConflictItems: React.Dispatch<React.SetStateAction<ConflictItem[]>>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-line/70 bg-[#12161d] p-6 shadow-glow">
        <div className="flex items-center justify-between border-b border-line/40 pb-3 mb-4">
          <h3 className="text-base font-bold text-accent">Deduplication Sync Manager</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-muted mb-4">
          We found potential existing career profiles matching your imported data. Choose whether to link them or register as new:
        </p>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {conflictItems.map((item, i) => (
            <div key={i} className="rounded-md border border-line/50 bg-black/30 p-3 text-xs space-y-2">
              <p className="font-bold text-foreground">
                Imported: {"teamName" in item ? (item as ParsedTeamItem).teamName : (item as ParsedPlayerItem).professionalName}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    item.choice = "link";
                    setConflictItems([...conflictItems]);
                  }}
                  className={`px-3 py-1 rounded text-xs font-bold transition ${
                    item.choice === "link" ? "bg-accent text-black" : "bg-white/5 text-muted"
                  }`}
                >
                  Link to Career Profile
                </button>
                <button
                  onClick={() => {
                    item.choice = "new";
                    setConflictItems([...conflictItems]);
                  }}
                  className={`px-3 py-1 rounded text-xs font-bold transition ${
                    item.choice === "new" ? "bg-accent text-black" : "bg-white/5 text-muted"
                  }`}
                >
                  Register as New Entity
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-line/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-accent text-black font-bold text-xs hover:bg-accent/90 transition"
          >
            Confirm & Save Choices
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableCell({
  value,
  onChange,
  type = "text",
}: {
  value: string | number;
  onChange: (val: string) => void;
  type?: "text" | "number";
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));

  useEffect(() => {
    setVal(String(value));
  }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onChange(val);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            onChange(val);
          }
        }}
        className="w-full h-7 rounded border border-accent bg-black/80 px-1 font-mono text-xs text-foreground outline-none"
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="cursor-pointer rounded hover:bg-white/10 px-1 py-0.5 transition font-mono"
    >
      {val || "-"}
    </div>
  );
}
