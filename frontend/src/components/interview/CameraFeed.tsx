"use client";

import { useCamera } from "@/hooks/useCamera";
import { cn } from "@/lib/utils";

interface CameraFeedProps {
  className?: string;
}

export function CameraFeed({ className }: CameraFeedProps) {
  const { videoRef, error, isReady } = useCamera();

  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-gray-900 aspect-video", className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn("w-full h-full object-cover", !isReady && "opacity-0")}
      />
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center space-y-2">
            <div className="text-4xl">📷</div>
            <p className="text-sm">Starting camera...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center space-y-2 px-4">
            <div className="text-4xl">🚫</div>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}
      {/* Recording indicator */}
      {isReady && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          LIVE
        </div>
      )}
    </div>
  );
}
