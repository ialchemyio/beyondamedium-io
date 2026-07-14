import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://beyondamedium.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Beyond A Medium — AI Website Builder",
    template: "%s — Beyond A Medium",
  },
  description:
    "Build stunning websites with AI. Prompt to generate, drag-and-drop to design, one click to deploy — with backend, auth, and hosting built in.",
  keywords: [
    "AI website builder", "prompt to website", "no-code website", "AI web design",
    "landing page builder", "deploy website", "Beyond A Medium", "BAM",
  ],
  applicationName: "Beyond A Medium",
  authors: [{ name: "Beyond A Medium" }],
  creator: "Beyond A Medium",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Beyond A Medium",
    title: "Beyond A Medium — AI Website Builder",
    description:
      "Prompt to generate. Canvas to design. One click to deploy. The AI operating system for building websites.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Beyond A Medium — AI Website Builder",
    description:
      "Prompt to generate. Canvas to design. One click to deploy.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-[#06080d] text-white antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
