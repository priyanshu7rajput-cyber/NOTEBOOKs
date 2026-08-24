import { CoverTheme } from "@/types/database";

export interface ThemeConfig {
  id: CoverTheme;
  name: string;
  category: string;
  gradient: string;
  accent: string;
  pattern?: string;
  texture?: string;
  border: string;
  text: string;
}

export const BOOK_THEMES: Record<CoverTheme, ThemeConfig> = {
  classic: {
    id: "classic",
    name: "Classic Notebook",
    category: "Standard",
    gradient: "from-amber-800 via-amber-900 to-stone-900",
    accent: "#d97706",
    border: "border-amber-700/50",
    text: "text-amber-100",
  },
  leather: {
    id: "leather",
    name: "Vintage Leather",
    category: "Standard",
    gradient: "from-stone-800 via-amber-950 to-stone-900",
    accent: "#b45309",
    border: "border-amber-900/60",
    text: "text-amber-50",
  },
  gradient: {
    id: "gradient",
    name: "Modern Aurora",
    category: "Vibrant",
    gradient: "from-indigo-600 via-purple-600 to-pink-500",
    accent: "#a855f7",
    border: "border-purple-400/40",
    text: "text-white",
  },
  grid: {
    id: "grid",
    name: "Grid Notebook",
    category: "Minimal",
    gradient: "from-slate-700 via-slate-800 to-slate-900",
    accent: "#38bdf8",
    border: "border-slate-600/50",
    text: "text-slate-100",
  },
  minimal: {
    id: "minimal",
    name: "Minimal Slate",
    category: "Minimal",
    gradient: "from-zinc-900 via-neutral-900 to-zinc-950",
    accent: "#e4e4e7",
    border: "border-zinc-700",
    text: "text-zinc-100",
  },
  forest: {
    id: "forest",
    name: "Forest Emerald",
    category: "Nature",
    gradient: "from-emerald-800 via-teal-900 to-slate-950",
    accent: "#10b981",
    border: "border-emerald-700/50",
    text: "text-emerald-50",
  },
  purple: {
    id: "purple",
    name: "Royal Purple",
    category: "Vibrant",
    gradient: "from-purple-900 via-violet-950 to-indigo-950",
    accent: "#c084fc",
    border: "border-purple-700/50",
    text: "text-purple-100",
  },
  math: {
    id: "math",
    name: "Mathematics",
    category: "Academic",
    gradient: "from-blue-900 via-indigo-950 to-slate-950",
    accent: "#60a5fa",
    border: "border-blue-700/50",
    text: "text-blue-100",
  },
  code: {
    id: "code",
    name: "Terminal & Code",
    category: "Tech",
    gradient: "from-zinc-950 via-emerald-950 to-black",
    accent: "#22c55e",
    border: "border-emerald-500/40",
    text: "text-emerald-400 font-mono",
  },
  blueprint: {
    id: "blueprint",
    name: "Blueprint Arch",
    category: "Design",
    gradient: "from-sky-900 via-blue-950 to-slate-950",
    accent: "#38bdf8",
    border: "border-sky-600/50",
    text: "text-sky-100",
  },
  study: {
    id: "study",
    name: "College Semester",
    category: "Academic",
    gradient: "from-rose-900 via-red-950 to-stone-950",
    accent: "#f87171",
    border: "border-rose-700/50",
    text: "text-rose-100",
  },
  custom: {
    id: "custom",
    name: "Custom Theme",
    category: "Custom",
    gradient: "from-slate-800 via-gray-900 to-black",
    accent: "#3b82f6",
    border: "border-slate-700",
    text: "text-white",
  },
};
