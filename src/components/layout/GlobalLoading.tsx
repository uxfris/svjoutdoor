"use client";

import { useLoading } from "./LoadingContext";

export default function GlobalLoading() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-gray-50 bg-opacity-90 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="text-gray-700 font-medium">Loading...</span>
      </div>
    </div>
  );
}
