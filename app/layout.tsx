import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import NavBar from "@/components/NavBar";
import FeedbackButton from "@/components/FeedbackButton";

export const metadata: Metadata = {
  title: "LLD Hub — Low Level Design Interview Practice",
  description:
    "Practice low-level design interview questions with AI-powered evaluation. OOP, SOLID principles, design patterns, and real LLD problems asked at Amazon, Flipkart, Swiggy, and more.",
  keywords: [
    "lld interview questions",
    "low level design interview",
    "lld practice problems",
    "system design lld",
    "object oriented design interview",
    "design patterns interview",
    "SOLID principles interview",
    "lld coding questions",
    "amazon lld interview",
    "flipkart low level design",
  ],
  metadataBase: new URL("https://lldhub.in"),
  openGraph: {
    title: "LLD Hub — Low Level Design Interview Practice",
    description:
      "AI-scored LLD problems. OOP, SOLID, design patterns — practice like a real interview.",
    url: "https://lldhub.in",
    siteName: "LLD Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LLD Hub — Low Level Design Interview Practice",
    description:
      "AI-scored LLD problems. OOP, SOLID, design patterns — practice like a real interview.",
  },
  alternates: {
    canonical: "https://lldhub.in",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#0f0f0f] text-gray-100 antialiased">
        <Providers>
          <NavBar />
          {/* More horizontal inset than the nav so body content isn’t flush with the header gutter */}
          <main className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 py-6 sm:py-8">{children}</main>
          <FeedbackButton />
        </Providers>
      </body>
    </html>
  );
}
