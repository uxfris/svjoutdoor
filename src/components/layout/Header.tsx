"use client";

import { Database } from "@/lib/database.types";

type User = Database["public"]["Tables"]["users"]["Row"];

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  if (!user) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-sm font-medium text-gray-500">...</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">
              {user.level === 1 ? "Administrator" : "Cashier"}
            </p>
          </div>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
