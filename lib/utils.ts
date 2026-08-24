import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatTime(dateString?: string | null): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return {
        bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40",
        dot: "bg-red-500",
        label: "High",
      };
    case "medium":
      return {
        bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
        dot: "bg-amber-500",
        label: "Medium",
      };
    case "low":
    default:
      return {
        bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
        dot: "bg-emerald-500",
        label: "Low",
      };
  }
}
