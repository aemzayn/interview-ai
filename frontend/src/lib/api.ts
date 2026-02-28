import type {
  CVUploadResponse,
  StartInterviewRequest,
  StartInterviewResponse,
  RespondRequest,
  RespondResponse,
  InterviewResults,
  TokenResponse,
  UserPublic,
  SessionSummary,
  OverviewResponse,
} from "@/types";

// Relative paths proxy through Next.js rewrites to localhost:8000 in dev.
// Set NEXT_PUBLIC_API_URL only when backend is on a different domain in prod.
const API_BASE =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "";

const TOKEN_KEY = "iait";

function authHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...authHeader(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ── CV ──────────────────────────────────────────────────────────────────────
  uploadCV: async (file: File): Promise<CVUploadResponse> => {
    const form = new FormData();
    form.append("file", file);
    return request<CVUploadResponse>("/api/cv/upload", { method: "POST", body: form });
  },

  // ── Interview ────────────────────────────────────────────────────────────────
  startInterview: async (payload: StartInterviewRequest): Promise<StartInterviewResponse> =>
    request<StartInterviewResponse>("/api/interview/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  respond: async (payload: RespondRequest): Promise<RespondResponse> =>
    request<RespondResponse>("/api/interview/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  endInterview: async (sessionId: string): Promise<void> => {
    await request("/api/interview/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
  },

  /** Returns null while evaluating (202), results when ready. */
  getResults: async (sessionId: string): Promise<InterviewResults | null> => {
    const res = await fetch(`${API_BASE}/api/interview/${sessionId}/results`, {
      headers: authHeader() as Record<string, string>,
    });
    if (res.status === 202) return null;
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, body.detail ?? "Failed to fetch results");
    }
    return res.json() as Promise<InterviewResults>;
  },

  // ── Auth ─────────────────────────────────────────────────────────────────────
  auth: {
    register: (email: string, password: string, displayName?: string): Promise<TokenResponse> =>
      request<TokenResponse>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, display_name: displayName }),
      }),

    login: (email: string, password: string): Promise<TokenResponse> =>
      request<TokenResponse>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),

    me: (): Promise<UserPublic> => request<UserPublic>("/api/auth/me"),

    /** Returns the Google OAuth authorization URL to redirect the user to. */
    googleUrl: (): Promise<{ url: string }> =>
      request<{ url: string }>("/api/auth/google"),

    /** Exchange an OAuth authorization code (from Google's redirect) for an app JWT. */
    googleExchange: (code: string): Promise<TokenResponse> =>
      request<TokenResponse>("/api/auth/google/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }),
  },

  // ── User dashboard ────────────────────────────────────────────────────────────
  users: {
    history: (): Promise<SessionSummary[]> =>
      request<SessionSummary[]>("/api/users/me/history"),

    overview: (): Promise<OverviewResponse> =>
      request<OverviewResponse>("/api/users/me/overview"),
  },
};
