import { apiGet } from "@/lib/api";

export type TeamMember = {
  _id: string;
  name: string;
  role: string;
  summary: string;
  image: string;
  linkedin: string;
  email: string;
};

const TEAM_CACHE_KEY = "recruitkr.team.cache.v1";
const TEAM_CACHE_TTL_MS = 5 * 60 * 1000;

type TeamMemberResponse = {
  _id: string;
  name: string;
  role: string;
  summary: string;
  image: string;
  linkedin: string;
  email: string;
};

export const fetchTeamMembers = async () => {
  const response = await apiGet<TeamMemberResponse[]>("/api/team");
  const members = Array.isArray(response) ? response : [];

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(
        TEAM_CACHE_KEY,
        JSON.stringify({
          savedAt: Date.now(),
          members,
        }),
      );
    } catch (error) {
      console.warn("[team] unable to persist team cache", error);
      try {
        sessionStorage.removeItem(TEAM_CACHE_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
    }
  }

  return members;
};

export const getCachedTeamMembers = (): TeamMember[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = sessionStorage.getItem(TEAM_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as {
      savedAt?: number;
      members?: TeamMember[];
    };

    if (!parsed?.savedAt || Date.now() - parsed.savedAt > TEAM_CACHE_TTL_MS) {
      sessionStorage.removeItem(TEAM_CACHE_KEY);
      return [];
    }

    return Array.isArray(parsed.members) ? parsed.members : [];
  } catch {
    return [];
  }
};
