"use client";

import { memo } from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  name: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  paymentBreakdown?: {
    cash: number;
    debit: number;
  };
  isFullWidth?: boolean;
}

export const StatsCard = memo(function StatsCard({
  name,
  value,
  icon: Icon,
  color,
  paymentBreakdown,
  isFullWidth = false,
}: StatsCardProps) {
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
