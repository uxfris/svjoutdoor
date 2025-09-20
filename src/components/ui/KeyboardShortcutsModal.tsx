"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
}

const shortcuts: KeyboardShortcut[] = [
  { key: "H", ctrlKey: true, description: "Go to Dashboard" },
  { key: "P", ctrlKey: true, description: "Go to Products" },
  { key: "S", ctrlKey: true, description: "Go to Sales" },
  { key: "N", ctrlKey: true, description: "New Sale (POS)" },
  { key: "M", ctrlKey: true, description: "Go to Members" },
  { key: "U", ctrlKey: true, description: "Go to Users" },
  { key: "C", ctrlKey: true, description: "Go to Categories" },
  { key: "?", description: "Show keyboard shortcuts" },
];

export default function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => {
      setIsOpen(true);
    };

    window.addEventListener("show-keyboard-shortcuts", handleShowShortcuts);
    return () => {
      window.removeEventListener(
        "show-keyboard-shortcuts",
        handleShowShortcuts
      );
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Keyboard Shortcuts
            </h2>
            <p className="text-slate-600 mt-1">
              Speed up your workflow with these shortcuts
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid gap-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <span className="text-slate-700 font-medium">
                  {shortcut.description}
                </span>
                <div className="flex items-center space-x-1">
                  {shortcut.ctrlKey && (
                    <kbd className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-200 rounded border border-slate-300">
                      Ctrl
                    </kbd>
                  )}
                  {shortcut.shiftKey && (
                    <kbd className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-200 rounded border border-slate-300">
                      Shift
                    </kbd>
                  )}
                  {shortcut.altKey && (
                    <kbd className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-200 rounded border border-slate-300">
                      Alt
                    </kbd>
                  )}
                  <kbd className="px-3 py-1 text-sm font-bold text-slate-700 bg-white rounded border border-slate-300 shadow-sm">
                    {shortcut.key}
                  </kbd>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">💡</span>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Pro Tip</h3>
                <p className="text-blue-800 text-sm">
                  These shortcuts work from anywhere in the dashboard. Press{" "}
                  <kbd className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded border border-blue-300">
                    ?
                  </kbd>{" "}
                  anytime to see this help again.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
