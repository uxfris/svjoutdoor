"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";
import { usePathname } from "next/navigation";

type User = Database["public"]["Tables"]["users"]["Row"];
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useRouter } from "next/navigation";
import { useLoading } from "./LoadingContext";
import GlobalLoading from "./GlobalLoading";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { setLoading: setGlobalLoading, endNavigation } = useLoading();

  useEffect(() => {
    const getUser = async () => {
      setGlobalLoading(true);

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
      }

      setLoading(false);
      setGlobalLoading(false);
      endNavigation();
    };

    getUser();
  }, [router, supabase, setGlobalLoading, endNavigation]);

  // Handle route changes to end loading state
  useEffect(() => {
    // End loading when pathname changes (navigation completed)
    endNavigation();
  }, [pathname, endNavigation]);

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
