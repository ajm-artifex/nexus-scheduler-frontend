"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export default function GoogleConnectPage() {
  const [authUrl, setAuthUrl] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    // In a real app, get ssm_id from session/user profile. For demo use query param.
    const ssmId =
      new URLSearchParams(window.location.search).get("ssm_id") || "";
    if (!ssmId) {
      setStatus("Missing ssm_id");
      return;
    }
    apiGet<{ auth_url: string; state: string }>(
      `/integrations/google/start?ssm_id=${ssmId}`
    )
      .then((r) => setAuthUrl(r.auth_url))
      .catch((e) => setStatus(e.message));
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Connect Google Calendar</h1>
      {status && <div className="text-sm text-red-600">{status}</div>}
      <a
        href={authUrl || "#"}
        className={`inline-block px-4 py-2 rounded text-white ${
          authUrl ? "bg-green-600" : "bg-gray-400 cursor-not-allowed"
        }`}
        onClick={(e) => {
          if (!authUrl) e.preventDefault();
        }}
      >
        {authUrl ? "Connect with Google" : "Loading..."}
      </a>
    </div>
  );
}
