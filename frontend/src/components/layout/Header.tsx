"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/Button";

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openLogin = () => { setAuthMode("login"); setAuthOpen(true); };
  const openRegister = () => { setAuthMode("register"); setAuthOpen(true); };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
          <Link href="/" className="font-bold text-white hover:text-blue-400 transition-colors">
            Interview<span className="text-blue-400">AI</span>
          </Link>

          <nav className="flex items-center gap-3">
            {isLoading ? null : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300 hidden sm:block">
                    {user.display_name || user.email}
                  </span>
                  <button
                    onClick={logout}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <Button size="sm" onClick={openRegister}>
                  Register
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}
