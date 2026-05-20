"use client";

import { Database } from "@/lib/database.types";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { memo, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type User = Database["public"]["Tables"]["users"]["Row"];

interface HeaderProps {
  user: User | null;
}

// Function to generate breadcrumbs from pathname
const generateBreadcrumbs = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [];

  // Always start with Dashboard if we're in the dashboard section
  if (pathname.startsWith("/dashboard")) {
    breadcrumbs.push({ name: "Dashboard", href: "/dashboard", icon: HomeIcon });
  }

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Skip the first "dashboard" segment since we already added it above
    if (segment === "dashboard" && index === 0) {
      return;
    }

    const name =
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    breadcrumbs.push({
      name,
      href: currentPath,
      icon: null,
    });
  });

  return breadcrumbs;
};

const Header = memo(function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = useMemo(() => generateBreadcrumbs(pathname), [pathname]);

  if (!user) {
    return (
      <header className="bg-[var(--framer-color-bg)] border-b border-[var(--framer-color-border)]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>
    );
  }

  return (
    <header className="bg-[var(--framer-color-bg)] border-b border-[var(--framer-color-border)]">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2">
          <nav className="flex items-center space-x-1 text-sm">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRightIcon className="w-4 h-4 text-[var(--framer-color-text-tertiary)] mx-2" />
                )}
                <div className="flex items-center space-x-2">
                  {breadcrumb.icon && (
                    <breadcrumb.icon className="w-4 h-4 text-[var(--framer-color-text-secondary)]" />
                  )}
                  <span
                    className={`font-medium ${
                      index === breadcrumbs.length - 1
                        ? "text-[var(--framer-color-text)]"
                        : "text-[var(--framer-color-text-secondary)] hover:text-[var(--framer-color-text)]"
                    }`}
                  >
                    {breadcrumb.name}
                  </span>
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-4 bg-[#F2F4F6] pl-4 pr-2 py-2 rounded-xl">
          <div className="text-left">
            <p className="text-sm font-semibold text-[var(--framer-color-text)]">
              {user.name}
            </p>
            <p className="text-xs text-[var(--framer-color-text-secondary)] flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  user.level === 1
                    ? "bg-[var(--framer-color-success)]"
                    : "bg-[var(--framer-color-tint)]"
                }`}
              ></span>
              {user.level === 1 ? "Administrator" : "Kasir"}
            </p>
          </div>
          <div className="w-10 h-10 bg-[var(--framer-color-tint)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-semibold text-[var(--framer-color-tint-text)]">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
});

export default Header;
