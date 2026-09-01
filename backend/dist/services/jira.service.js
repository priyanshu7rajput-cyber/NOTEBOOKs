"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJiraConfig = getJiraConfig;
exports.fetchJiraDashboardData = fetchJiraDashboardData;
let cachedResponse = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute
function getJiraConfig() {
    const baseUrl = process.env.JIRA_BASE_URL?.trim();
    const email = process.env.JIRA_EMAIL?.trim();
    const apiToken = process.env.JIRA_API_TOKEN?.trim();
    if (!baseUrl || !email || !apiToken) {
        return null;
    }
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    return {
        baseUrl: normalizedBaseUrl,
        email,
        apiToken,
    };
}
async function searchJiraJQL(config, jql, maxResults = 100) {
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
    const getUrl = `${config.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${encodeURIComponent(fields.join(','))}`;
    let response = await fetch(getUrl, {
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
        },
    });
    if (!response.ok && (response.status === 400 || response.status === 404 || response.status === 405 || response.status === 410)) {
        const fallbackGetUrl = `${config.baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${encodeURIComponent(fields.join(','))}`;
        const fallbackRes = await fetch(fallbackGetUrl, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json',
            },
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
function mapRawJiraIssue(raw, baseUrl) {
    const fields = raw.fields || {};
    let categoryKey = 'undefined';
    const rawCat = fields.status?.statusCategory?.key;
    if (rawCat === 'new')
        categoryKey = 'new';
    else if (rawCat === 'indeterminate')
        categoryKey = 'indeterminate';
    else if (rawCat === 'done')
        categoryKey = 'done';
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
async function fetchJiraDashboardData(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedResponse && now - cachedResponse.timestamp < CACHE_TTL_MS) {
        return cachedResponse.data;
    }
    const config = getJiraConfig();
    if (!config) {
        throw new Error('Jira credentials not configured. Please set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN in environment variables.');
    }
    const newTasksJQL = 'created >= startOfDay() AND created < startOfDay(1) ORDER BY created DESC';
    const dueTasksJQL = 'duedate = startOfDay() ORDER BY priority DESC';
    const completedTasksJQL = 'statusCategory = Done AND (resolutiondate >= startOfDay() OR (resolutiondate is EMPTY AND updated >= startOfDay() AND updated < startOfDay(1))) ORDER BY updated DESC';
    const [rawNewIssues, rawDueIssues, rawCompletedIssues] = await Promise.all([
        searchJiraJQL(config, newTasksJQL),
        searchJiraJQL(config, dueTasksJQL),
        searchJiraJQL(config, completedTasksJQL),
    ]);
    const newTasks = rawNewIssues.map((issue) => mapRawJiraIssue(issue, config.baseUrl));
    const dueTasks = rawDueIssues.map((issue) => mapRawJiraIssue(issue, config.baseUrl));
    const completedTasks = rawCompletedIssues.map((issue) => mapRawJiraIssue(issue, config.baseUrl));
    const taskMap = new Map();
    [...newTasks, ...dueTasks, ...completedTasks].forEach((task) => {
        taskMap.set(task.key, task);
    });
    const allTasks = Array.from(taskMap.values());
    const pendingDueTodayTasks = dueTasks.filter((t) => t.status.statusCategory !== 'done');
    const summary = {
        newTasksCount: newTasks.length,
        dueTodayCount: dueTasks.length,
        completedTodayCount: completedTasks.length,
        pendingDueTodayCount: pendingDueTodayTasks.length,
    };
    const assigneeMap = new Map();
    const getOrCreateAssignee = (user) => {
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
        return assigneeMap.get(accountId);
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
    assigneeMap.forEach((a) => {
        a.totalActiveCount = a.newTasksCount + a.pendingDueTodayCount;
    });
    const assignees = Array.from(assigneeMap.values()).sort((a, b) => {
        if (a.accountId === 'unassigned')
            return 1;
        if (b.accountId === 'unassigned')
            return -1;
        return b.totalActiveCount - a.totalActiveCount || b.newTasksCount - a.newTasksCount;
    });
    const assigneeNames = Array.from(new Set(allTasks.map((t) => t.assignee?.displayName || 'Unassigned'))).sort();
    const statuses = Array.from(new Set(allTasks.map((t) => t.status.name))).sort();
    const issueTypes = Array.from(new Set(allTasks.map((t) => t.issueType.name))).sort();
    const projectMap = new Map();
    allTasks.forEach((t) => {
        projectMap.set(t.project.key, t.project.name);
    });
    const projects = Array.from(projectMap.entries()).map(([key, name]) => ({ key, name }));
    const responsePayload = {
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
    cachedResponse = {
        data: responsePayload,
        timestamp: now,
    };
    return responsePayload;
}
