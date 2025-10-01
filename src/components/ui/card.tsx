// src/components/ui/card.tsx
import React from "react";

// Define the prop types for the Card component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void; // Optional onClick handler for interactivity
}

// Card component definition
export const Card = ({ children, className, onClick }: CardProps) => {
  return (
    <div
      className={`rounded-lg shadow-md border border-gray-200 bg-white overflow-hidden ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Define the prop types for CardContent
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

// CardContent component definition
export const CardContent = ({ children, className }: CardContentProps) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

// Define prop types for CardHeader (optional component)
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

// CardHeader component definition
export const CardHeader = ({ title, subtitle, className }: CardHeaderProps) => {
  return (
    <div className={`p-4 border-b border-gray-100 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
};

// Export all components for easy imports
export default Card;
