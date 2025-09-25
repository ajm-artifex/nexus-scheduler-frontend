"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navigationItems = [
    { name: "Home", href: "/", icon: "🏠" },
    { name: "Login", href: "/login", icon: "🔐", auth: false },
    { name: "SSM Dashboard", href: "/ssm", icon: "👨‍💼", auth: "ssm" },
    { name: "Admin", href: "/admin", icon: "⚙️", auth: "admin" },
    { name: "Embed", href: "/embed", icon: "📋" },
  ];

  const filteredNavigation = navigationItems.filter((item) => {
    if (!item.auth) return true;
    if (item.auth === true) return user; // Show if authenticated
    return user?.role === item.auth; // Show if specific role
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          {/* Logo/Brand */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="text-xl font-bold text-red-700">
              Nexus Scheduling
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-4 py-4 border-b">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-medium">
                      {user.full_name?.[0]?.toUpperCase() ||
                        user.email?.[0]?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-grow px-4 mt-6">
            <nav className="flex-1 space-y-2">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-red-100 text-red-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Logout Button */}
          {user && (
            <div className="flex-shrink-0 p-4 border-t">
              <button
                onClick={() => logout()}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <span className="mr-3 text-lg">🚪</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto">
          {/* Mobile header */}
          <div className="flex items-center justify-between px-4">
            <div className="text-xl font-bold text-red-700">
              Nexus Scheduling
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-4 py-4 border-b">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-medium">
                      {user.full_name?.[0]?.toUpperCase() ||
                        user.email?.[0]?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 mt-6 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-red-100 text-red-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Mobile Logout */}
          {user && (
            <div className="p-4 border-t">
              <button
                onClick={() => logout()}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <span className="mr-3 text-lg">🚪</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Mobile header bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
          >
            <span className="text-2xl">☰</span>
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <div className="text-lg font-bold text-red-700">
                Nexus Scheduling
              </div>
            </div>
            {user && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center ml-2">
                  <span className="text-red-600 text-sm font-medium">
                    {user.full_name?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      "U"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="relative flex-1 overflow-y-auto focus:outline-none p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
