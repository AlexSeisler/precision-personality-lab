import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AuthRedirectWatcher } from "@/components/system/AuthRedirectWatcher";
import { SpeedInsights } from "@vercel/speed-insights/next"; // ✅ Added import
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
          <AppShell>{children}</AppShell>
        </AuthProvider>

        {/* ✅ Add Vercel Speed Insights tracking (must be inside <body>) */}
        <SpeedInsights />
      </body>
    </html>
  );
}
