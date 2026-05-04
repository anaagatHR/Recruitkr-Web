import { getSession } from "@/lib/auth";
import { apiPost } from "@/lib/api";

export type UploadFolder = "resumes" | "profiles" | "team" | "blogs";

export type UploadedFileAsset = {
  fileId: string;
  url: string;
};

const IMAGE_MAX_BYTES = 500 * 1024;
const RESUME_MAX_BYTES = 2 * 1024 * 1024;

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const allowedResumeTypes = new Set(["application/pdf"]);

const folderRules: Record<
  UploadFolder,
  {
    maxBytes: number;
    acceptedTypes: Set<string>;
    label: string;
  }
> = {
  resumes: {
    maxBytes: RESUME_MAX_BYTES,
    acceptedTypes: allowedResumeTypes,
    label: "resume PDF",
  },
  profiles: {
    maxBytes: IMAGE_MAX_BYTES,
    acceptedTypes: allowedImageTypes,
    label: "profile image",
  },
  team: {
    maxBytes: IMAGE_MAX_BYTES,
    acceptedTypes: allowedImageTypes,
    label: "team image",
  },
  blogs: {
    maxBytes: IMAGE_MAX_BYTES,
    acceptedTypes: allowedImageTypes,
    label: "blog image",
  },
};

export const validateUploadFile = (file: File, folder: UploadFolder) => {
  const rule = folderRules[folder];
  if (!rule.acceptedTypes.has(file.type)) {
    throw new Error(`Please upload a valid ${rule.label}.`);
  }

  if (file.size > rule.maxBytes) {
    const sizeText = folder === "resumes" ? "2MB" : "500KB";
    throw new Error(
      `${rule.label[0].toUpperCase()}${rule.label.slice(1)} must be ${sizeText} or smaller.`,
    );
  }
};

export const uploadFile = async (
  file: File,
  folder: UploadFolder,
): Promise<UploadedFileAsset> => {
  validateUploadFile(file, folder);

  const session = getSession();
  if (!session?.accessToken) {
    throw new Error("You need to be logged in to upload files.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const payload = await apiPost<{
    success?: boolean;
    url?: string;
    fileId?: string;
    data?: {
      url?: string;
      fileId?: string;
    };
  }>("/uploads/file", formData, true);

  const url = payload.data?.url || payload.url;
  const fileId = payload.data?.fileId || payload.fileId;
  if (!payload.success || !url || !fileId) {
    console.error("[uploadFile] backend upload failed", payload);
    throw new Error("Failed to upload file");
  }

  return {
    url,
    fileId,
  };
};

export const uploadRules = {
  imageMaxBytes: IMAGE_MAX_BYTES,
  resumeMaxBytes: RESUME_MAX_BYTES,
};
