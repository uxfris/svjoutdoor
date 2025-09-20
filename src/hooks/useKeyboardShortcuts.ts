"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const pressedKey = event.key.toLowerCase();
      const isCtrl = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === "true"
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const matchesKey = shortcut.key.toLowerCase() === pressedKey;
        const matchesCtrl = (shortcut.ctrlKey ?? false) === isCtrl;
        const matchesShift = (shortcut.shiftKey ?? false) === isShift;
        const matchesAlt = (shortcut.altKey ?? false) === isAlt;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts for the dashboard
export const useDashboardShortcuts = () => {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "h",
      ctrlKey: true,
      action: () => router.push("/dashboard"),
      description: "Go to Dashboard",
    },
    {
      key: "p",
      ctrlKey: true,
      action: () => router.push("/products"),
      description: "Go to Products",
    },
    {
      key: "s",
      ctrlKey: true,
      action: () => router.push("/sales"),
      description: "Go to Sales",
    },
    {
      key: "n",
      ctrlKey: true,
      action: () => router.push("/pos"),
      description: "New Sale (POS)",
    },
    {
      key: "r",
      ctrlKey: true,
      action: () => router.push("/reports"),
      description: "Go to Reports",
    },
    {
      key: "m",
      ctrlKey: true,
      action: () => router.push("/members"),
      description: "Go to Members",
    },
    {
      key: "u",
      ctrlKey: true,
      action: () => router.push("/users"),
      description: "Go to Users",
    },
    {
      key: "c",
      ctrlKey: true,
      action: () => router.push("/categories"),
      description: "Go to Categories",
    },
    {
      key: "?",
      action: () => {
        // Show keyboard shortcuts help
        const event = new CustomEvent("show-keyboard-shortcuts");
        window.dispatchEvent(event);
      },
      description: "Show keyboard shortcuts",
    },
  ];

  useKeyboardShortcuts(shortcuts);
};
