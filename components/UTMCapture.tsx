"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "lldhub_utm";
const VISIT_SESSION_KEY = "lldhub_visit_logged";

export function getStoredUTM(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function UTMCapture() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session } = useSession();

  // Save UTM params from URL to localStorage (first-touch: never overwrite)
  useEffect(() => {
    const source = searchParams.get("utm_source");
    const medium = searchParams.get("utm_medium");
    const campaign = searchParams.get("utm_campaign");

    if (!source && !medium && !campaign) return;

    // Log every visit with UTMs — one entry per browser session
    const alreadyLogged = sessionStorage.getItem(VISIT_SESSION_KEY);
    if (!alreadyLogged) {
      fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utmSource: source,
          utmMedium: medium,
          utmCampaign: campaign,
          landingPage: pathname,
        }),
      }).catch(() => {});
      sessionStorage.setItem(VISIT_SESSION_KEY, "1");
    }

    // Save to localStorage for attribution on signup (first-touch only)
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ utmSource: source ?? undefined, utmMedium: medium ?? undefined, utmCampaign: campaign ?? undefined })
    );
  }, [searchParams, pathname]);

  // For Google OAuth users: once session exists, flush UTMs to DB
  useEffect(() => {
    if (!session?.user?.email) return;

    const utm = getStoredUTM();
    if (!utm.utmSource && !utm.utmMedium && !utm.utmCampaign) return;

    const saved = localStorage.getItem("lldhub_utm_saved");
    if (saved) return;

    fetch("/api/user/save-utm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(utm),
    })
      .then((r) => { if (r.ok) localStorage.setItem("lldhub_utm_saved", "1"); })
      .catch(() => {});
  }, [session]);

  return null;
}
