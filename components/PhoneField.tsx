"use client";

import { useState } from "react";

export default function PhoneField({
  initialPhone = "",
  onSaved,
  submitLabel = "Save number",
}: {
  initialPhone?: string;
  onSaved: () => void | Promise<void>;
  submitLabel?: string;
}) {
  const [phone, setPhone] = useState(initialPhone.replace(/\D/g, "").slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/user/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save number");
        return;
      }
      await onSaved();
    } catch {
      setError("Could not save number. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Mobile number</label>
        <div className="flex items-center bg-gray-900 border border-gray-700 rounded-xl focus-within:border-yellow-400/60 focus-within:ring-1 focus-within:ring-yellow-400/20">
          <span className="pl-4 pr-2 text-sm text-gray-500 shrink-0">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="9876543210"
            data-testid="phone-input"
            className="w-full bg-transparent py-3 pr-4 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || phone.length !== 10}
        data-testid="phone-save"
        className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm py-2.5 rounded-xl transition-colors"
      >
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
