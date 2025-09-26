// frontend/src/app/components/LogoutButton.tsx
"use client";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function LogoutButton() {
  const doLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/google/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };
  return (
    <button
      onClick={doLogout}
      className="px-3 py-2 rounded-md text-sm bg-gray-100 hover:bg-gray-200"
    >
      Logout
    </button>
  );
}
