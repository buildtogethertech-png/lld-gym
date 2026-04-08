"use client";

import { useEffect, useState } from "react";
import { getProgress } from "@/lib/storage";
import { Progress } from "@/lib/types";

export default function ProgressBar() {
  const [progress, setProgress] = useState<Progress>({ total: 0, completed: 0, percentage: 0 });

  useEffect(() => {
    setProgress(getProgress());

    const onStorage = () => setProgress(getProgress());
    window.addEventListener("storage", onStorage);
    // Also refresh when this tab makes changes (custom event)
    window.addEventListener("lld:progress", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("lld:progress", onStorage);
    };
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-gray-400">Overall Progress</p>
          <p className="text-2xl font-bold">
            {progress.completed}
            <span className="text-gray-500 text-lg font-normal"> / {progress.total}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-yellow-400">{progress.percentage}%</p>
          <p className="text-xs text-gray-500">completed</p>
        </div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full bg-yellow-400 transition-all duration-500"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      {progress.completed === progress.total && progress.total > 0 && (
        <p className="mt-3 text-center text-sm text-yellow-400 font-medium">
          🔥 All problems completed! You are interview-ready.
        </p>
      )}
    </div>
  );
}
