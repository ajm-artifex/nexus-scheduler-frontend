// frontend/src/app/components/GoogleLoginButton.tsx
"use client";
const API_BASE =
  (typeof process !== "undefined" &&
    (process as unknown as { env?: Record<string, string | undefined> })?.env
      ?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:8000";

export default function GoogleLoginButton({
  redirectTo,
  label = "Continue with Google",
}: {
  redirectTo?: string;
  label?: string;
}) {
  const href =
    `${API_BASE}/auth/google/login` +
    (redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : "");
  return (
    <a
      href={href}
      className="inline-flex items-center bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" aria-hidden>
        <path
          fill="#FFC107"
          d="M43.6 20.5h-1.8V20H24v8h11.3C33.9 31.7 29.4 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.7 6.3 29.1 4 24 4 12.4 4 3 13.4 3 25s9.4 21 21 21 21-9.4 21-21c0-1.5-.2-3-.4-4.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.8 16.4 19.1 14 24 14c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.7 6.3 29.1 4 24 4 16.1 4 9.3 8.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 46c5.3 0 10.1-2 13.7-5.3l-6.3-5.2C29.4 37.9 26.9 39 24 39c-5.3 0-9.8-3.4-11.4-8l-6.5 5C9.1 41.9 16 46 24 46z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.7-4.7 6.5-8.8 6.9l6.3 5.2C36.3 37.7 39 31.9 39 25c0-1.5-.1-3-.4-4.5z"
        />
      </svg>
      {label}
    </a>
  );
}
