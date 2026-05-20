export type CashierPresence = "online" | "active" | "offline";

/** How often cashiers POST a heartbeat while the dashboard is open */
export const CASHIER_HEARTBEAT_INTERVAL_MS = 30_000;

/** Admin polls presence at this interval (lightweight query) */
export const ADMIN_PRESENCE_POLL_MS = 20_000;

/** Last heartbeat newer than this → "Online" (allows one missed 30s tick) */
export const PRESENCE_ONLINE_MAX_AGE_MS = 90_000;

/** Stale but within this window → "Active" (recent session, tab idle/background) */
export const PRESENCE_ACTIVE_MAX_AGE_MS = 30 * 60 * 1000;

export function presenceFromHeartbeat(
  lastHeartbeatAt: string | null | undefined,
): CashierPresence {
  if (!lastHeartbeatAt) return "offline";
  const age = Date.now() - new Date(lastHeartbeatAt).getTime();
  if (age < PRESENCE_ONLINE_MAX_AGE_MS) return "online";
  if (age < PRESENCE_ACTIVE_MAX_AGE_MS) return "active";
  return "offline";
}
