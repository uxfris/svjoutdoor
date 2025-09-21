"use client";

import { useLoading } from "./LoadingContext";

export default function GlobalLoading() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--framer-color-bg)] backdrop-blur-sm rounded-[var(--framer-radius-xl)] p-8 flex flex-col items-center space-y-4 shadow-lg border border-[var(--framer-color-border)]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-[var(--framer-color-border)] rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[var(--framer-color-tint)] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <p className="text-[var(--framer-color-text)] font-semibold">
            Memuat...
          </p>
          <p className="text-[var(--framer-color-text-secondary)] text-sm">
            Mohon tunggu sebentar
          </p>
        </div>
      </div>
    </div>
  );
}
