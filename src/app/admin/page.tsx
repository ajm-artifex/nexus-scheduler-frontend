// frontend/src/app/admin/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";

type Role = "student" | "ssm" | "admin";

type UserRow = {
  user_id: number;
  disco_user_id: string | null;
  email: string;
  full_name: string;
  role: Role;
  is_banned: boolean;
  created_at: string;
};

type SsmOption = {
  user_id: number;
  full_name: string;
  email: string;
};

type Availability = {
  availability_id: number;
  user_id: number;
  day_of_week: number; // 0=Sun..6=Sat (DB schema)
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
};

type ReportSummary = {
  total_bookings: number;
  cancelled: number;
  completed: number;
  no_shows: number;
};

type ReportBySSM = {
  ssm_id: number;
  ssm_name?: string | null;
  ssm_email?: string | null;
  total: number;
  cancelled: number;
  completed: number;
  no_show: number;
  no_show_rate: number;
};

type ReportByPathway = {
  pathway_id: number;
  pathway_name?: string | null;
  total: number;
  cancelled: number;
  completed: number;
  no_show: number;
  no_show_rate: number;
};

// ----- local helpers for PUT / DELETE (auth header + API base) -----
const API_BASE =
  (typeof process !== "undefined" &&
    (process as any)?.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:8000";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function putJSON<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    credentials: "include",
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}
async function del(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { ...authHeader() },
    credentials: "include",
  });
  if (!res.ok && res.status !== 204)
    throw new Error(`DELETE ${path} failed: ${res.status}`);
}

/** ========= Reusable SSM Combobox =========
 * - Typeahead search against /user/search?role=ssm&q=
 * - Keyboard + mouse selection
 * - Returns the chosen SSM option via onSelect
 */
function SsmPicker({
  label = "Select SSM",
  placeholder = "Type name or email…",
  value,
  onSelect,
}: {
  label?: string;
  placeholder?: string;
  value: SsmOption | null;
  onSelect: (opt: SsmOption | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SsmOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // search ssms (debounced)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          role: "ssm",
          limit: "25",
          offset: "0",
        });
        if (query.trim()) qs.set("q", query.trim());
        const data = await apiGet<UserRow[]>(`/user/search?${qs.toString()}`);
        if (cancelled) return;
        setOptions(
          data.map((u) => ({
            user_id: u.user_id,
            full_name: u.full_name,
            email: u.email,
          }))
        );
        setOpen(true);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  // show selected in the input when value changes
  useEffect(() => {
    if (value) setQuery(`${value.full_name} <${value.email}>`);
  }, [value]);

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            // if user edits, clear current selection
            if (value) onSelect(null);
          }}
        />
        {open && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
            ) : options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {query ? "No matches" : "Start typing to search SSMs"}
              </div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.user_id}
                  type="button"
                  onClick={() => {
                    onSelect(opt);
                    setOpen(false);
                    setQuery(`${opt.full_name} <${opt.email}>`);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                >
                  <div className="font-medium text-sm">{opt.full_name}</div>
                  <div className="text-xs text-gray-500">{opt.email}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- page ----------
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "students" | "pathways" | "availability" | "reports"
  >("students");

  // ===== Students tab state =====
  const [students, setStudents] = useState<UserRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);
  const offset = (page - 1) * limit;

  // ===== Pathways tab state =====
  const [ssmForPathways, setSsmForPathways] = useState<SsmOption | null>(null);
  const [ssmPathwayIds, setSsmPathwayIds] = useState<number[]>([]);
  const [loadingPathways, setLoadingPathways] = useState(false);
  const [newPathwaysCsv, setNewPathwaysCsv] = useState("");

  // ===== Availability tab (Admin overrides for an SSM) =====
  const [ssmForAvail, setSsmForAvail] = useState<SsmOption | null>(null);
  const [availRows, setAvailRows] = useState<Availability[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [newAvail, setNewAvail] = useState({
    dow: 1,
    start: "09:00",
    end: "17:00",
  });

  // ===== Reports tab =====
  const [rStart, setRStart] = useState("");
  const [rEnd, setREnd] = useState("");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [bySsm, setBySsm] = useState<ReportBySSM[]>([]);
  const [byPathway, setByPathway] = useState<ReportByPathway[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // route guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
    }
  }, [authLoading, user, router]);

  // load students
  useEffect(() => {
    if (user?.role === "admin" && activeTab === "students") {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id, activeTab, limit, offset]);

  // debounce search
  useEffect(() => {
    if (user?.role !== "admin" || activeTab !== "students") return;
    const t = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  async function fetchStudents() {
    try {
      setLoadingStudents(true);
      const params = new URLSearchParams({
        role: "student",
        limit: String(limit),
        offset: String(offset),
      });
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      const data = await apiGet<UserRow[]>(`/user/search?${params}`);
      setStudents(data);
    } catch (e: any) {
      addToast(e.message || "Failed to load students", "error");
    } finally {
      setLoadingStudents(false);
    }
  }

  async function toggleBan(u: UserRow) {
    try {
      await apiPatch(
        `/admin/ban/${u.user_id}?banned=${(!u.is_banned).toString()}`
      );
      setStudents((prev) =>
        prev.map((s) =>
          s.user_id === u.user_id ? { ...s, is_banned: !s.is_banned } : s
        )
      );
      addToast(!u.is_banned ? "Student banned" : "Student unbanned", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to update ban status", "error");
    }
  }

  const studentKpi = useMemo(
    () => ({
      totalInPage: students.length,
      bannedInPage: students.filter((s) => s.is_banned).length,
    }),
    [students]
  );

  // ---- pathways handlers ----
  async function loadPathwaysForSsm() {
    if (!ssmForPathways) return;
    try {
      setLoadingPathways(true);
      const resp = await apiGet<{ ssm_id: number; pathway_ids: number[] }>(
        `/admin/ssm/${ssmForPathways.user_id}/pathways`
      );
      setSsmPathwayIds(resp.pathway_ids);
      setNewPathwaysCsv(resp.pathway_ids.join(","));
    } catch (e: any) {
      addToast(e.message || "Failed to fetch SSM pathways", "error");
    } finally {
      setLoadingPathways(false);
    }
  }

  async function savePathwaysForSsm() {
    if (!ssmForPathways) return;
    const cleanIds = newPathwaysCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));

    try {
      setLoadingPathways(true);
      const resp = await putJSON<{ ssm_id: number; pathway_ids: number[] }>(
        `/admin/ssm/${ssmForPathways.user_id}/pathways`,
        { pathway_ids: cleanIds }
      );
      setSsmPathwayIds(resp.pathway_ids);
      setNewPathwaysCsv(resp.pathway_ids.join(","));
      addToast("Pathways updated", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to update pathways", "error");
    } finally {
      setLoadingPathways(false);
    }
  }

  // ---- availability handlers ----
  async function loadAvailability() {
    if (!ssmForAvail) return;
    try {
      setLoadingAvail(true);
      const rows = await apiGet<Availability[]>(
        `/availability/user/${ssmForAvail.user_id}`
      );
      setAvailRows(rows);
    } catch (e: any) {
      addToast(e.message || "Failed to load availability", "error");
    } finally {
      setLoadingAvail(false);
    }
  }

  async function addAvailability() {
    if (!ssmForAvail) return;
    try {
      setLoadingAvail(true);
      const payload = {
        day_of_week: newAvail.dow,
        start_time: `${newAvail.start}:00`,
        end_time: `${newAvail.end}:00`,
      };
      const rec = await apiPost<Availability>(
        `/admin/ssm/${ssmForAvail.user_id}/availability`,
        payload
      );
      setAvailRows((prev) => [...prev, rec]);
      addToast("Availability added", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to add availability", "error");
    } finally {
      setLoadingAvail(false);
    }
  }

  async function deleteAvailability(aid: number) {
    try {
      await del(`/admin/availability/${aid}`);
      setAvailRows((prev) => prev.filter((r) => r.availability_id !== aid));
      addToast("Availability deleted", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to delete availability", "error");
    }
  }

  // ---- reports handlers ----
  async function loadReports() {
    try {
      setLoadingReports(true);
      const qs = new URLSearchParams();
      if (rStart) qs.set("start", rStart);
      if (rEnd) qs.set("end", rEnd);

      const [sum, ssm, path] = await Promise.all([
        apiGet<ReportSummary>(`/admin/reports?${qs.toString()}`),
        apiGet<ReportBySSM[]>(`/admin/reports/ssm?${qs.toString()}`),
        apiGet<ReportByPathway[]>(`/admin/reports/pathways?${qs.toString()}`),
      ]);
      setSummary(sum);
      setBySsm(ssm);
      setByPathway(path);
    } catch (e: any) {
      addToast(e.message || "Failed to load reports", "error");
    } finally {
      setLoadingReports(false);
    }
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex items-center text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 bg-gray-100 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-red-600">Admin</h1>
          <p className="text-gray-600">
            Manage students, SSM assignments, and reporting
          </p>
        </div>
        <div className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
          {user.full_name}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="-mb-px flex gap-6">
          {[
            { id: "students", label: "Students" },
            { id: "pathways", label: "SSM ↔ Pathways" },
            { id: "availability", label: "SSM Availability" },
            { id: "reports", label: "Reports" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-1 pb-3 border-b-2 text-sm ${
                activeTab === (t.id as any)
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Students */}
      {activeTab === "students" && (
        <div className="space-y-6">
          {/* KPIs (this page) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Students (page)</div>
              <div className="text-2xl font-semibold">
                {studentKpi.totalInPage}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Banned (page)</div>
              <div className="text-2xl font-semibold">
                {studentKpi.bannedInPage}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
              placeholder="Search by name, email, or ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded-md px-2 py-2 text-black"
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              {[10, 25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loadingStudents ? (
              <div className="p-8 text-center text-gray-600">
                Loading students…
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                No students found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Disco ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Banned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((r) => (
                      <tr key={r.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm">{r.user_id}</td>
                        <td className="px-6 py-3 text-sm font-medium">
                          {r.full_name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {r.email}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {r.disco_user_id ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {r.is_banned ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs">
                              Yes
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <button
                            className={`px-3 py-1 rounded border text-sm ${
                              r.is_banned
                                ? "border-green-600 text-green-700 hover:bg-green-50"
                                : "border-red-600 text-red-700 hover:bg-red-50"
                            }`}
                            onClick={() => toggleBan(r)}
                          >
                            {r.is_banned ? "Unban" : "Ban"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pager */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <button
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <div className="text-sm text-gray-700">Page {page}</div>
              <button
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
                disabled={students.length < limit}
                title={
                  students.length < limit ? "No more results" : "Next page"
                }
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SSM ↔ Pathways */}
      {activeTab === "pathways" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-red-600">
              Assign Pathways to SSM
            </h2>

            <div className="grid gap-3 sm:grid-cols-[minmax(260px,360px)_1fr_auto]">
              <SsmPicker
                label="SSM"
                value={ssmForPathways}
                onSelect={(opt) => {
                  setSsmForPathways(opt);
                  setSsmPathwayIds([]);
                  setNewPathwaysCsv("");
                }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pathway IDs (comma-separated)
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                  placeholder="e.g. 1,2,3"
                  value={newPathwaysCsv}
                  onChange={(e) => setNewPathwaysCsv(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-end">
                <button
                  onClick={loadPathwaysForSsm}
                  className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
                  disabled={loadingPathways || !ssmForPathways}
                >
                  {loadingPathways ? "Loading…" : "Load"}
                </button>
                <button
                  onClick={savePathwaysForSsm}
                  className="px-3 py-2 rounded border border-red-600 text-red-700 text-sm hover:bg-red-50"
                  disabled={loadingPathways || !ssmForPathways}
                >
                  Save
                </button>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-700">
              Current:{" "}
              {ssmPathwayIds.length
                ? ssmPathwayIds.join(", ")
                : "— (none loaded)"}
            </div>
          </div>
        </div>
      )}

      {/* SSM Availability (Admin override) */}
      {activeTab === "availability" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-red-600">
              SSM Availability
            </h2>

            <div className="grid gap-3 sm:grid-cols-[minmax(260px,360px)_auto]">
              <SsmPicker
                label="SSM"
                value={ssmForAvail}
                onSelect={(opt) => {
                  setSsmForAvail(opt);
                  setAvailRows([]);
                }}
              />
              <div className="flex items-end">
                <button
                  onClick={loadAvailability}
                  className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
                  disabled={loadingAvail || !ssmForAvail}
                >
                  {loadingAvail ? "Loading…" : "Load"}
                </button>
              </div>
            </div>

            {/* Add row */}
            <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr_1fr_auto]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of week
                </label>
                <select
                  className="border border-gray-300 rounded-md px-2 py-2 w-full text-black"
                  value={newAvail.dow}
                  onChange={(e) =>
                    setNewAvail((p) => ({ ...p, dow: Number(e.target.value) }))
                  }
                >
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d, i) => (
                      <option key={i} value={i}>{`${i} — ${d}`}</option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start time
                </label>
                <input
                  type="time"
                  className="border border-gray-300 rounded-md px-2 py-2 w-full text-black"
                  value={newAvail.start}
                  onChange={(e) =>
                    setNewAvail((p) => ({ ...p, start: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End time
                </label>
                <input
                  type="time"
                  className="border border-gray-300 rounded-md px-2 py-2 w-full text-black"
                  value={newAvail.end}
                  onChange={(e) =>
                    setNewAvail((p) => ({ ...p, end: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addAvailability}
                  className="px-3 py-2 rounded border border-red-600 text-red-700 text-sm hover:bg-red-50 w-full"
                  disabled={!ssmForAvail}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="mt-6 overflow-x-auto">
              {availRows.length === 0 ? (
                <div className="text-gray-600">No availability rows loaded</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Day
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Start
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        End
                      </th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {availRows.map((r) => (
                      <tr key={r.availability_id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm">
                          {r.availability_id}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {r.day_of_week} — {dayNames[r.day_of_week]}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {r.start_time.slice(0, 5)}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {r.end_time.slice(0, 5)}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <button
                            onClick={() =>
                              deleteAvailability(r.availability_id)
                            }
                            className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-red-600">Reports</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="datetime-local"
                className="border border-gray-300 rounded-md px-3 py-2 text-black"
                value={rStart}
                onChange={(e) => setRStart(e.target.value)}
              />
              <input
                type="datetime-local"
                className="border border-gray-300 rounded-md px-3 py-2 text-black"
                value={rEnd}
                onChange={(e) => setREnd(e.target.value)}
              />
              <button
                onClick={loadReports}
                className="px-3 py-2 rounded border border-red-600 text-red-700 text-sm hover:bg-red-50"
                disabled={loadingReports}
              >
                {loadingReports ? "Loading…" : "Run"}
              </button>
            </div>

            {/* Summary */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
              {summary ? (
                <>
                  <Kpi label="Total bookings" value={summary.total_bookings} />
                  <Kpi label="Cancelled" value={summary.cancelled} />
                  <Kpi label="Completed" value={summary.completed} />
                  <Kpi label="No-shows" value={summary.no_shows} />
                </>
              ) : (
                <div className="text-gray-600">Run a report to see metrics</div>
              )}
            </div>

            {/* By SSM */}
            {bySsm.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2 text-red-600">By SSM</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <Th>SSM</Th>
                        <Th>Total</Th>
                        <Th>Cancelled</Th>
                        <Th>Completed</Th>
                        <Th>No-shows</Th>
                        <Th>No-show rate</Th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bySsm.map((r) => (
                        <tr key={r.ssm_id} className="hover:bg-gray-50">
                          <Td>
                            <div className="font-medium">
                              {r.ssm_name || `#${r.ssm_id}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {r.ssm_email}
                            </div>
                          </Td>
                          <Td>{r.total}</Td>
                          <Td>{r.cancelled}</Td>
                          <Td>{r.completed}</Td>
                          <Td>{r.no_show}</Td>
                          <Td>{(r.no_show_rate * 100).toFixed(1)}%</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* By Pathway */}
            {byPathway.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2 text-red-600">By Pathway</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <Th>Pathway</Th>
                        <Th>Total</Th>
                        <Th>Cancelled</Th>
                        <Th>Completed</Th>
                        <Th>No-shows</Th>
                        <Th>No-show rate</Th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {byPathway.map((r) => (
                        <tr key={r.pathway_id} className="hover:bg-gray-50">
                          <Td>
                            <div className="font-medium">
                              {r.pathway_name || `#${r.pathway_id}`}
                            </div>
                          </Td>
                          <Td>{r.total}</Td>
                          <Td>{r.cancelled}</Td>
                          <Td>{r.completed}</Td>
                          <Td>{r.no_show}</Td>
                          <Td>{(r.no_show_rate * 100).toFixed(1)}%</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-6 py-3 text-sm">{children}</td>;
}
