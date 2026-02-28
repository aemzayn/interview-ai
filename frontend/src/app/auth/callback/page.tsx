import { Suspense } from "react";
import AuthCallbackInner from "./AuthCallbackInner";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <p className="text-gray-400 text-sm">Completing sign in…</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
