/**
 * Sports API service
 * -------------------
 * Single integration point for live sports odds. Components MUST import
 * `fetchLiveMatches` / `fetchMatchDetail` from here and never call the
 * network directly, so swapping providers stays a one-file change.
 *
 * CORS note (deployment):
 *   Browsers cannot call most sportsbook APIs directly because the upstream
 *   does not return `Access-Control-Allow-Origin`. We proxy through the
 *   Supabase edge function `live-sports-odds`, which is the recommended path
 *   on Lovable. To point at a different backend or a CORS-enabled REST API
 *   instead, set `VITE_SPORTS_API_BASE_URL` (and optionally
 *   `VITE_SPORTS_API_KEY`) and flip `MODE` below to `"rest"`.
 */

import { supabase } from "@/integrations/supabase/client";

export type Sport =
  | "football"
  | "cricket"
  | "basketball"
  | "tennis"
  | "kabaddi"
  | "volleyball";

export type MatchStatus = "live" | "upcoming" | "finished";

export interface MatchData {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  startTime: string;
  elapsed?: string;
  odds: { home: number; draw: number; away: number };
  oddsChanges?: {
    home: "up" | "down" | "same";
    draw: "up" | "down" | "same";
    away: "up" | "down" | "same";
  };
  totalMarkets: number;
  isBookmarked?: boolean;
  lastUpdated?: string;
}

export interface FetchMatchesResult {
  matches: MatchData[];
  lastUpdated?: string;
  source: "edge" | "rest" | "mock";
}

// ---- Config ---------------------------------------------------------------

type Mode = "edge" | "rest" | "mock";

const ENV = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const API_BASE_URL = ENV.VITE_SPORTS_API_BASE_URL ?? "";
const API_KEY = ENV.VITE_SPORTS_API_KEY ?? "";

// Default to the edge proxy (works on Lovable out of the box).
// Switch to "rest" once VITE_SPORTS_API_BASE_URL points at a CORS-enabled API,
// or to "mock" for offline development.
const MODE: Mode = (ENV.VITE_SPORTS_API_MODE as Mode) || "edge";

const REQUEST_TIMEOUT_MS = 15_000;

// ---- Mock data ------------------------------------------------------------

export const getMockMatches = (): MatchData[] => [
  {
    id: "m1", sport: "football", league: "⚽ ইংলিশ প্রিমিয়ার লিগ",
    homeTeam: "Arsenal", awayTeam: "Chelsea", homeScore: 2, awayScore: 1,
    status: "live", startTime: new Date().toISOString(), elapsed: "65'",
    odds: { home: 2.45, draw: 3.10, away: 2.80 },
    oddsChanges: { home: "up", draw: "same", away: "down" },
    totalMarkets: 124,
  },
  {
    id: "m2", sport: "cricket", league: "🏏 BPL T20",
    homeTeam: "Dhaka Dominators", awayTeam: "Comilla Victorians",
    status: "upcoming", startTime: new Date(Date.now() + 3600_000).toISOString(),
    odds: { home: 1.85, draw: 0, away: 1.95 },
    totalMarkets: 47,
  },
  {
    id: "m3", sport: "football", league: "⚽ লা লিগা",
    homeTeam: "Real Madrid", awayTeam: "Barcelona", homeScore: 3, awayScore: 3,
    status: "finished", startTime: new Date(Date.now() - 7200_000).toISOString(),
    odds: { home: 2.10, draw: 3.40, away: 2.95 },
    totalMarkets: 0,
  },
  {
    id: "m4", sport: "basketball", league: "🏀 NBA",
    homeTeam: "Lakers", awayTeam: "Celtics", homeScore: 78, awayScore: 81,
    status: "live", startTime: new Date().toISOString(), elapsed: "Q3 04:21",
    odds: { home: 2.20, draw: 0, away: 1.72 },
    oddsChanges: { home: "down", draw: "same", away: "up" },
    totalMarkets: 56,
  },
  {
    id: "m5", sport: "tennis", league: "🎾 ATP Masters",
    homeTeam: "Djokovic", awayTeam: "Alcaraz",
    status: "upcoming", startTime: new Date(Date.now() + 5400_000).toISOString(),
    odds: { home: 1.65, draw: 0, away: 2.25 },
    totalMarkets: 18,
  },
  {
    id: "m6", sport: "kabaddi", league: "🤼 Pro Kabaddi",
    homeTeam: "Bengal Warriors", awayTeam: "Patna Pirates", homeScore: 24, awayScore: 22,
    status: "live", startTime: new Date().toISOString(), elapsed: "32:10",
    odds: { home: 1.90, draw: 0, away: 1.95 },
    oddsChanges: { home: "up", draw: "same", away: "same" },
    totalMarkets: 28,
  },
];

const filterMock = (sport?: string): MatchData[] => {
  const all = getMockMatches();
  if (!sport || sport === "all") return all;
  return all.filter((m) => m.sport === sport);
};

// ---- Transport helpers ----------------------------------------------------

async function fetchViaEdge(sport?: string): Promise<FetchMatchesResult> {
  const { data, error } = await supabase.functions.invoke("live-sports-odds", {
    body: { sport: sport ?? "all" },
  });
  if (error) throw new Error(error.message);
  const matches = ((data?.matches ?? []) as MatchData[]).map((m) => ({
    ...m,
    lastUpdated: m.lastUpdated ?? (data?.lastUpdated as string | undefined),
  }));
  return {
    matches,
    lastUpdated: data?.lastUpdated as string | undefined,
    source: "edge",
  };
}

async function fetchViaRest(sport?: string): Promise<FetchMatchesResult> {
  if (!API_BASE_URL) throw new Error("VITE_SPORTS_API_BASE_URL is not configured");

  const url = new URL(`${API_BASE_URL.replace(/\/$/, "")}/matches/live`);
  if (sport && sport !== "all") url.searchParams.set("sport", sport);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Sports API ${res.status}`);
    const json = (await res.json()) as {
      success?: boolean;
      data?: MatchData[];
      lastUpdated?: string;
    };
    const matches = (json.data ?? []).map((m) => ({
      ...m,
      lastUpdated: m.lastUpdated ?? json.lastUpdated,
    }));
    return { matches, lastUpdated: json.lastUpdated, source: "rest" };
  } finally {
    clearTimeout(timer);
  }
}

// ---- Public API -----------------------------------------------------------

/**
 * Fetch live/upcoming matches. Falls back to mock data so the UI never blanks.
 */
export async function fetchLiveMatches(sport?: string): Promise<FetchMatchesResult> {
  try {
    const result =
      MODE === "rest" ? await fetchViaRest(sport) :
      MODE === "mock" ? { matches: filterMock(sport), source: "mock" as const } :
      await fetchViaEdge(sport);

    if (result.matches.length === 0) {
      return { matches: filterMock(sport), source: "mock" };
    }
    return result;
  } catch (err) {
    console.error("[sportsApi] fetchLiveMatches failed:", err);
    return { matches: filterMock(sport), source: "mock" };
  }
}

/**
 * Fetch detail for a single match. REST mode only — edge proxy currently
 * returns the full list; callers should look matches up from cache instead.
 */
export async function fetchMatchDetail(matchId: string): Promise<MatchData | null> {
  if (MODE !== "rest" || !API_BASE_URL) {
    return getMockMatches().find((m) => m.id === matchId) ?? null;
  }
  const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/matches/${matchId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: MatchData };
  return json.data ?? null;
}
