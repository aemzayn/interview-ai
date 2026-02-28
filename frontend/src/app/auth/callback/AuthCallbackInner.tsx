"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      router.replace(`/?auth_error=${encodeURIComponent(error)}`);
      return;
    }

    if (!code) {
      router.replace("/");
      return;
    }

    loginWithGoogle(code)
      .then(() => router.replace("/"))
      .catch(() => router.replace("/?auth_error=google_exchange_failed"));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-950">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Completing sign in…</p>
    </div>
  );
}
