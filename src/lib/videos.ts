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
