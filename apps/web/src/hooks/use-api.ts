'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => api.getMe(),
    retry: false,
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.getOrganizations(),
  });
}

export function useRepositories(installationId: string | undefined) {
  return useQuery({
    queryKey: ['repositories', installationId],
    queryFn: () => api.getRepositories(installationId!),
    enabled: !!installationId,
  });
}

export function useOrganizationRepositories(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['repositories', 'organization', organizationId],
    queryFn: () => api.getRepositoriesByOrganization(organizationId!),
    enabled: !!organizationId,
  });
}

export function useAllRepositories() {
  return useQuery({
    queryKey: ['repositories', 'all'],
    queryFn: () => api.getAllRepositories(),
  });
}

export function useReviews(params?: {
  organizationId?: string;
  repositoryId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => api.getReviews(params || {}),
  });
}

export function useReview(id: string | undefined) {
  return useQuery({
    queryKey: ['review', id],
    queryFn: () => api.getReview(id!),
    enabled: !!id,
  });
}

export function useReviewStats(organizationId?: string) {
  return useQuery({
    queryKey: ['reviewStats', organizationId],
    queryFn: () => api.getReviewStats(organizationId),
  });
}

export function useSubscription(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['subscription', organizationId],
    queryFn: () => api.getSubscription(organizationId!),
    enabled: !!organizationId,
  });
}

export function useToggleRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repoId, isActive }: { repoId: string; isActive: boolean }) =>
      api.toggleRepository(repoId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: ({
      organizationId,
      successUrl,
      cancelUrl,
    }: {
      organizationId: string;
      successUrl: string;
      cancelUrl: string;
    }) => api.createCheckout(organizationId, successUrl, cancelUrl),
  });
}
