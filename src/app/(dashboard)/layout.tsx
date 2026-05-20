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
import { MainContentLayoutSkeleton } from "@/components/ui/page-skeletons";
import { useCashierHeartbeat } from "@/hooks/useCashierHeartbeat";

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

  useCashierHeartbeat(Boolean(user && user.level === 2));

  // Handle route changes to end loading state
  useEffect(() => {
    // End loading when pathname changes (navigation completed)
    endNavigation();
  }, [pathname, endNavigation]);

  // Show loading only during initial auth check (sidebar stays real)
  if (loading && !authChecked) {
    return (
      <div className="flex h-screen bg-[var(--framer-color-bg)]">
        <Sidebar userLevel={1} />
        <MainContentLayoutSkeleton />
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
        </main>
      </div>
    </div>
  );
}
