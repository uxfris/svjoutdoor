"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback, useState, memo } from "react";
import {
  HomeIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  TagIcon,
  TruckIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BuildingStorefrontIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "./LoadingContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, level: [1, 2] },
  { name: "Kategori", href: "/categories", icon: TagIcon, level: [1] },
  { name: "Laporan", href: "/reports", icon: DocumentChartBarIcon, level: [1] },
  { name: "Member", href: "/members", icon: UserGroupIcon, level: [1] },
  { name: "Supplier", href: "/suppliers", icon: TruckIcon, level: [1] },
  { name: "Penjualan", href: "/sales", icon: ShoppingCartIcon, level: [1] },
  { name: "Kasir", href: "/pos", icon: ShoppingCartIcon, level: [1, 2] },
  { name: "Pembelian", href: "/purchases", icon: TruckIcon, level: [1] },
  { name: "Pengeluaran", href: "/expenses", icon: ChartBarIcon, level: [1] },
  { name: "Pengguna", href: "/users", icon: UserIcon, level: [1] },
  { name: "Pengaturan", href: "/settings", icon: CogIcon, level: [1] },
  { name: "Profil", href: "/profile", icon: UserIcon, level: [1, 2] },
];

interface SidebarProps {
  userLevel: number;
}

const Sidebar = memo(function Sidebar({ userLevel }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { startNavigation } = useLoading();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleNavigation = useCallback(
    (href: string) => {
      if (pathname !== href) {
        startNavigation();
        setIsMobileMenuOpen(false); // Close mobile menu on navigation
      }
    },
    [pathname, startNavigation]
  );

  const handlePrefetch = useCallback(
    (href: string) => {
      if (pathname !== href) {
        router.prefetch(href);
      }
    },
    [pathname, router]
  );

  const filteredNavigation = navigation.filter((item) =>
    item.level.includes(userLevel)
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--framer-color-bg)] rounded-[var(--framer-radius-md)] shadow-md border border-[var(--framer-color-border)]"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="w-6 h-6 text-[var(--framer-color-text)]" />
        ) : (
          <Bars3Icon className="w-6 h-6 text-[var(--framer-color-text)]" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`flex flex-col w-72 bg-[var(--framer-color-bg)] border-r border-[var(--framer-color-border)] fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center h-20 px-6 bg-[var(--framer-color-tint)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-[var(--framer-radius-md)] flex items-center justify-center">
              <BuildingStorefrontIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--framer-color-tint-text)]">
                SVJ Outdoor
              </h1>
              <p className="text-xs text-white/80">Sistem Kasir</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => handleNavigation(item.href)}
                onMouseEnter={() => handlePrefetch(item.href)}
                className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-[var(--framer-radius-md)] transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--framer-color-tint)] text-[var(--framer-color-tint-text)] shadow-sm"
                    : "text-[var(--framer-color-text-secondary)] hover:bg-[var(--framer-color-surface)] hover:text-[var(--framer-color-text)]"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 mr-3 transition-colors ${
                    isActive
                      ? "text-[var(--framer-color-tint-text)]"
                      : "text-[var(--framer-color-text-tertiary)] group-hover:text-[var(--framer-color-text-secondary)]"
                  }`}
                />
                <span className="flex-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[var(--framer-color-border)] bg-[var(--framer-color-surface)]">
          <button
            onClick={handleSignOut}
            className="group flex items-center w-full px-4 py-3 text-sm font-medium text-[var(--framer-color-text-secondary)] rounded-[var(--framer-radius-md)] hover:bg-[var(--framer-color-error-bg)] hover:text-[var(--framer-color-error)] transition-all duration-150"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 text-[var(--framer-color-text-tertiary)] group-hover:text-[var(--framer-color-error)]" />
            Keluar
          </button>
        </div>
      </div>
    </>
  );
});

export default Sidebar;
