// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/lib/toast";
import Navbar from "@/app/components/Navbar"; // keep this path if your file is here

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexus Scheduling",
  description: "Streamline 1:1 sessions between students and SSMs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
