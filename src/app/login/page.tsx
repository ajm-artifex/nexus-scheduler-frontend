// frontend/src/app/login/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ssm" | "admin">("ssm");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const { user, login } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "ssm") {
        router.push("/ssm");
      }
    }
  }, [user, router]);

  function validateForm() {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!validateForm()) return;

    setLoading(true);
    try {
      const path = role === "admin" ? "/auth/login/admin" : "/auth/login/ssm";
      const res = await apiPost<{
        access_token: string;
        user: { role: "admin" | "ssm" };
      }>(path, {
        email,
        password,
      });
      // Persist token (your useAuth should store it; if not, also localStorage.setItem)
      login(res.access_token);
      addToast("Logged in successfully", "success");
      // Role-based redirect
      if (res.user?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/ssm");
      }
    } catch (e: any) {
      addToast(
        e?.message ?? "Login failed. Please check your credentials.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-gray-600">Welcome back to Nexus Scheduling</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              I am a
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md border ${
                  role === "ssm"
                    ? "bg-red-100 border-red-500 text-red-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                } transition-colors`}
                onClick={() => setRole("ssm")}
              >
                SSM
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md border ${
                  role === "admin"
                    ? "bg-red-100 border-red-500 text-red-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                } transition-colors`}
                onClick={() => setRole("admin")}
              >
                Administrator
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`appearance-none relative block w-full px-3 py-2 border ${
                errors.email ? "border-red-300" : "border-gray-300"
              } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={`appearance-none relative block w-full px-3 py-2 border ${
                errors.password ? "border-red-300" : "border-gray-300"
              } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors({ ...errors, password: undefined });
              }}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-red-600 hover:text-red-500"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                New to Nexus Scheduling?
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/contact"
              className="font-medium text-red-600 hover:text-red-500"
            >
              Contact an administrator for access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
