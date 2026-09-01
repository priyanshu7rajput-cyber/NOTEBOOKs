'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { JiraDashboardResponse, JiraIssue } from '@/types/jira';
import { JiraSummaryCards } from '@/components/jira/JiraSummaryCards';
import { JiraAssigneeSummaryView } from '@/components/jira/JiraAssigneeSummary';
import { JiraTaskTable } from '@/components/jira/JiraTaskTable';
import { Button } from '@/components/ui/Button';
import { formatTime } from '@/lib/utils';
import {
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Layers,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

export default function JiraDashboardPage() {
  const [dashboardData, setDashboardData] = useState<JiraDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Tab: 'all' | 'new' | 'due' | 'completed'
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'due' | 'completed'>('all');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedIssueType, setSelectedIssueType] = useState('all');

  // Load cached Jira data from localStorage per user on mount
  useEffect(() => {
    try {
      // Find current user email / id from Supabase auth if available
      const cachedEmail = localStorage.getItem('last_auth_user_email') || 'current';
      const cacheKey = `cached_jira_${cachedEmail}`;
      const savedJira = localStorage.getItem(cacheKey);
      if (savedJira) {
        const parsed = JSON.parse(savedJira);
        setDashboardData(parsed);
        setHasFetched(true);
      } else {
        setDashboardData(null);
        setHasFetched(false);
      }
    } catch (e) {
      console.warn('Failed to read Jira cache from localStorage:', e);
    }
  }, []);

  // Load Data only on manual trigger (Refresh button)
  const loadDashboardData = async (forceRefresh: boolean = true) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      const url = `/api/jira/dashboard?refresh=true`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch Jira dashboard data.');
      }

      setDashboardData(data);
      setHasFetched(true);

      // Save to localStorage with user-scoped key
      try {
        const cachedEmail = localStorage.getItem('last_auth_user_email') || 'current';
        localStorage.setItem(`cached_jira_${cachedEmail}`, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to save Jira cache:', e);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while connecting to Jira Cloud.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Filter and Search Pipeline
  const filteredTasks = useMemo(() => {
    if (!dashboardData) return [];

    // 1. Choose task dataset based on active tab
    let list: JiraIssue[] = [];
    if (activeTab === 'new') list = dashboardData.newTasks || [];
    else if (activeTab === 'due') list = dashboardData.dueTasks || [];
    else if (activeTab === 'completed') list = dashboardData.completedTasks || [];
    else list = dashboardData.allTasks || [];

    // 2. Apply Filters
    return list.filter((task) => {
      // Assignee Filter
      if (selectedAssignee !== 'all') {
        const taskAssignee = task.assignee?.displayName || 'Unassigned';
        if (taskAssignee !== selectedAssignee) return false;
      }

      // Status Filter
      if (selectedStatus !== 'all') {
        if (task.status.name !== selectedStatus) return false;
      }

      // Project Filter
      if (selectedProject !== 'all') {
        if (task.project.key !== selectedProject) return false;
      }

      // Issue Type Filter
      if (selectedIssueType !== 'all') {
        if (task.issueType.name !== selectedIssueType) return false;
      }

      // Search Query (Key, Summary, Assignee, Project)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKey = task.key.toLowerCase().includes(q);
        const matchSummary = task.summary.toLowerCase().includes(q);
        const matchAssignee = (task.assignee?.displayName || 'unassigned').toLowerCase().includes(q);
        const matchProject = task.project.name.toLowerCase().includes(q) || task.project.key.toLowerCase().includes(q);

        if (!matchKey && !matchSummary && !matchAssignee && !matchProject) {
          return false;
        }
      }

      return true;
    });
  }, [dashboardData, activeTab, selectedAssignee, selectedStatus, selectedProject, selectedIssueType, searchQuery]);

  const hasActiveFilters =
    selectedAssignee !== 'all' ||
    selectedStatus !== 'all' ||
    selectedProject !== 'all' ||
    selectedIssueType !== 'all' ||
    searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setSelectedAssignee('all');
    setSelectedStatus('all');
    setSelectedProject('all');
    setSelectedIssueType('all');
    setSearchQuery('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Jira Today&apos;s Task Dashboard
            </h1>
            {dashboardData?.configured && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of issues created today, due today, and resolved today from Jira Cloud.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {dashboardData?.lastSynced && (
            <span className="text-[11px] text-slate-400">
              Synced: {formatTime(dashboardData.lastSynced)}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(true)}
            disabled={isLoading || isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </Button>

          {dashboardData?.baseUrl && (
            <a
              href={dashboardData.baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
            >
              <span>Jira Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Error / Not Configured State */}
      {errorMessage && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Jira Cloud Integration Required</h4>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{errorMessage}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              Each user can securely link their personal Atlassian Jira domain and API token.
            </p>
            <a
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Configure Jira in Settings
            </a>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <JiraSummaryCards
        summary={dashboardData?.summary || null}
        isLoading={isLoading}
        activeTab={activeTab}
        onTabSelect={(tab) => setActiveTab(tab)}
      />

      {/* Assignee-wise Summary */}
      <JiraAssigneeSummaryView
        assignees={dashboardData?.assignees || []}
        isLoading={isLoading}
        selectedAssignee={selectedAssignee}
        onSelectAssignee={(assignee) => setSelectedAssignee(assignee)}
      />

      {/* Controls & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              All Today&apos;s Tasks ({dashboardData?.allTasks?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'new'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              New Created ({dashboardData?.summary?.newTasksCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('due')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'due'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              Due Today ({dashboardData?.summary?.dueTodayCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              Completed ({dashboardData?.summary?.completedTodayCount || 0})
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-500 hover:underline font-semibold"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {/* Search & Multi-Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by key, title, assignee, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="all">All Assignees</option>
            {dashboardData?.filterOptions?.assignees?.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="all">All Statuses</option>
            {dashboardData?.filterOptions?.statuses?.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="all">All Projects</option>
            {dashboardData?.filterOptions?.projects?.map((p) => (
              <option key={p.key} value={p.key}>
                {p.key} ({p.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Table */}
      <JiraTaskTable
        tasks={filteredTasks}
        isLoading={isLoading}
        emptyMessage={
          !hasFetched
            ? 'Click the "Refresh" button above to fetch today\'s live tasks from Jira.'
            : hasActiveFilters
              ? 'No Jira tasks matched your active search and filter criteria.'
              : activeTab === 'new'
                ? 'No new Jira tasks created today.'
                : activeTab === 'due'
                  ? 'No Jira tasks are due today.'
                  : activeTab === 'completed'
                    ? 'No Jira tasks completed today.'
                    : 'No tasks found for today.'
        }
      />
    </div>
  );
}
