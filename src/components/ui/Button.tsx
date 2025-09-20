import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "ghost"
    | "success"
    | "warning"
    | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-[var(--framer-color-tint)] text-[var(--framer-color-tint-text)] hover:bg-[var(--framer-color-tint-hover)] focus:ring-[var(--framer-color-tint)] shadow-sm hover:shadow-md",
      secondary:
        "bg-[var(--framer-color-surface)] text-[var(--framer-color-text)] hover:bg-[var(--framer-color-surface-hover)] focus:ring-[var(--framer-color-border)] border border-[var(--framer-color-border)]",
      danger:
        "bg-[var(--framer-color-error)] text-white hover:bg-red-600 focus:ring-[var(--framer-color-error)] shadow-sm hover:shadow-md",
      success:
        "bg-[var(--framer-color-success)] text-white hover:bg-green-600 focus:ring-[var(--framer-color-success)] shadow-sm hover:shadow-md",
      warning:
        "bg-[var(--framer-color-warning)] text-white hover:bg-yellow-500 focus:ring-[var(--framer-color-warning)] shadow-sm hover:shadow-md",
      ghost:
        "text-[var(--framer-color-text)] hover:bg-[var(--framer-color-surface)] focus:ring-[var(--framer-color-border)]",
      outline:
        "border border-[var(--framer-color-border)] text-[var(--framer-color-text)] hover:bg-[var(--framer-color-surface)] hover:border-[var(--framer-color-border-hover)] focus:ring-[var(--framer-color-border)]",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm rounded-[var(--framer-radius-sm)]",
      md: "h-10 px-4 text-sm rounded-[var(--framer-radius-md)]",
      lg: "h-12 px-6 text-base rounded-[var(--framer-radius-lg)]",
      xl: "h-14 px-8 text-lg rounded-[var(--framer-radius-lg)]",
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
