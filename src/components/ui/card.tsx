import React from "react";

// Props for the Card component
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Card component
export function Card({ children, className }: CardProps) {
  return <div className={`rounded-lg shadow ${className}`}>{children}</div>;
}

// CardContent component
export function CardContent({ children, className }: CardProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
