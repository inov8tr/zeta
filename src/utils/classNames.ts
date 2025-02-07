/**
 * Merges class names into a single string, filtering out falsey values like null, undefined, and false.
 * Useful for conditional styling with Tailwind CSS or other class-based styling approaches.
 *
 * Example:
 * const buttonClass = cn(
 *   "px-4 py-2 rounded",
 *   isPrimary && "bg-blue-500 text-white",
 *   isDisabled && "opacity-50 cursor-not-allowed"
 * );
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(" ");
  }
  