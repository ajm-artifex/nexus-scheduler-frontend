// frontend/src/lib/api.ts

// Read the API base from env at build/runtime (browser-safe).
const API_BASE: string =
  (typeof process !== "undefined" &&
    (process.env?.NEXT_PUBLIC_API_BASE_URL as string | undefined)) ||
  "http://localhost:8000";

/**
 * Toggle whether requests send browser credentials (cookies).
 * - If you use Authorization: Bearer <token>, set this to false (default).
 * - If you truly rely on server-set cookies (SameSite=None; Secure), set to true
 *   and ensure your backend CORS allow_origins is NOT "*" and allow_credentials=true.
 */
const USE_CREDENTIALS: boolean =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_USE_CREDENTIALS === "true") || false;

const REQUEST_CREDENTIALS: RequestCredentials = USE_CREDENTIALS
  ? "include"
  : "omit";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response, path: string): Promise<T> {
  if (res.ok) {
    // Try to parse JSON; if empty, return as unknown then cast
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  // Build a helpful error with server message if available
  let serverMsg = "";
  try {
    const data = await res.json();
    serverMsg =
      (typeof data?.detail === "string" && data.detail) ||
      (typeof data?.message === "string" && data.message) ||
      "";
  } catch {
    /* ignore JSON parse errors */
  }

  const base = `${res.status} ${res.statusText}`.trim();
  const msg = serverMsg ? `${base} — ${serverMsg}` : base;
  throw new Error(`${res.url || path} failed: ${msg}`);
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    mode: "cors",
    cache: "no-store",
    credentials: REQUEST_CREDENTIALS,
    headers: { ...getAuthHeader() },
    signal,
  });
  return handleResponse<T>(res, path);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    mode: "cors",
    credentials: REQUEST_CREDENTIALS,
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(body),
    cache: "no-store",
    signal,
  });
  return handleResponse<T>(res, path);
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    mode: "cors",
    credentials: REQUEST_CREDENTIALS,
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal,
  });
  return handleResponse<T>(res, path);
}
