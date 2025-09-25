// frontend/src/lib/api.ts

declare const process: any;
const API_BASE = (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_API_BASE_URL) || "http://localhost:8000";

function getAuthHeader() {
    if (typeof window === 'undefined') return {} as Record<string, string>;
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", credentials: "include", headers: { ...getAuthHeader() } });
	if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
	return res.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
	const url = `${API_BASE}${path}`;
  	const res = await fetch(url, {
		method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(body),
        credentials: "include",
	});
  if (!res.ok) {
    // Try to surface backend detail
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.detail || data?.message || JSON.stringify(data);
    } catch {
      detail = await res.text();
    }
    throw new Error(`POST ${path} failed: ${res.status} ${detail || ""}`.trim());
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body?: any): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
	});
	if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
	return res.json();
} 