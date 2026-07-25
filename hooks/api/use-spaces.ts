'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';

export const spaceKeys = {
  all: ['spaces'] as const,
  detail: (spaceId: number) => ['spaces', spaceId] as const,
  page: (spaceId: number, pageId: number) => ['spaces', spaceId, 'pages', pageId] as const,
};

export function useSpaces<T>() {
  return useQuery({ queryKey: spaceKeys.all, queryFn: () => apiRequest<T>('/api/spaces') });
}

export function useSpace<T>(spaceId: number) {
  return useQuery({ queryKey: spaceKeys.detail(spaceId), queryFn: () => apiRequest<T>(`/api/spaces/${spaceId}`), enabled: Number.isInteger(spaceId) && spaceId > 0 });
}

export function useSpacePage<T>(spaceId: number, pageId: number) {
  return useQuery({
    queryKey: spaceKeys.page(spaceId, pageId),
    queryFn: () => apiRequest<T>(`/api/spaces/${spaceId}/pages/${pageId}`),
    enabled: Number.isInteger(spaceId) && spaceId > 0 && Number.isInteger(pageId) && pageId > 0,
  });
}

export function useCreateSpace<TItem, TPayload>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TPayload) => apiRequest<{ item: TItem }>('/api/spaces', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: spaceKeys.all }),
  });
}

export function useUpdateSpace<TItem>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, body }: { spaceId: number; body: Record<string, unknown> }) => apiRequest<{ item: TItem }>(`/api/spaces/${spaceId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (_data, variables) => Promise.all([
      queryClient.invalidateQueries({ queryKey: spaceKeys.all }),
      queryClient.invalidateQueries({ queryKey: spaceKeys.detail(variables.spaceId) }),
    ]),
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spaceId: number) => apiRequest(`/api/spaces/${spaceId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: spaceKeys.all }),
  });
}

export function useDuplicateSpace<TItem>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spaceId: number) => apiRequest<{ item: TItem }>(`/api/spaces/${spaceId}`, { method: 'PATCH', body: JSON.stringify({ duplicate: true }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: spaceKeys.all }),
  });
}

export function useCreateSpacePage<TItem>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, title, template }: { spaceId: number; title: string; template: string }) => apiRequest<{ item: TItem }>(`/api/spaces/${spaceId}/pages`, { method: 'POST', body: JSON.stringify({ title, template }) }),
    onSuccess: (_data, variables) => Promise.all([
      queryClient.invalidateQueries({ queryKey: spaceKeys.all }),
      queryClient.invalidateQueries({ queryKey: spaceKeys.detail(variables.spaceId) }),
    ]),
  });
}

export function useUpdateSpacePage<TItem>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, pageId, body }: { spaceId: number; pageId: number; body: Record<string, unknown> }) => apiRequest<{ item: TItem }>(`/api/spaces/${spaceId}/pages/${pageId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (_data, variables) => Promise.all([
      queryClient.invalidateQueries({ queryKey: spaceKeys.detail(variables.spaceId) }),
      queryClient.invalidateQueries({ queryKey: spaceKeys.page(variables.spaceId, variables.pageId) }),
      queryClient.invalidateQueries({ queryKey: spaceKeys.all }),
    ]),
  });
}

export function useDeleteSpacePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, pageId }: { spaceId: number; pageId: number }) => apiRequest(`/api/spaces/${spaceId}/pages/${pageId}`, { method: 'DELETE' }),
    onSuccess: (_data, variables) => Promise.all([
      queryClient.invalidateQueries({ queryKey: spaceKeys.detail(variables.spaceId) }),
      queryClient.invalidateQueries({ queryKey: spaceKeys.all }),
    ]),
  });
}

export function useInviteSpaceCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, email }: { spaceId: number; email: string }) => apiRequest(`/api/spaces/${spaceId}/collaborators`, { method: 'POST', body: JSON.stringify({ email }) }),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: spaceKeys.detail(variables.spaceId) }),
  });
}
