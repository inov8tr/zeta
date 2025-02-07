import React, { forwardRef } from "react";
import { cn } from "@/utils/classNames";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "link";
  size?: "sm" | "md" | "lg";
  className?: string;
  asChild?: boolean;
  children: React.ReactNode;
}

// Render as a span if `asChild` is true and let child handle the props
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className, asChild = false, children, ...props }, ref) => {
    const sizeStyles = {
      sm: "py-1 px-3 text-sm",
      md: "py-2 px-4 text-base",
      lg: "py-3 px-6 text-lg",
    };

    const variantStyles = {
      default: "bg-brand-accent text-text-primary hover:bg-brand-accent-dark",
      outline: "border border-neutral-lightest text-neutral-lightest hover:bg-neutral-lightest hover:text-brand-primary",
      link: "text-brand-primary underline hover:text-brand-primary-dark",
    };

    if (asChild) {
      return (
        <span className={cn("inline-flex", sizeStyles[size], variantStyles[variant], className)}>
          {children}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200",
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
