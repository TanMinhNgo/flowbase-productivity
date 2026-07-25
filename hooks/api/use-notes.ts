'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';
export const noteKeys = { all: ['notes'] as const };
export function useNotes<T>() {
  return useQuery({
    queryKey: noteKeys.all,
    queryFn: () => apiRequest<T>('/api/notes'),
  });
}
export function useNoteMutation<T>() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id?: number;
      body: Record<string, unknown>;
    }) =>
      apiRequest<{ item: T }>(id ? `/api/notes/${id}` : '/api/notes', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: noteKeys.all }),
  });
}
export function useDeleteNote() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permanent }: { id: number; permanent?: boolean }) =>
      apiRequest(`/api/notes/${id}${permanent ? '?permanent=true' : ''}`, {
        method: 'DELETE',
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: noteKeys.all }),
  });
}
export function useRefineNote() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<{ text: string }>('/api/notes/refine', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}
