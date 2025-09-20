"use client";

import { memo } from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  name: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
}

export const StatsCard = memo(function StatsCard({
  name,
  value,
  icon: Icon,
  color,
}: StatsCardProps) {
  return (
    <div className="group bg-[var(--framer-color-bg)] rounded-[var(--framer-radius-xl)] shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-[var(--framer-color-border)] hover:border-[var(--framer-color-border-hover)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className={`${color} rounded-2xl p-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--framer-color-text-secondary)] mb-1">
              {name}
            </p>
            <p className="text-3xl font-bold text-[var(--framer-color-text)]">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
