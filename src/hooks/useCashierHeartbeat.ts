"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CASHIER_HEARTBEAT_INTERVAL_MS } from "@/lib/cashier-presence";

/**
 * While enabled (cashier logged into dashboard), periodically updates
 * `public.users.last_heartbeat_at` so admins can show Online / Active / Offline.
 */
export function useCashierHeartbeat(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let cancelled = false;

    const ping = async () => {
      if (cancelled) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { error } = await supabase
        .from("users")
        .update({ last_heartbeat_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) {
        console.warn("Cashier heartbeat failed:", error.message);
      }
    };

    void ping();
    const intervalId = window.setInterval(() => void ping(), CASHIER_HEARTBEAT_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);
}
