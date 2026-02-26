"use client";

import { useEffect, useRef, useState } from "react";

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  error: string | null;
  isReady: boolean;
  stop: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => setIsReady(true);
        }
      } catch (err) {
        if (!active) return;
        const msg =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera access in your browser."
            : "Camera not available.";
        setError(msg);
      }
    }

    start();

    return () => {
      active = false;
    };
  }, []);

  const stop = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsReady(false);
  };

  return { videoRef, stream, error, isReady, stop };
}
