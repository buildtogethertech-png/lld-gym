"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function NavBar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-800 sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur">
      <div className="w-full h-14 flex items-center justify-between px-3 sm:px-4 lg:px-5">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-yellow-400">⚡</span>
          <span>LLDHub</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-200 transition-colors hidden sm:block">
            Problems
          </Link>
          <Link href="/learn" className="text-sm text-gray-400 hover:text-gray-200 transition-colors hidden sm:block">
            Learn
          </Link>
          <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-200 transition-colors hidden sm:block">
            Blog
          </Link>
          <Link href="/uml-practice/my-diagrams" className="text-sm text-gray-400 hover:text-gray-200 transition-colors hidden sm:block">
            UML
          </Link>
          {session && (
            <Link
              href="/submissions"
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors hidden sm:block"
            >
              Submissions
            </Link>
          )}
          <Link href="/pricing" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors hidden sm:block font-medium">
            Pricing
          </Link>
          <a
            href="https://discord.gg/eGfYx8YHy"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-lg border border-[#5865f2]/35 bg-[#5865f2]/10 px-2.5 py-1.5 text-xs font-semibold text-[#aab2ff] transition-colors hover:border-[#5865f2]/70 hover:bg-[#5865f2]/20 hover:text-white sm:flex"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.54 4.54A16.45 16.45 0 0 0 15.5 3.3l-.5 1a15.25 15.25 0 0 0-6 0l-.5-1a16.36 16.36 0 0 0-4.05 1.25C1.9 8.35 1.2 12.06 1.55 15.72a16.59 16.59 0 0 0 4.97 2.5l1.2-1.62a9.55 9.55 0 0 1-1.88-.9l.45-.35c3.63 1.67 7.77 1.67 11.36 0l.45.35c-.6.35-1.23.65-1.88.9l1.2 1.62a16.46 16.46 0 0 0 4.98-2.5c.42-4.24-.72-7.92-2.86-11.18ZM8.85 13.47c-1.1 0-2-1-2-2.24s.88-2.24 2-2.24c1.12 0 2.02 1 2 2.24 0 1.24-.88 2.24-2 2.24Zm6.3 0c-1.1 0-2-1-2-2.24s.88-2.24 2-2.24c1.12 0 2.02 1 2 2.24 0 1.24-.88 2.24-2 2.24Z" />
            </svg>
            Community
          </a>

          {status === "loading" ? (
            <div className="w-7 h-7 rounded-full bg-gray-800 animate-pulse" />
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-semibold text-xs uppercase">
                  {(session.user?.name ?? session.user?.email ?? "U")[0]}
                </div>
                <svg className={`w-3 h-3 text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-xs font-medium text-gray-200 truncate">
                      {session.user?.name ?? "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                  </div>
                  <Link
                    href="/submissions"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    My submissions
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
