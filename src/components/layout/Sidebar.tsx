"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import {
  HomeIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  CubeIcon,
  TagIcon,
  TruckIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "./LoadingContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, level: [1, 2] },
  { name: "Products", href: "/products", icon: CubeIcon, level: [1] },
  { name: "Categories", href: "/categories", icon: TagIcon, level: [1] },
  { name: "Members", href: "/members", icon: UserGroupIcon, level: [1] },
  { name: "Suppliers", href: "/suppliers", icon: TruckIcon, level: [1] },
  { name: "Sales", href: "/sales", icon: ShoppingCartIcon, level: [1] },
  { name: "New Sale", href: "/pos", icon: ShoppingCartIcon, level: [1, 2] },
  { name: "Purchases", href: "/purchases", icon: TruckIcon, level: [1] },
  { name: "Expenses", href: "/expenses", icon: ChartBarIcon, level: [1] },
  { name: "Reports", href: "/reports", icon: ChartBarIcon, level: [1] },
  { name: "Users", href: "/users", icon: UserIcon, level: [1] },
  { name: "Settings", href: "/settings", icon: CogIcon, level: [1] },
  { name: "Profile", href: "/profile", icon: UserIcon, level: [1, 2] },
];

interface SidebarProps {
  userLevel: number;
}

export default function Sidebar({ userLevel }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { startNavigation } = useLoading();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleNavigation = useCallback(
    (href: string) => {
      if (pathname !== href) {
        startNavigation();
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
    <div className="flex flex-col w-64 bg-white shadow-lg">
      <div className="flex items-center justify-center h-16 px-4 bg-indigo-600">
        <h1 className="text-xl font-bold text-white">SVJ Outdoor</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => handleNavigation(item.href)}
              onMouseEnter={() => handlePrefetch(item.href)}
              className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          Sign out
        </button>
      </div>
    </div>
  );
}
