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

  // Handle route changes to end loading state
  useEffect(() => {
    // End loading when pathname changes (navigation completed)
    endNavigation();
  }, [pathname, endNavigation]);

  // Show loading only during initial auth check
  if (loading && !authChecked) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-700 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userLevel={user?.level || 2} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 relative">
          {children}
          <GlobalLoading />
        </main>
      </div>
    </div>
  );
}
