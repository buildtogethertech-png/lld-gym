"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SHOW_USER_OWN_API_KEY_UI } from "@/lib/features";

interface ModelOption { id: string; name: string; }
type TestStatus = "idle" | "testing" | "ok" | "fail";
interface ModelTestResult { status: TestStatus; error?: string; }

const PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    badge: "FREE · RECOMMENDED",
    badgeColor: "bg-green-500/20 text-green-400 border-green-500/30",
    keyPrefix: "gsk_...",
    keyHint: "Starts with gsk_",
    color: "from-orange-500/10 to-yellow-500/10 border-orange-400/40",
    recommended: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#F97316" strokeWidth="2"/>
        <path d="M8 12h8M12 8v8" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    steps: [
      { step: "1", text: "Go to", link: { label: "console.groq.com/keys", url: "https://console.groq.com/keys" } },
      { step: "2", text: "Sign up free (no credit card) → click \"Create API Key\"" },
      { step: "3", text: "Copy the key (starts with gsk_) and paste below" },
    ],
    defaultModel: "llama-3.3-70b-versatile",
    note: "14,400 req/day free • Llama 3.3 70B • Blazing fast — best for students",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "FREE",
    badgeColor: "bg-green-500/20 text-green-400 border-green-500/30",
    keyPrefix: "AIza...",
    keyHint: "Starts with AIza",
    color: "from-blue-500/10 to-green-500/10 border-blue-500/20",
    recommended: false,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    steps: [
      { step: "1", text: "Go to", link: { label: "aistudio.google.com", url: "https://aistudio.google.com/app/apikey" } },
      { step: "2", text: "Click \"Create API key\" — takes 10 seconds, no credit card" },
      { step: "3", text: "Copy the key (starts with AIza...) and paste below" },
    ],
    defaultModel: "gemini-1.5-flash",
    note: "1,500 req/day free — completely free forever",
  },
  {
    id: "openai",
    name: "OpenAI",
    badge: "PAID",
    badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    keyPrefix: "sk-...",
    keyHint: "Starts with sk- (not sk-ant-)",
    color: "from-gray-500/10 to-gray-500/5 border-gray-700",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
      </svg>
    ),
    steps: [
      { step: "1", text: "Go to", link: { label: "platform.openai.com/api-keys", url: "https://platform.openai.com/api-keys" } },
      { step: "2", text: "Add billing → Create new secret key" },
      { step: "3", text: "Copy key (starts with sk-) and paste below" },
    ],
    defaultModel: "gpt-4o-mini",
    note: "~$0.002 per evaluation with gpt-4o-mini",
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    badge: "PAID",
    badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    keyPrefix: "sk-ant-...",
    keyHint: "Starts with sk-ant-",
    color: "from-gray-500/10 to-gray-500/5 border-gray-700",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 20h3.5l1.5-4h6l1.5 4H20L12 2zm-2 11l2-6 2 6H10z" fill="#CC785C"/>
      </svg>
    ),
    steps: [
      { step: "1", text: "Go to", link: { label: "console.anthropic.com/keys", url: "https://console.anthropic.com/settings/keys" } },
      { step: "2", text: "Add billing → Create API key" },
      { step: "3", text: "Copy key (starts with sk-ant-) and paste below" },
    ],
    defaultModel: "claude-3-5-sonnet-20241022",
    note: "~$0.003 per evaluation with claude-3-5-sonnet",
  },
];

function SettingsPageInner() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"tutorial" | "key">(
    searchParams.get("tab") === "key" ? "key" : "tutorial"
  );
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [models, setModels] = useState<ModelOption[]>([]);
  const [provider, setProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelError, setModelError] = useState("");
  const [savingModel, setSavingModel] = useState(false);
  const [modelSaved, setModelSaved] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, ModelTestResult>>({});
  const [testingAll, setTestingAll] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !SHOW_USER_OWN_API_KEY_UI) return;
    fetch("/api/user/apikey")
      .then((r) => r.json())
      .then((d) => {
        setHasKey(d.hasKey);
        setMaskedKey(d.masked);
        if (d.hasKey) setActiveTab("key");
      });
  }, [status]);

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);
    setModels([]);
    setSelectedModel("");

    const res = await fetch("/api/user/apikey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    setSaving(false);
    if (res.ok) {
      setHasKey(true);
      setMaskedKey(apiKey.slice(0, 8) + "••••••••" + apiKey.slice(-4));
      setApiKey("");
      setMessage({ text: "Key saved! Now fetch your available models below.", type: "success" });
    } else {
      setMessage({ text: "Failed to save key", type: "error" });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch("/api/user/apikey", { method: "DELETE" });
    setDeleting(false);
    setHasKey(false);
    setMaskedKey(null);
    setModels([]);
    setSelectedModel("");
    setProvider("");
    setMessage({ text: "API key removed", type: "success" });
  }

  async function handleFetchModels() {
    setFetchingModels(true);
    setModelError("");
    const res = await fetch("/api/user/models");
    const data = await res.json();
    setFetchingModels(false);
    if (!res.ok) { setModelError(data.error ?? "Failed"); return; }
    setModels(data.models ?? []);
    setProvider(data.provider ?? "");
    if (data.savedModel) setSelectedModel(data.savedModel);
    else if (data.models?.length > 0) setSelectedModel(data.models[0].id);
  }

  async function handleSaveModel() {
    const model = selectedModel === "__custom__" ? customModel.trim() : selectedModel.trim();
    if (!model) return;
    setSavingModel(true);
    await fetch("/api/user/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });
    setSavingModel(false);
    setModelSaved(true);
    setTimeout(() => setModelSaved(false), 2000);
  }

  async function testModel(modelId: string) {
    setTestResults((prev) => ({ ...prev, [modelId]: { status: "testing" } }));
    const res = await fetch("/api/user/test-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelId }),
    });
    const data = await res.json();
    setTestResults((prev) => ({
      ...prev,
      [modelId]: { status: data.ok ? "ok" : "fail", error: data.error },
    }));
  }

  async function testAllModels() {
    setTestingAll(true);
    setTestResults({});
    for (const m of models) {
      await testModel(m.id);
    }
    setTestingAll(false);
  }

  if (status === "loading") return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading…</div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Problems
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-gray-500 text-sm mb-6">
        Signed in as <span className="text-gray-300">{session?.user?.email}</span>
      </p>

      {!SHOW_USER_OWN_API_KEY_UI && (
        <p className="text-gray-400 text-sm mb-6">
          AI evaluation uses the platform key. You don&apos;t need to add your own API key.
        </p>
      )}

      {/* Advanced toggle — only shows when user needs it */}
      {SHOW_USER_OWN_API_KEY_UI && (
      <div className="mb-6">
        <button
          onClick={() => setActiveTab(activeTab === "key" ? "tutorial" : "key")}
          className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          <svg className={`w-3 h-3 transition-transform ${activeTab === "key" ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {activeTab === "key" ? "Hide advanced settings" : "Advanced — use your own API key"}
        </button>
      </div>
      )}

      {/* TUTORIAL TAB — shown by default */}
      {SHOW_USER_OWN_API_KEY_UI && activeTab === "tutorial" && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm mb-2">
            If you want to use your own AI API key instead of the platform, here are the supported providers — two are completely free:
          </p>

          {PROVIDERS.map((p) => (
            <div
              key={p.id}
              className={`relative bg-gradient-to-br ${p.color} border rounded-xl p-5 ${p.recommended ? "ring-1 ring-orange-400/30" : ""}`}
            >
              {p.recommended && (
                <div className="absolute -top-px right-4 bg-orange-500 text-white text-xs font-bold px-3 py-0.5 rounded-b-lg tracking-wide">
                  ⭐ RECOMMENDED
                </div>
              )}
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {p.icon}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{p.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{p.note}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-500 bg-gray-800/50 px-2 py-1 rounded-lg">
                  {p.keyHint}
                </span>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {p.steps.map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-400 shrink-0 mt-0.5">
                      {s.step}
                    </span>
                    <p className="text-sm text-gray-300">
                      {s.text}{" "}
                      {s.link && (
                        <a
                          href={s.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-400 hover:text-yellow-300 underline underline-offset-2"
                        >
                          {s.link.label}
                        </a>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveTab("key")}
                className="mt-4 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Got the key? Paste it here →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KEY TAB */}
      {SHOW_USER_OWN_API_KEY_UI && activeTab === "key" && (
        <div className="space-y-5">
          {/* Current key */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-1">API Key</h2>
            <p className="text-sm text-gray-500 mb-5">
              Auto-detected: <span className="text-gray-300">AIza...</span> = Gemini &nbsp;·&nbsp;
              <span className="text-gray-300">gsk_...</span> = Groq &nbsp;·&nbsp;
              <span className="text-gray-300">sk-...</span> = OpenAI &nbsp;·&nbsp;
              <span className="text-gray-300">sk-ant-...</span> = Anthropic
            </p>

            {hasKey && maskedKey && (
              <div className="flex items-center justify-between bg-green-900/20 border border-green-800/40 rounded-lg px-4 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm text-green-300 font-mono">{maskedKey}</span>
                  {provider && (
                    <span className="text-xs text-gray-500 capitalize">({provider})</span>
                  )}
                </div>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  {deleting ? "Removing…" : "Remove"}
                </button>
              </div>
            )}

            <form onSubmit={handleSaveKey} className="space-y-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasKey ? "Paste new key to replace" : "Paste your API key here…"}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/20 transition-colors"
              />
              <button
                type="submit"
                disabled={saving || !apiKey.trim()}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? "Saving…" : hasKey ? "Update Key" : "Save Key"}
              </button>
            </form>

            {message && (
              <p className={`mt-3 text-sm text-center ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
                {message.text}
              </p>
            )}

            {!hasKey && (
              <button
                onClick={() => setActiveTab("tutorial")}
                className="mt-3 w-full text-center text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Don&apos;t have a key? See how to get one free →
              </button>
            )}
          </div>

          {/* Model picker */}
          {hasKey && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold">AI Model</h2>
                {selectedModel && selectedModel !== "__custom__" && (
                  <span className="text-xs font-mono text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
                    {selectedModel}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Fetch models available on your key and pick one.
              </p>

              <button
                onClick={handleFetchModels}
                disabled={fetchingModels}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border border-gray-700 bg-gray-950 text-gray-300 hover:border-gray-500 hover:text-white disabled:opacity-50 transition-colors mb-4"
              >
                {fetchingModels ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Fetching…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    {models.length > 0 ? "Refresh Models" : "Fetch Available Models"}
                  </>
                )}
              </button>

              {modelError && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
                  {modelError}
                </p>
              )}

              {models.length > 0 && (
                <div className="space-y-3">
                  {/* Test all button */}
                  <button
                    onClick={testAllModels}
                    disabled={testingAll}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs border border-gray-700 bg-gray-950 text-gray-400 hover:border-gray-500 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    {testingAll ? (
                      <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Testing all…</>
                    ) : "⚡ Test all models — see which ones work"}
                  </button>

                  <div className="rounded-xl border border-gray-800 divide-y divide-gray-800 overflow-hidden">
                    {models.map((m) => {
                      const t = testResults[m.id];
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedModel(m.id)}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            selectedModel === m.id ? "bg-yellow-400/5" : "hover:bg-gray-800/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="model"
                            value={m.id}
                            checked={selectedModel === m.id}
                            onChange={() => setSelectedModel(m.id)}
                            className="accent-yellow-400 shrink-0"
                          />
                          <span className="text-sm font-mono text-gray-300 flex-1 truncate">{m.id}</span>

                          {/* Test status badge */}
                          {t?.status === "testing" && (
                            <svg className="w-4 h-4 animate-spin text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          )}
                          {t?.status === "ok" && (
                            <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full shrink-0">✓ works</span>
                          )}
                          {t?.status === "fail" && (
                            <span
                              className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full shrink-0 cursor-help"
                              title={t.error ?? "Failed"}
                            >✗ fail</span>
                          )}
                          {(!t || t.status === "idle") && (
                            <button
                              onClick={(e) => { e.stopPropagation(); testModel(m.id); }}
                              className="text-xs text-gray-600 hover:text-gray-300 transition-colors shrink-0"
                            >
                              test
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Manual entry */}
                    <div
                      onClick={() => setSelectedModel("__custom__")}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        selectedModel === "__custom__" ? "bg-yellow-400/5" : "hover:bg-gray-800/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="model"
                        value="__custom__"
                        checked={selectedModel === "__custom__"}
                        onChange={() => setSelectedModel("__custom__")}
                        className="accent-yellow-400 shrink-0"
                      />
                      <span className="text-sm text-gray-500">Enter model name manually…</span>
                    </div>
                  </div>

                  {selectedModel === "__custom__" && (
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="e.g. gemini-1.5-pro"
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-yellow-400/60 transition-colors"
                    />
                  )}

                  <button
                    onClick={handleSaveModel}
                    disabled={savingModel || !selectedModel || (selectedModel === "__custom__" && !customModel.trim())}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {savingModel ? "Saving…" : modelSaved ? "✓ Saved!" : "Use This Model"}
                  </button>
                </div>
              )}

              {models.length === 0 && !fetchingModels && !modelError && (
                <p className="text-xs text-gray-600 text-center">
                  Click &quot;Fetch Available Models&quot; to see what your key can use.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-gray-500 text-sm">Loading settings…</div>
      }
    >
      <SettingsPageInner />
    </Suspense>
  );
}
