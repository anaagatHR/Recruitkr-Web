import { apiDelete, apiGet, apiRequest } from "@/lib/api";

export type CandidateVideoItem = {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
};

type ApiEnvelope<T> = { success?: boolean; data: T };

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type ShowcaseVideo = {
  id: string;
  url: string;
  name: string;
  candidateName: string;
  role: string;
  photoUrl: string;
  kind: "candidate" | "client";
};

/** Public — real candidate videos for the home page showcase. */
export const fetchShowcaseVideos = async (limit = 12): Promise<ShowcaseVideo[]> => {
  try {
    const res = await apiGet<ApiEnvelope<ShowcaseVideo[]>>(`/videos/showcase?limit=${limit}`);
    return res?.data ?? [];
  } catch {
    return [];
  }
};

export type ShortItem = {
  id: string;
  title?: string;
  source?: "youtube" | "upload";
  url?: string;
  posterUrl?: string;
};

/** Public — short videos (YouTube + uploads). "all" returns candidate + employer mixed. */
export const fetchShorts = async (
  audience: "candidate" | "employer" | "all",
): Promise<ShortItem[]> => {
  try {
    const qs = audience === "all" ? "" : `?audience=${audience}`;
    const res = await apiGet<ApiEnvelope<ShortItem[]>>(`/videos/shorts${qs}`);
    return res?.data ?? [];
  } catch {
    return [];
  }
};

export type HomeStory = {
  id: string;
  text: string;
  link: string;
  name: string;
  role: string;
  image: string;
  video: string;
};

/** Public — home "Success Stories" cards managed from the CRM Web Panel. */
export const fetchHomeStories = async (): Promise<HomeStory[]> => {
  try {
    const res = await apiGet<ApiEnvelope<HomeStory[]>>("/videos/stories");
    return res?.data ?? [];
  } catch {
    return [];
  }
};

/** List the signed-in candidate's uploaded videos. */
export const fetchMyVideos = async (): Promise<CandidateVideoItem[]> => {
  const res = await apiGet<ApiEnvelope<CandidateVideoItem[]>>("/users/candidate/videos", {
    auth: true,
  });
  return res?.data ?? [];
};

/** Upload a new candidate video (multipart). */
export const uploadMyVideo = async (file: File): Promise<CandidateVideoItem> => {
  const form = new FormData();
  form.append("video", file);
  const res = await apiRequest<ApiEnvelope<CandidateVideoItem>>("/users/candidate/videos", {
    method: "POST",
    body: form,
    auth: true,
    // Video uploads can be large; allow more time and no auto-retries.
    timeoutMs: 120000,
    retries: 0,
  });
  return res.data;
};

/** Delete one of the candidate's videos by id. */
export const deleteMyVideo = async (videoId: string): Promise<void> => {
  await apiDelete(`/users/candidate/videos/${videoId}`, { auth: true });
};
