"use client";
import { memo } from "react";
import logo from "@/assets/logo.jpeg";

type OptimizedLogoProps = {
  alt?: string;
  className?: string;
  imgClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "sync" | "auto";
  sizes?: string;
};

// Uses the well-cropped wide wordmark (same source as the navbar) so the logo
// looks correct everywhere instead of the heavily-padded square variant.
const OptimizedLogo = memo(function OptimizedLogo({
  alt = "RecruitKr",
  className,
  imgClassName,
  loading = "lazy",
  fetchPriority = "auto",
  decoding = "async",
  sizes = "(max-width: 768px) 136px, 186px",
}: OptimizedLogoProps) {
  return (
    <picture className={className}>
      <img
        src={logo.src}
        alt={alt}
        width={logo.width}
        height={logo.height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        sizes={sizes}
        className={imgClassName}
      />
    </picture>
  );
});

export default OptimizedLogo;
