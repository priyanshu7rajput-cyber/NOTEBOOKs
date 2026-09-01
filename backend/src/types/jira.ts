export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrl?: string | null;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrl?: string | null;
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string | null;
}

export interface JiraStatus {
  id: string;
  name: string;
  statusCategory: 'new' | 'indeterminate' | 'done' | 'undefined';
  colorName?: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  subtask: boolean;
  iconUrl?: string | null;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string | null;
  status: JiraStatus;
  priority: JiraPriority;
  issueType: JiraIssueType;
  project: JiraProject;
  assignee: JiraUser | null;
  reporter: JiraUser | null;
  created: string;
  updated: string;
  dueDate: string | null;
  resolutionDate: string | null;
  url: string;
}

export interface JiraDashboardSummary {
  newTasksCount: number;
  dueTodayCount: number;
  completedTodayCount: number;
  pendingDueTodayCount: number;
}

export interface JiraAssigneeSummary {
  accountId: string;
  displayName: string;
  avatarUrl: string | null;
  newTasksCount: number;
  dueTodayCount: number;
  completedTodayCount: number;
  pendingDueTodayCount: number;
  totalActiveCount: number;
}

export interface JiraDashboardResponse {
  configured: boolean;
  baseUrl: string;
  lastSynced: string;
  summary: JiraDashboardSummary;
  assignees: JiraAssigneeSummary[];
  newTasks: JiraIssue[];
  dueTasks: JiraIssue[];
  completedTasks: JiraIssue[];
  allTasks: JiraIssue[];
  filterOptions: {
    assignees: string[];
    statuses: string[];
    projects: { key: string; name: string }[];
    issueTypes: string[];
  };
}

export interface JiraStatusResponse {
  configured: boolean;
  baseUrl?: string;
  email?: string;
  error?: string;
}
