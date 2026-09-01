import { JiraIssue, JiraDashboardResponse, JiraAssigneeSummary, JiraDashboardSummary } from '@/types/jira';

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

// In-memory server-side cache for 60 seconds
let cachedResponse: { data: JiraDashboardResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export function getJiraConfig(): JiraConfig | null {
  const baseUrl = process.env.JIRA_BASE_URL?.trim();
  const email = process.env.JIRA_EMAIL?.trim();
  const apiToken = process.env.JIRA_API_TOKEN?.trim();

  if (!baseUrl || !email || !apiToken) {
    return null;
  }

  // Remove trailing slashes from base URL
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  return {
    baseUrl: normalizedBaseUrl,
    email,
    apiToken,
  };
}

/**
 * Executes a JQL search query on Jira Cloud REST API v3 / v2
 */
async function searchJiraJQL(config: JiraConfig, jql: string, maxResults: number = 100): Promise<any[]> {
  const authHeader = `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`;

  const fields = [
    'summary',
    'status',
    'priority',
    'issuetype',
    'project',
    'assignee',
    'reporter',
    'created',
    'updated',
    'duedate',
    'resolutiondate',
  ];

  // Try standard GET /rest/api/3/search/jql first (new Jira Cloud specification)
  const getUrl = `${config.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${encodeURIComponent(fields.join(','))}`;

  let response = await fetch(getUrl, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  // If GET /rest/api/3/search/jql fails (400, 404, or 405), fallback to POST /rest/api/2/search or GET /rest/api/2/search
  if (!response.ok && (response.status === 400 || response.status === 404 || response.status === 405 || response.status === 410)) {
    const fallbackGetUrl = `${config.baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${encodeURIComponent(fields.join(','))}`;
    const fallbackRes = await fetch(fallbackGetUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (fallbackRes.ok) {
      response = fallbackRes;
    }
  }

  if (response.status === 401) {
    throw new Error('Jira authentication failed. Please verify your JIRA_EMAIL and JIRA_API_TOKEN.');
  }

  if (response.status === 403) {
    throw new Error('Jira access forbidden. Check user permissions for the requested Jira Cloud projects.');
  }

  if (response.status === 404) {
    throw new Error(`Jira API endpoint not found. Please verify your JIRA_BASE_URL (${config.baseUrl}).`);
  }

  if (response.status === 429) {
    throw new Error('Jira API rate limit reached. Please wait a moment before trying again.');
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Jira API request failed (${response.status}): ${errorBody || response.statusText}`);
  }

  const data = await response.json();
  return data.issues || [];
}

/**
 * Transforms raw Jira REST issue object into standardized typed JiraIssue
 */
function mapRawJiraIssue(raw: any, baseUrl: string): JiraIssue {
  const fields = raw.fields || {};

  // Status Category mapping
  let categoryKey: 'new' | 'indeterminate' | 'done' | 'undefined' = 'undefined';
  const rawCat = fields.status?.statusCategory?.key;
  if (rawCat === 'new') categoryKey = 'new';
  else if (rawCat === 'indeterminate') categoryKey = 'indeterminate';
  else if (rawCat === 'done') categoryKey = 'done';

  return {
    id: raw.id,
    key: raw.key,
    summary: fields.summary || 'Untitled Issue',
    description: typeof fields.description === 'string' ? fields.description : null,
    status: {
      id: fields.status?.id || '0',
      name: fields.status?.name || 'Unknown',
      statusCategory: categoryKey,
      colorName: fields.status?.statusCategory?.colorName,
    },
    priority: {
      id: fields.priority?.id || '0',
      name: fields.priority?.name || 'Medium',
      iconUrl: fields.priority?.iconUrl || null,
    },
    issueType: {
      id: fields.issuetype?.id || '0',
      name: fields.issuetype?.name || 'Task',
      subtask: !!fields.issuetype?.subtask,
      iconUrl: fields.issuetype?.iconUrl || null,
    },
    project: {
      id: fields.project?.id || '0',
      key: fields.project?.key || 'PROJ',
      name: fields.project?.name || 'Project',
      avatarUrl: fields.project?.avatarUrls?.['48x48'] || null,
    },
    assignee: fields.assignee
      ? {
          accountId: fields.assignee.accountId,
          displayName: fields.assignee.displayName || 'Unnamed Assignee',
          emailAddress: fields.assignee.emailAddress,
          avatarUrl: fields.assignee.avatarUrls?.['48x48'] || null,
        }
      : null,
    reporter: fields.reporter
      ? {
          accountId: fields.reporter.accountId,
          displayName: fields.reporter.displayName || 'Reporter',
          avatarUrl: fields.reporter.avatarUrls?.['48x48'] || null,
        }
      : null,
    created: fields.created,
    updated: fields.updated,
    dueDate: fields.duedate || null,
    resolutionDate: fields.resolutiondate || null,
    url: `${baseUrl}/browse/${raw.key}`,
  };
}

/**
 * Executes a simple test ping against Jira /rest/api/3/myself or serverInfo
 */
export async function testJiraConnection(config: JiraConfig): Promise<{ success: boolean; user?: string; error?: string }> {
  try {
    const authHeader = `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`;
    const res = await fetch(`${config.baseUrl}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, error: 'Authentication failed. Please verify your Email and API Token.' };
      }
      if (res.status === 404) {
        return { success: false, error: `Jira instance not found at URL (${config.baseUrl}).` };
      }
      const errText = await res.text();
      return { success: false, error: `Jira error (${res.status}): ${errText.slice(0, 150)}` };
    }

    const userData = await res.json();
    return {
      success: true,
      user: userData.displayName || userData.emailAddress || 'Authenticated User',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

/**
 * Fetches all Jira Today Dashboard data in parallel
 */
export async function fetchJiraDashboardData(
  forceRefresh: boolean = false,
  userConfig?: JiraConfig | null
): Promise<JiraDashboardResponse> {
  const config = userConfig || getJiraConfig();
  if (!config) {
    throw new Error('Jira credentials not configured. Please add your Jira Domain, Email, and API Token in Settings.');
  }

  // Exact JQL queries according to requirements:
  // 1. Today's New Tasks: Created today
  const newTasksJQL = 'created >= startOfDay() AND created < startOfDay(1) ORDER BY created DESC';

  // 2. Today's Due Tasks: Due date is today
  const dueTasksJQL = 'duedate = startOfDay() ORDER BY priority DESC';

  // 3. Completed Today: Done status category and resolution/updated today
  const completedTasksJQL = 'statusCategory = Done AND (resolutiondate >= startOfDay() OR (resolutiondate is EMPTY AND updated >= startOfDay() AND updated < startOfDay(1))) ORDER BY updated DESC';

  // Run in parallel for high efficiency
  const [rawNewIssues, rawDueIssues, rawCompletedIssues] = await Promise.all([
    searchJiraJQL(config, newTasksJQL),
    searchJiraJQL(config, dueTasksJQL),
    searchJiraJQL(config, completedTasksJQL),
  ]);

  const newTasks = rawNewIssues.map((issue) => mapRawJiraIssue(issue, config.baseUrl));
  const dueTasks = rawDueIssues.map((issue) => mapRawJiraIssue(issue, config.baseUrl));
  const completedTasks = rawCompletedIssues.map((issue) => mapRawJiraIssue(issue, config.baseUrl));

  // Merge all tasks uniquely
  const taskMap = new Map<string, JiraIssue>();
  [...newTasks, ...dueTasks, ...completedTasks].forEach((task) => {
    taskMap.set(task.key, task);
  });
  const allTasks = Array.from(taskMap.values());

  // Calculate Pending Due Today (Due today AND not done)
  const pendingDueTodayTasks = dueTasks.filter((t) => t.status.statusCategory !== 'done');

  // Summary counts
  const summary: JiraDashboardSummary = {
    newTasksCount: newTasks.length,
    dueTodayCount: dueTasks.length,
    completedTodayCount: completedTasks.length,
    pendingDueTodayCount: pendingDueTodayTasks.length,
  };

  // Build Assignee-wise statistics
  const assigneeMap = new Map<string, JiraAssigneeSummary>();

  const getOrCreateAssignee = (user: JiraIssue['assignee']): JiraAssigneeSummary => {
    const accountId = user ? user.accountId : 'unassigned';
    const displayName = user ? user.displayName : 'Unassigned';
    const avatarUrl = user?.avatarUrl || null;

    if (!assigneeMap.has(accountId)) {
      assigneeMap.set(accountId, {
        accountId,
        displayName,
        avatarUrl,
        newTasksCount: 0,
        dueTodayCount: 0,
        completedTodayCount: 0,
        pendingDueTodayCount: 0,
        totalActiveCount: 0,
      });
    }
    return assigneeMap.get(accountId)!;
  };

  newTasks.forEach((t) => {
    const a = getOrCreateAssignee(t.assignee);
    a.newTasksCount += 1;
  });

  dueTasks.forEach((t) => {
    const a = getOrCreateAssignee(t.assignee);
    a.dueTodayCount += 1;
    if (t.status.statusCategory !== 'done') {
      a.pendingDueTodayCount += 1;
    }
  });

  completedTasks.forEach((t) => {
    const a = getOrCreateAssignee(t.assignee);
    a.completedTodayCount += 1;
  });

  // Calculate total active tasks per assignee
  assigneeMap.forEach((a) => {
    a.totalActiveCount = a.newTasksCount + a.pendingDueTodayCount;
  });

  const assignees = Array.from(assigneeMap.values()).sort((a, b) => {
    // Sort unassigned to bottom, then by total volume descending
    if (a.accountId === 'unassigned') return 1;
    if (b.accountId === 'unassigned') return -1;
    return b.totalActiveCount - a.totalActiveCount || b.newTasksCount - a.newTasksCount;
  });

  // Collect filter options
  const assigneeNames = Array.from(
    new Set(allTasks.map((t) => t.assignee?.displayName || 'Unassigned'))
  ).sort();

  const statuses = Array.from(new Set(allTasks.map((t) => t.status.name))).sort();

  const issueTypes = Array.from(new Set(allTasks.map((t) => t.issueType.name))).sort();

  const projectMap = new Map<string, string>();
  allTasks.forEach((t) => {
    projectMap.set(t.project.key, t.project.name);
  });
  const projects = Array.from(projectMap.entries()).map(([key, name]) => ({ key, name }));

  const responsePayload: JiraDashboardResponse = {
    configured: true,
    baseUrl: config.baseUrl,
    lastSynced: new Date().toISOString(),
    summary,
    assignees,
    newTasks,
    dueTasks,
    completedTasks,
    allTasks,
    filterOptions: {
      assignees: assigneeNames,
      statuses,
      projects,
      issueTypes,
    },
  };

  return responsePayload;
}
