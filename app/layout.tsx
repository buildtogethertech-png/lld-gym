import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import NavBar from "@/components/NavBar";
import FeedbackButton from "@/components/FeedbackButton";
import UTMCapture from "@/components/UTMCapture";

export const metadata: Metadata = {
  title: "Practice Low Level Design Problems | LLDHub",
  description:
    "Practice low level design interview problems on LLDHub — in-browser code editor with AI evaluation. 20+ LLD problems — parking lot, ride sharing, chess game and more. Asked at Amazon, Flipkart, Swiggy, Uber.",
  keywords: [
    "lldhub",
    "lld hub",
    "practice low level design",
    "low level design problems",
    "lld practice problems",
    "lld interview questions",
    "low level design interview",
    "system design lld",
    "object oriented design interview",
    "design patterns interview",
    "SOLID principles interview",
    "lld coding questions",
    "amazon lld interview",
    "flipkart low level design",
    "low level design questions java",
  ],
  metadataBase: new URL("https://lldhub.in"),
  openGraph: {
    title: "Practice Low Level Design Problems | LLDHub",
    description:
      "20+ LLD problems with AI evaluation. Practice parking lot, ride sharing, chess game and more — asked at top product companies.",
    url: "https://lldhub.in",
    siteName: "LLDHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Practice Low Level Design Problems | LLDHub",
    description:
      "20+ LLD problems with AI evaluation. Practice parking lot, ride sharing, chess game and more — asked at top product companies.",
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
          <Suspense><UTMCapture /></Suspense>
          <NavBar />
          {/* More horizontal inset than the nav so body content isn’t flush with the header gutter */}
          <main className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 py-6 sm:py-8">{children}</main>
          <FeedbackButton />
        </Providers>
      </body>
    </html>
  );
}
