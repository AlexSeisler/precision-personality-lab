import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AuthRedirectWatcher } from "@/components/system/AuthRedirectWatcher";
import { AuthGate } from "@/components/system/AuthGate"; // ✅ NEW import
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Precision + Personality Lab | GenAI Parameter Explorer",
  description:
    "Experimental console for exploring and visualizing LLM behavior under different parameters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 👇 Handles auth redirect watching */}
        <AuthRedirectWatcher />

        <AuthProvider>
          <AuthGate>
            <AppShell>{children}</AppShell>
          </AuthGate>
        </AuthProvider>

        {/* ✅ Vercel Speed Insights tracking */}
        <SpeedInsights />
      </body>
    </html>
  );
}
