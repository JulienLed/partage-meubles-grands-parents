"use client";

import { useRef } from "react";

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      suppressHydrationWarning
      style={{ position: "fixed", inset: 0, zIndex: -1, backgroundColor: "#faf8f5" }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        suppressHydrationWarning
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }}
      >
        <source src="/wallpaper.webm" type="video/webm" />
      </video>
    </div>
  );
}
