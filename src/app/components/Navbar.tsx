"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const goHome = () => {
    if (!user) router.push("/");
    else if (user.role === "admin") router.push("/admin");
    else if (user.role === "ssm") router.push("/ssm");
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <button onClick={goHome} className="text-red-700 font-bold">
          Nexus Scheduling
        </button>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Optional role-aware shortcuts */}
              {user.role === "ssm" && pathname !== "/ssm" && (
                <Link
                  href="/ssm"
                  className="text-sm text-gray-700 hover:text-red-600"
                >
                  SSM
                </Link>
              )}
              {user.role === "admin" && pathname !== "/admin" && (
                <Link
                  href="/admin"
                  className="text-sm text-gray-700 hover:text-red-600"
                >
                  Admin
                </Link>
              )}

              <span className="hidden sm:block text-sm text-gray-600">
                {user.full_name}
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="px-3 py-1.5 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-gray-700 hover:text-red-600"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
