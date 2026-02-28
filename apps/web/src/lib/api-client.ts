const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }

    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Generic request
  request: request,

  // Auth
  getAuthUrl: () => `${API_URL}/auth/github`,

  refreshToken: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  // Users
  getMe: () => request<{ data: User }>('/users/me'),

  // Organizations
  getOrganizations: () => request<{ data: Organization[] }>('/organizations'),

  createOrganization: (name: string) =>
    request<{ data: Organization }>('/organizations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  // Repositories
  getRepositories: (installationId: string) =>
    request<{ data: Repository[] }>(`/github/installations/${installationId}/repositories`),

  getRepositoriesByOrganization: (organizationId: string) =>
    request<{ data: Repository[] }>(`/github/organizations/${organizationId}/repositories`),

  getAllRepositories: () =>
    request<{ data: Repository[] }>("/github/my-repositories"),

  updateRepositorySettings: (repoId: string, settings: Record<string, unknown>) =>
    request<{ data: Repository }>(`/github/repositories/${repoId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),

  toggleRepository: (repoId: string, isActive: boolean) =>
    request<{ data: Repository }>(`/github/repositories/${repoId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  // Reviews
  getReviews: (params: { organizationId?: string; repositoryId?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params.organizationId) searchParams.set('organizationId', params.organizationId);
    if (params.repositoryId) searchParams.set('repositoryId', params.repositoryId);
    if (params.limit) searchParams.set('limit', params.limit.toString());

    return request<{ data: { reviews: Review[]; total: number } }>(
      `/reviews?${searchParams.toString()}`,
    );
  },

  getReview: (id: string) =>
    request<{ data: { review: Review; comments: ReviewComment[] } }>(`/reviews/${id}`),

  getReviewStats: (organizationId?: string) => {
    const searchParams = organizationId ? `?organizationId=${organizationId}` : '';
    return request<{ data: ReviewStats }>(`/reviews/stats${searchParams}`);
  },

  // Billing
  getSubscription: (organizationId: string) =>
    request<{ data: { subscription: Subscription; usage: Usage } }>(
      `/billing/subscription?organizationId=${organizationId}`,
    ),

  createCheckout: (organizationId: string, successUrl: string, cancelUrl: string) =>
    request<{ data: { url: string } }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ organizationId, successUrl, cancelUrl }),
    }),

  getPortalUrl: (organizationId: string, returnUrl: string) =>
    request<{ data: { url: string } }>(
      `/billing/portal?organizationId=${organizationId}&returnUrl=${encodeURIComponent(returnUrl)}`,
    ),
};

// Types
export interface User {
  _id: string;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  organizationId?: string;
  onboardingCompleted: boolean;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  settings: Record<string, unknown>;
}

export interface Repository {
  _id: string;
  installationId: string;
  githubRepoId: number;
  fullName: string;
  name: string;
  private: boolean;
  isActive: boolean;
  settings: {
    severityThreshold?: string;
    enabledCategories?: string[];
    excludePatterns?: string[];
  };
}

export interface Review {
  _id: string;
  repositoryId: string;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
  prUrl: string;
  commitSha: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: {
    totalIssues: number;
    critical: number;
    warnings: number;
    infos: number;
    overallAssessment: string;
  };
  metrics?: {
    filesReviewed: number;
    processingTimeMs: number;
    costUsd: number;
  };
  createdAt: string;
  completedAt?: string;
}

export interface ReviewComment {
  _id: string;
  reviewId: string;
  filePath: string;
  line: number;
  category: string;
  severity: string;
  title: string;
  description: string;
  suggestion?: string;
}

export interface ReviewStats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  avgProcessingTime: number;
  totalCost: number;
}

export interface Subscription {
  _id: string;
  plan: 'free' | 'pro';
  status: string;
  limits: {
    reviewsPerMonth: number;
    repositoriesMax: number;
  };
  currentPeriodEnd: string;
}

export interface Usage {
  used: number;
  limit: number;
  periodEnd: string;
}
