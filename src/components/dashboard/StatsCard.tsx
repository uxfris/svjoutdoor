"use client";

import { memo, type ComponentType, type SVGProps } from "react";

type StatIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface StatsCardProps {
  name: string;
  value: number | string;
  icon: StatIcon;
  color: string;
  paymentBreakdown?: {
    cash: number;
    debit: number;
  };
  isFullWidth?: boolean;
  /** Admin dashboard hero tiles — frosted tiles inside the blue welcome banner */
  variant?: "default" | "adminHero";
}

export const StatsCard = memo(function StatsCard({
  name,
  value,
  icon: Icon,
  color,
  paymentBreakdown,
  isFullWidth = false,
  variant = "default",
}: StatsCardProps) {
  if (variant === "adminHero") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-none backdrop-blur-sm md:p-8">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b4c5ff] md:text-xs">
              {name}
            </p>
            <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-white md:text-5xl">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          <div className="shrink-0 rounded-lg bg-white/20 p-2 md:p-5">
            <Icon className="size-5 text-white md:size-8" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] ${
        isFullWidth ? "w-full" : "w-full"
      }`}
    >
      {/* Background with gradient */}
      <div className={`${color} absolute inset-0 opacity-90`}></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

      {/* Content */}
      <div className="relative z-10 p-8">
        {isFullWidth ? (
          // Full width layout for Pendapatan Hari Ini
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white/90 text-lg font-medium mb-2">{name}</p>
                <p className="text-4xl font-bold text-white mb-4">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </p>

                {/* Payment breakdown for full width */}
                {paymentBreakdown && (
                  <div className="flex space-x-8">
                    <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                      <div className="w-4 h-4 bg-green-400 rounded-full shadow-lg"></div>
                      <div>
                        <p className="text-white/80 text-sm font-medium">
                          Tunai
                        </p>
                        <p className="text-white font-bold text-lg">
                          Rp {paymentBreakdown.cash.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                      <div className="w-4 h-4 bg-purple-400 rounded-full shadow-lg"></div>
                      <div>
                        <p className="text-white/80 text-sm font-medium">
                          Debit
                        </p>
                        <p className="text-white font-bold text-lg">
                          Rp {paymentBreakdown.debit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Regular layout for other cards
          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 w-16 h-16 mx-auto mb-4 shadow-lg">
              <Icon className="w-8 h-8 text-white mx-auto" />
            </div>
            <p className="text-white/90 text-sm font-medium mb-2">{name}</p>
            <p className="text-3xl font-bold text-white">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
});
