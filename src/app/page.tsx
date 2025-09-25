// frontend/src/app/page.tsx

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const discoUserId = params.get("disco_user_id");

  useEffect(() => {
    if (loading) return;

    // 1) If coming from LMS with a disco_user_id, send to student view
    if (discoUserId) {
      router.replace(
        `/student?disco_user_id=${encodeURIComponent(discoUserId)}`
      );
      return;
    }

    // 2) If authenticated, route to their dashboard
    if (user) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "ssm") router.replace("/ssm");
      else router.replace("/"); // fallback if an unexpected role sneaks in
    }
  }, [loading, discoUserId, user, router]);

  if (loading || discoUserId || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Nexus Scheduling...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-red-700">
              Nexus Scheduling
            </h1>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                {!user && (
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                )}
                <a
                  href="#features"
                  className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  How It Works
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Simplify Your{" "}
            <span className="block text-red-600">Student Sessions</span>
          </h1>
          <p className="mt-3 max-w-3xl mx-auto text-gray-600 md:text-xl">
            Streamline 1:1 sessions between students and SSMs with our intuitive
            scheduling platform.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a
              href="#features"
              className="px-8 py-3 text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Learn More
            </a>
            {!user && (
              <Link
                href="/login"
                className="px-8 py-3 text-base font-medium rounded-md text-red-600 bg-white hover:bg-gray-50"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-red-600 tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need for effective sessions
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-red-500 rounded-md shadow-lg">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Easy Scheduling
                    </h3>
                    <p className="mt-5 text-base text-gray-600">
                      Students can easily book sessions based on SSM
                      availability without back-and-forth emails.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-red-500 rounded-md shadow-lg">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Availability Management
                    </h3>
                    <p className="mt-5 text-base text-gray-600">
                      SSMs can set and manage their availability in one place,
                      with automatic calendar updates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-red-500 rounded-md shadow-lg">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Seamless Integration
                    </h3>
                    <p className="mt-5 text-base text-gray-600">
                      Works with your existing LMS through disco_user_id for a
                      frictionless experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-red-600 tracking-wide uppercase">
              How It Works
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Simple steps for everyone
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Student Step */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-500 text-white text-xl font-bold">
                  1
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  For Students
                </h3>
                <p className="mt-2 text-base text-gray-600">
                  Access your booking page through your LMS with your
                  disco_user_id.
                </p>
                <div className="mt-4 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                  /student?disco_user_id=your_id
                </div>
              </div>

              {/* SSM Step */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-500 text-white text-xl font-bold">
                  2
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  For SSMs
                </h3>
                <p className="mt-2 text-base text-gray-600">
                  Set your availability and manage your session bookings through
                  your dashboard.
                </p>
                <div className="mt-4">
                  <a
                    href="/login"
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Login to get started →
                  </a>
                </div>
              </div>

              {/* Admin Step */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-500 text-white text-xl font-bold">
                  3
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  For Admins
                </h3>
                <p className="mt-2 text-base text-gray-600">
                  Oversee the scheduling system, manage users, and generate
                  reports.
                </p>
                <div className="mt-4">
                  <a
                    href="/login"
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Access admin dashboard →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!user && (
        <div className="bg-red-700">
          <div className="max-w-7xl mx-auto py-12 px-4 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              <span className="block">Ready to get started?</span>
              <span className="block text-red-200">
                Sign in to your account today.
              </span>
            </h2>
            <div className="mt-8 lg:mt-0">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-3 rounded-md text-red-600 bg-white hover:bg-red-50"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 lg:py-16 lg:px-8 text-center">
          <p className="text-base text-gray-400">
            &copy; {new Date().getFullYear()} Nexus Scheduling. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
