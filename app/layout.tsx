import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "LLD Hub — Master Low-Level Design",
  description: "Practice LLD problems with AI-powered evaluation. Build real design thinking.",
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
        </Providers>
      </body>
    </html>
  );
}
