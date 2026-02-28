"use client";

import { useState, FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";

// In production builds (NODE_ENV=production) only Google OAuth is shown.
// In development both email/password and Google are available.
const EMAIL_AUTH_ENABLED = process.env.NODE_ENV === "development";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60"
    >
      {/* Google "G" logo */}
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      {loading ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}

export function AuthModal({ open, onClose, defaultMode = "login" }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError(null);
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName || undefined);
      }
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { url } = await api.auth.googleUrl();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start Google sign-in");
      setGoogleLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={EMAIL_AUTH_ENABLED ? (mode === "login" ? "Sign In" : "Create Account") : "Sign In"}
    >
      {/* Google OAuth — always available */}
      <GoogleButton onClick={handleGoogle} loading={googleLoading} />

      {EMAIL_AUTH_ENABLED && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-5 gap-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Display Name (optional)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isLoading}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            {mode === "login" ? "No account yet? " : "Already have an account? "}
            <button
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="text-blue-400 hover:underline"
            >
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </p>
        </>
      )}

      {/* Show error for Google-only mode outside the form */}
      {!EMAIL_AUTH_ENABLED && error && (
        <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </Modal>
  );
}
