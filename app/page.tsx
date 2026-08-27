import React from 'react';
import Link from 'next/link';
import {
  BookMarked,
  Sparkles,
  ArrowRight,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Layers,
  Palette,
  Cloud,
  Zap,
  PenTool,
  Calendar,
  Share2,
  Star,
  ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // Demo fallback / unconfigured
  }

  const features = [
    {
      icon: <PenTool className="w-6 h-6 text-indigo-400" />,
      title: "Realistic Ruled Notebook",
      description: "Experience the tactile feel of physical notebooks with margin rules, page lines, custom inks, and smooth fluid typing.",
      badge: "Core Experience"
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-emerald-400" />,
      title: "Google Sheets Auto-Sync",
      description: "Real-time bidirectional sync with Google Sheets. Export summaries, daily activity logs, and study sessions effortlessly.",
      badge: "Cloud Integration"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-sky-400" />,
      title: "Smart Task & Daily Tracking",
      description: "Integrated task manager with deadline alerts, category tags, priority flags, and recurring study goal checklists.",
      badge: "Productivity"
    },
    {
      icon: <Palette className="w-6 h-6 text-pink-400" />,
      title: "Custom Themes & Ruled Styles",
      description: "Switch seamlessly between Classic Parchment, Modern Grid, Dark Blueprint, and Minimalist rule line spacing.",
      badge: "Personalization"
    },
    {
      icon: <Shield className="w-6 h-6 text-violet-400" />,
      title: "Enterprise Supabase Security",
      description: "Your notes are encrypted and isolated with Row Level Security (RLS), multi-device sync, and reliable cloud backups.",
      badge: "Privacy First"
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: "Instant Global Search & Tags",
      description: "Supercharged search across all your notebooks, indexed chapters, dates, and tags with keyboard shortcuts (Ctrl+K).",
      badge: "Speed"
    }
  ];

  const stats = [
    { value: "100%", label: "Cloud Synchronized" },
    { value: "< 50ms", label: "Instant Auto-Save" },
    { value: "Unlimited", label: "Notebooks & Pages" },
    { value: "256-bit", label: "Encrypted Security" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden font-sans">
      {/* Dynamic Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[550px] h-[550px] rounded-full bg-emerald-600/10 blur-[150px]" />
        {/* Subtle grid lines background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation Bar */}
      <header className="relative z-50 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              NoteBooks<span className="text-indigo-400">.pro</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <span>Get Started Free</span>
                <Sparkles className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-950/80 via-slate-900/80 to-purple-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md mb-8 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>The Next-Gen Digital Notebook &amp; Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Write realistically.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
            Organize effortlessly.
          </span>{' '}
          Sync seamlessly.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Craft your thoughts on digital ruled pages with paper realism, organize study &amp; work tasks, and automatically backup all your records to Google Sheets in real-time.
        </p>

        {/* CTA Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={user ? "/dashboard" : "/signup"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 hover:shadow-indigo-500/50"
          >
            <span>{user ? "Open Your Notebooks" : "Create Free Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-all backdrop-blur-md"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Sign In to Account</span>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm text-center"
            >
              <div className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-pink-300">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-slate-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive App Preview Showcase */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <div className="relative rounded-3xl p-1 bg-gradient-to-b from-indigo-500/30 via-slate-800/40 to-transparent shadow-2xl">
          <div className="rounded-[22px] bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-xl">
            {/* Top Window Bar */}
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs text-slate-400 font-mono">NoteBooks Live Workspace • Ruled Edition</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Google Sheets Connected</span>
              </div>
            </div>

            {/* Inner Workspace Mockup */}
            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Notebook Card 1 */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm group-hover:text-indigo-300 transition-colors">
                    Physics &amp; Advanced Mechanics
                  </h4>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-3">
                    Chapter 4: Rotational Dynamics, Angular Momentum and Moment of Inertia derivations.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>14 Pages written</span>
                  <span className="text-emerald-400 font-medium">Auto-Synced</span>
                </div>
              </div>

              {/* Notebook Card 2 */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-violet-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm group-hover:text-violet-300 transition-colors">
                    Daily Productivity &amp; Milestones
                  </h4>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-3">
                    Goal tracker, daily revision checklists, project roadmap, and spreadsheet export logs.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>8 Tasks active</span>
                  <span className="text-indigo-400 font-medium">High Priority</span>
                </div>
              </div>

              {/* Notebook Card 3 */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-pink-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm group-hover:text-pink-300 transition-colors">
                    Google Sheets Auto-Backup
                  </h4>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-3">
                    Direct 2-way link to Google Cloud Sheets API. Generates automated reports with one click.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Live 2-Way</span>
                  <span className="text-emerald-400 font-medium">Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">
            Engineered For Scholars &amp; Professionals
          </h2>
          <h3 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">
            Everything you need for serious writing &amp; tracking
          </h3>
          <p className="mt-4 text-sm text-slate-400">
            A frictionless blend of traditional notebook ergonomics and cutting-edge cloud infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-slate-900/40 border border-slate-800/70 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all group backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[10px] font-semibold text-slate-400">
                  {item.badge}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                {item.title}
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="rounded-3xl p-10 md:p-14 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-pink-900/40 border border-indigo-500/30 text-center relative overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to elevate your daily note taking?
            </h3>
            <p className="mt-4 text-sm text-indigo-200">
              Join students, researchers, and creators who write on realistic ruled pages with instant Google Sheets sync.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:bg-slate-800 text-white font-semibold text-xs transition-all"
              >
                Sign In to Existing Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">NoteBooks</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Register</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
