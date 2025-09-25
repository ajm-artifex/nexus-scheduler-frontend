"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

export default function EmbedPage() {
  const [status, setStatus] = useState<string>("Authenticating...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    disco_user_id: string;
    pathway_id: number;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const disco_user_id = params.get("disco_user_id");
    const pathway_id = params.get("pathway_id");
    const ts = params.get("ts");
    const nonce = params.get("nonce");
    const sig = params.get("sig");

    async function run() {
      if (!disco_user_id || !pathway_id || !ts || !nonce || !sig) {
        setError(
          "Missing authentication parameters. Please ensure you're accessing this page through your learning platform."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setStatus("Verifying your credentials...");

        // Simulate a brief delay to show the loading state
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await apiPost("/sso/exchange", {
          disco_user_id,
          pathway_id: Number(pathway_id),
          ts: Number(ts),
          nonce,
          sig,
        });

        setStatus("Authentication successful!");
        setSuccess(true);
        setUserInfo({ disco_user_id, pathway_id: Number(pathway_id) });

        // Store authentication in session storage for the booking page
        sessionStorage.setItem("sso_authenticated", "true");
        sessionStorage.setItem("disco_user_id", disco_user_id);
        sessionStorage.setItem("pathway_id", pathway_id);
      } catch (e: any) {
        setError(
          e.message ||
            "Authentication failed. Please try again or contact support."
        );
        setStatus("Authentication failed");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  const handleBookNow = () => {
    if (userInfo) {
      router.push(
        `/student?disco_user_id=${userInfo.disco_user_id}&pathway_id=${userInfo.pathway_id}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            ) : success ? (
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            ) : error ? (
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {loading
              ? "Authenticating"
              : success
              ? "Success!"
              : "Authentication"}
          </h1>

          <p
            className={`text-sm ${
              loading
                ? "text-gray-600"
                : success
                ? "text-green-600"
                : error
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {status}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && userInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm mb-3">
              You have been successfully authenticated. You can now book
              sessions with your SSM.
            </p>
            <div className="text-xs text-green-600 space-y-1">
              <div>User ID: {userInfo.disco_user_id}</div>
              <div>Pathway: {userInfo.pathway_id}</div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {success ? (
            <button
              onClick={handleBookNow}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Book a Session Now
            </button>
          ) : error ? (
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          ) : null}

          <div className="text-center">
            <p className="text-xs text-gray-500">
              {loading
                ? "This may take a few moments..."
                : "Need help? Contact your platform administrator."}
            </p>
          </div>
        </div>

        {loading && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-red-600 h-1.5 rounded-full animate-pulse"
                style={{ width: "75%" }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
