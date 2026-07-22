import type { GlobalPlayer, GlobalTeam, Player, Team } from "./types";

/**
 * Normalizes a string by converting to lowercase, trimming, and stripping non-alphanumeric characters.
 */
export function cleanString(s: string): string {
  if (!s) return "";
  return s.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

/**
 * Standard Levenshtein Distance implementation.
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // Deletion
          dp[i][j - 1] + 1,    // Insertion
          dp[i - 1][j - 1] + 1 // Substitution
        );
      }
    }
  }
  return dp[m][n];
}

/**
 * Computes a similarity score between 0.0 and 1.0.
 * Incorporates a containment booster: if either cleaned string is > 3 characters
 * and one contains the other, similarity is boosted to 0.85.
 */
export function getSimilarityScore(s1: string, s2: string): number {
  const clean1 = cleanString(s1);
  const clean2 = cleanString(s2);

  if (!clean1 || !clean2) return 0;

  // Containment booster
  if (clean1.length > 3 && clean2.length > 3) {
    if (clean1.includes(clean2) || clean2.includes(clean1)) {
      return 0.85;
    }
  }

  const dist = levenshteinDistance(clean1, clean2);
  const maxLength = Math.max(clean1.length, clean2.length);
  if (maxLength === 0) return 1;

  return 1.0 - dist / maxLength;
}

/**
 * Finds similar players in the global registry.
 */
export function getSimilarPlayers(
  name: string,
  ign: string,
  globalPlayers: GlobalPlayer[],
  threshold = 0.75
): { player: GlobalPlayer; score: number }[] {
  const results: { player: GlobalPlayer; score: number }[] = [];

  for (const gp of globalPlayers) {
    // Check both professional name and IGN similarity
    const scoreName = getSimilarityScore(name, gp.professionalName);
    const scoreIgn = getSimilarityScore(ign, gp.ign);
    const score = Math.max(scoreName, scoreIgn);

    if (score >= threshold) {
      results.push({ player: gp, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Finds similar teams in the global registry.
 */
export function getSimilarTeams(
  name: string,
  globalTeams: GlobalTeam[],
  threshold = 0.75
): { team: GlobalTeam; score: number }[] {
  const results: { team: GlobalTeam; score: number }[] = [];

  for (const gt of globalTeams) {
    const score = getSimilarityScore(name, gt.teamName);

    if (score >= threshold) {
      results.push({ team: gt, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Automatically detects the delimiter (tab, comma, semicolon) and parses the text into a matrix.
 */
export function parseDelimiterText(text: string): string[][] {
  if (!text) return [];

  // Count common delimiters
  let tabCount = 0;
  let commaCount = 0;
  let semiCount = 0;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\t") tabCount++;
    else if (text[i] === ",") commaCount++;
    else if (text[i] === ";") semiCount++;
  }

  let delimiter = ",";
  if (tabCount >= commaCount && tabCount >= semiCount && tabCount > 0) {
    delimiter = "\t";
  } else if (semiCount >= commaCount && semiCount >= tabCount && semiCount > 0) {
    delimiter = ";";
  }

  const lines = text.split(/\r?\n/);
  return lines
    .map((line) => {
      // Basic CSV/TSV split (ignoring complex quotes for simpler spreadsheet input)
      return line.split(delimiter).map((cell) => cell.trim());
    })
    .filter((row) => row.length > 0 && row.some((cell) => cell !== ""));
}

/**
 * Scans the first few rows (up to 15) to detect headers heuristically.
 * Returns a map of field name to column index, or null if no headers are detected.
 */
export function detectHeaders(rows: string[][]): Record<string, number> | null {
  const searchLimit = Math.min(15, rows.length);

  const headerKeywords: Record<string, string[]> = {
    professionalName: ["player", "name", "profname", "professional", "pro name"],
    ign: ["ign", "in game name", "ingamename", "in-game name"],
    teamName: ["team", "clan", "teamname", "squad"],
    slotNumber: ["slot", "slotnumber", "slot #"],
    kills: ["kill", "kills", "k"],
    damage: ["damage", "dmg", "d"],
    accuracy: ["accuracy", "acc", "accuracy%"],
    placement: ["placement", "place", "rank", "pos"],
    bonusAdd: ["bonus+", "bonusadd", "bonus +", "add bonus"],
    bonusMinus: ["bonus-", "bonusminus", "bonus -", "minus bonus"],
    dayNumber: ["day", "daynumber"],
    lobbyNumber: ["lobby", "lobbynumber"],
  };

  for (let i = 0; i < searchLimit; i++) {
    const row = rows[i];
    const mapping: Record<string, number> = {};
    let matchedFieldsCount = 0;

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cellClean = row[colIdx].toLowerCase().trim();
      if (!cellClean) continue;

      for (const [field, keywords] of Object.entries(headerKeywords)) {
        if (keywords.some((kw) => cellClean === kw || cellClean.startsWith(kw) || kw.startsWith(cellClean))) {
          mapping[field] = colIdx;
          matchedFieldsCount++;
          break;
        }
      }
    }

    // If we match at least 2 headers, we consider this row the header row
    if (matchedFieldsCount >= 2) {
      return mapping;
    }
  }

  return null;
}

/**
 * Scores matching parsed player names against tournament registered players/teams.
 * Exact IGN/Name match: +100 / +90
 * Substring / Containment match: +50 / +40
 * Same Team match: +50 booster
 */
export function scorePlayerMatch(
  parsedName: string,
  parsedIgn: string,
  parsedTeam: string,
  registeredPlayers: Player[],
  registeredTeams: Team[]
): { matchedPlayerId: string | null; score: number; confidence: "high" | "medium" | "low" } {
  let bestPlayerId: string | null = null;
  let bestScore = 0;

  const cleanParsedName = cleanString(parsedName);
  const cleanParsedIgn = cleanString(parsedIgn);
  const cleanParsedTeam = cleanString(parsedTeam);

  for (const rp of registeredPlayers) {
    let score = 0;
    const cleanRpName = cleanString(rp.professionalName);
    const cleanRpIgn = cleanString(rp.inGameName);

    // 1. Exact or Substring match on IGN/Name
    if (cleanParsedIgn && cleanRpIgn && cleanParsedIgn === cleanRpIgn) {
      score += 100;
    } else if (cleanParsedName && cleanRpName && cleanParsedName === cleanRpName) {
      score += 90;
    } else {
      // Substring/containment matches
      if (
        cleanParsedIgn &&
        cleanRpIgn &&
        (cleanParsedIgn.includes(cleanRpIgn) || cleanRpIgn.includes(cleanParsedIgn)) &&
        cleanParsedIgn.length > 3
      ) {
        score += 50;
      } else if (
        cleanParsedName &&
        cleanRpName &&
        (cleanParsedName.includes(cleanRpName) || cleanRpName.includes(cleanParsedName)) &&
        cleanParsedName.length > 3
      ) {
        score += 40;
      }
    }

    // 2. Team Match Booster
    if (rp.teamId) {
      const rpTeam = registeredTeams.find((t) => t.id === rp.teamId);
      if (rpTeam) {
        const cleanRpTeamName = cleanString(rpTeam.teamName);
        const cleanRpClanName = cleanString(rpTeam.clanName || "");

        if (
          cleanParsedTeam &&
          (cleanParsedTeam === cleanRpTeamName ||
            cleanParsedTeam === cleanRpClanName ||
            (cleanRpTeamName && cleanParsedTeam.includes(cleanRpTeamName)) ||
            (cleanRpClanName && cleanParsedTeam.includes(cleanRpClanName)))
        ) {
          score += 50;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestPlayerId = rp.id;
    }
  }

  let confidence: "high" | "medium" | "low" = "low";
  if (bestScore >= 140) {
    confidence = "high";
  } else if (bestScore >= 80) {
    confidence = "medium";
  }

  return {
    matchedPlayerId: bestPlayerId,
    score: bestScore,
    confidence,
  };
}
