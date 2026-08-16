"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import PhoneField from "@/components/PhoneField";
import { displayPhone } from "@/lib/phone";

const SKIP_PATHS = ["/login", "/register", "/unsubscribe"];

export default function PhoneCapture() {
  const { status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [communityUrl, setCommunityUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;

    fetch("/api/user/phone")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        if (d.communityUrl) setCommunityUrl(d.communityUrl);
        if (d.needsPhone) {
          setPhone(displayPhone(d.phone));
          setOpen(true);
        } else {
          setOpen(false);
        }
      })
      .catch(() => {});
  }, [status, pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#161616] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <p className="font-semibold text-gray-100 text-sm">Finish setting up your account</p>
          <p className="text-xs text-gray-500 mt-1">
            Add a mobile number to complete your account.
          </p>
        </div>

        <div className="px-5 py-4">
          {saved ? (
            <div className="space-y-3">
              <p className="text-sm text-green-400">Number saved.</p>
              {communityUrl && (
                <a
                  href={communityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-[#25D366] hover:bg-[#1ebe5d] text-black font-semibold text-sm py-2.5 rounded-xl transition-colors"
                >
                  Join the LLDHub WhatsApp community
                </a>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-full text-xs text-gray-500 hover:text-gray-300 py-1"
              >
                Continue
              </button>
            </div>
          ) : (
            <PhoneField
              initialPhone={phone}
              onSaved={async () => {
                const d = await fetch("/api/user/phone").then((r) => r.json()).catch(() => null);
                if (d?.communityUrl) setCommunityUrl(d.communityUrl);
                setSaved(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
