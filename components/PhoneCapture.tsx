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

  useEffect(() => {
    if (status !== "authenticated") return;
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;

    fetch("/api/user/phone")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
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
          <PhoneField
            initialPhone={phone}
            onSaved={() => {
              setOpen(false);
              window.dispatchEvent(new Event("phone-saved"));
            }}
          />
        </div>
      </div>
    </div>
  );
}
