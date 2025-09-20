"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";
import { usePathname, useRouter } from "next/navigation";

type User = Database["public"]["Tables"]["users"]["Row"];
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useLoading } from "@/components/layout/LoadingContext";
import GlobalLoading from "@/components/layout/GlobalLoading";
import { useDashboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import KeyboardShortcutsModal from "@/components/ui/KeyboardShortcutsModal";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { endNavigation } = useLoading();

  // Enable keyboard shortcuts
  useDashboardShortcuts();

  // Memoize the auth check to prevent unnecessary re-runs
  const checkAuth = useCallback(async () => {
    if (authChecked) return;

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      // Get user profile from our users table
      const { data: userProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userProfile) {
        setUser(userProfile);
      } else {
        // If no profile exists, redirect to login
        router.push("/login");
        return;
      }

      setAuthChecked(true);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [supabase, router, authChecked]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle route changes to end loading state
  useEffect(() => {
    // End loading when pathname changes (navigation completed)
    endNavigation();
  }, [pathname, endNavigation]);

  // Show loading only during initial auth check
  if (loading && !authChecked) {
    return (
      <div className="flex h-screen bg-[var(--framer-color-bg)] items-center justify-center">
        <div className="bg-[var(--framer-color-bg)] rounded-[var(--framer-radius-lg)] p-6 flex items-center space-x-3 shadow-md border border-[var(--framer-color-border)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--framer-color-tint)]"></div>
          <span className="text-[var(--framer-color-text)] font-medium">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[var(--framer-color-bg)]">
      <Sidebar userLevel={user?.level || 2} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--framer-color-bg)] relative">
          <div className="min-h-full">{children}</div>
          <GlobalLoading />
          <KeyboardShortcutsModal />
        </main>
      </div>
    </div>
  );
}
