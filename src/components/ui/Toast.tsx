"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearToasts }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons = {
    success: CheckCircleIcon,
    error: ExclamationTriangleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };

  const colors = {
    success:
      "bg-[var(--framer-color-success-bg)] border-[var(--framer-color-success)] text-[var(--framer-color-success)]",
    error:
      "bg-[var(--framer-color-error-bg)] border-[var(--framer-color-error)] text-[var(--framer-color-error)]",
    warning:
      "bg-[var(--framer-color-warning-bg)] border-[var(--framer-color-warning)] text-[var(--framer-color-warning)]",
    info: "bg-[var(--framer-color-tint-disabled)] border-[var(--framer-color-tint)] text-[var(--framer-color-tint)]",
  };

  const iconColors = {
    success: "text-[var(--framer-color-success)]",
    error: "text-[var(--framer-color-error)]",
    warning: "text-[var(--framer-color-warning)]",
    info: "text-[var(--framer-color-tint)]",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`max-w-sm w-full bg-[var(--framer-color-bg)] shadow-md rounded-[var(--framer-radius-lg)] border-l-4 ${
        colors[toast.type]
      } animate-in slide-in-from-right-full duration-300`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${iconColors[toast.type]}`} />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-[var(--framer-color-text)]">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-[var(--framer-color-text-secondary)]">
                {toast.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-[var(--framer-color-text-tertiary)] hover:text-[var(--framer-color-text)] focus:outline-none transition ease-in-out duration-150"
              onClick={() => onRemove(toast.id)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
