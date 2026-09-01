'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Globe,
  Mail,
  Lock,
} from 'lucide-react';

interface JiraConfigModalProps {
  onSuccess?: () => void;
  className?: string;
}

export function JiraConfigSection({ onSuccess, className = '' }: JiraConfigModalProps) {
  const [baseUrl, setBaseUrl] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  
  const [isConfigured, setIsConfigured] = useState(false);
  const [currentBaseUrl, setCurrentBaseUrl] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Fetch current user's Jira status
  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/jira/config');
      if (res.ok) {
        const data = await res.json();
        if (data.configured) {
          setIsConfigured(true);
          setCurrentBaseUrl(data.baseUrl);
          setCurrentEmail(data.email);
          setBaseUrl(data.baseUrl);
          setEmail(data.email);
        } else {
          setIsConfigured(false);
        }
      }
    } catch (e) {
      console.error('Failed to load Jira config', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleTestConnection = async () => {
    if (!baseUrl || !email || !apiToken) {
      setMessage({ type: 'error', text: 'Please fill in Domain, Email, and API Token to test.' });
      return;
    }

    try {
      setIsTesting(true);
      setMessage(null);
      const res = await fetch('/api/jira/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, email, apiToken }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Connection verified successfully! Authenticated as: ${data.user}`,
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Connection failed. Please check your credentials.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseUrl || !email || !apiToken) {
      setMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);
      const res = await fetch('/api/jira/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, email, apiToken }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: data.message || 'Jira credentials saved and connected successfully!',
        });
        setIsConfigured(true);
        setCurrentBaseUrl(baseUrl);
        setCurrentEmail(email);
        setApiToken(''); // clear token input for security
        
        // Clear cached dashboard data so new credentials immediately pull fresh data
        try {
          localStorage.removeItem('cached_jira_dashboard_data');
        } catch {}

        if (onSuccess) onSuccess();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to save Jira configuration.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to disconnect and delete your Jira credentials?')) return;

    try {
      setIsDeleting(true);
      setMessage(null);
      const res = await fetch('/api/jira/config', { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setIsConfigured(false);
        setCurrentBaseUrl('');
        setCurrentEmail('');
        setBaseUrl('');
        setEmail('');
        setApiToken('');
        try {
          localStorage.removeItem('cached_jira_dashboard_data');
        } catch {}
        setMessage({ type: 'info', text: 'Jira account disconnected.' });
        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to disconnect.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to disconnect.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Jira Cloud Integration
              {isConfigured && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Connect your personal Atlassian Jira Cloud account to view your daily tasks and sprints.
            </p>
          </div>
        </div>

        {isConfigured && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-xs gap-1.5 self-start sm:self-auto"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Disconnect Jira
          </Button>
        )}
      </div>

      {isConfigured && (
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              Instance: <span className="text-blue-600 dark:text-blue-400 font-mono">{currentBaseUrl}</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              User Email: <span className="font-medium text-slate-800 dark:text-slate-200">{currentEmail}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Protected by Supabase RLS
          </div>
        </div>
      )}

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : message.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          )}
          <div className="flex-1">{message.text}</div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Jira Base URL / Domain
          </label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://your-domain.atlassian.net"
            required
            className="text-xs"
          />
          <p className="text-[11px] text-slate-400">
            Example: <code className="font-mono text-slate-600 dark:text-slate-300">https://your-company.atlassian.net</code>
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            Atlassian Account Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-jira-email@example.com"
            required
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Jira API Token {isConfigured && <span className="text-slate-400 font-normal">(Enter new token to update)</span>}
            </label>
            <a
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              Generate API Token <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <Input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder={isConfigured ? '••••••••••••••••••••••••••••' : 'Paste Atlassian API Token here'}
            required={!isConfigured}
            className="text-xs font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="submit"
            size="sm"
            disabled={isSaving || isTesting || (!apiToken && !isConfigured)}
            className="gap-1.5 text-xs font-semibold"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {isConfigured ? 'Update & Save Credentials' : 'Save & Connect Jira'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting || isSaving || !baseUrl || !email || !apiToken}
            className="gap-1.5 text-xs"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Test Connection
          </Button>
        </div>
      </form>
    </div>
  );
}
