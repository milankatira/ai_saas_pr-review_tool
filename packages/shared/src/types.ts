// User types
export interface User {
  _id: string;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  organizationId?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Organization types
export interface Organization {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  settings: {
    defaultSeverityThreshold?: 'error' | 'warning' | 'info';
    enabledCategories?: string[];
    excludePatterns?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export type MemberRole = 'owner' | 'admin' | 'member';

export interface Member {
  _id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

// GitHub types
export interface Installation {
  _id: string;
  installationId: number;
  accountLogin: string;
  accountType: 'User' | 'Organization';
  accountId: number;
  organizationId?: string;
  userId?: string;
  permissions: Record<string, string>;
  repositorySelection: 'all' | 'selected';
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Repository {
  _id: string;
  installationId: string;
  githubRepoId: number;
  fullName: string;
  name: string;
  private: boolean;
  defaultBranch: string;
  isActive: boolean;
  settings: {
    severityThreshold?: 'error' | 'warning' | 'info';
    enabledCategories?: string[];
    excludePatterns?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Review types
export type ReviewStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type Severity = 'error' | 'warning' | 'info';
export type Category = 'readability' | 'performance' | 'security' | 'react-antipattern';

export interface ReviewSummary {
  totalIssues: number;
  critical: number;
  warnings: number;
  infos: number;
  overallAssessment: string;
}

export interface ReviewMetrics {
  filesReviewed: number;
  linesAnalyzed: number;
  processingTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface Review {
  _id: string;
  repositoryId: string;
  installationId: string;
  organizationId?: string;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
  prUrl: string;
  commitSha: string;
  status: ReviewStatus;
  jobId?: string;
  summary?: ReviewSummary;
  metrics?: ReviewMetrics;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewComment {
  _id: string;
  reviewId: string;
  githubCommentId?: number;
  filePath: string;
  line: number;
  endLine?: number;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  suggestion?: string;
  postedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Billing types
export type PlanType = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export interface SubscriptionLimits {
  reviewsPerMonth: number; // -1 for unlimited
  repositoriesMax: number; // -1 for unlimited
}

export interface Subscription {
  _id: string;
  userId?: string;
  organizationId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  limits: SubscriptionLimits;
  createdAt: string;
  updatedAt: string;
}

export interface Usage {
  _id: string;
  subscriptionId: string;
  organizationId?: string;
  reviewId: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// Webhook event types
export interface PullRequestEvent {
  action: 'opened' | 'reopened' | 'synchronize' | 'closed';
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    user: {
      login: string;
    };
    head: {
      sha: string;
      ref: string;
    };
    base: {
      ref: string;
    };
    html_url: string;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  installation: {
    id: number;
  };
}
