'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';
export const whiteboardKeys = { all: ['whiteboards'] as const };
export function useWhiteboards<T>() {
  return useQuery({
    queryKey: whiteboardKeys.all,
    queryFn: () => apiRequest<T>('/api/whiteboards'),
  });
}
export function useWhiteboardMutation<T>() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id?: number;
      body: Record<string, unknown>;
    }) =>
      apiRequest<{ item: T }>(
        id ? `/api/whiteboards/${id}` : '/api/whiteboards',
        { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) },
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: whiteboardKeys.all }),
  });
}
export function useDeleteWhiteboard() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/whiteboards/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: whiteboardKeys.all }),
  });
}
export function useGenerateWhiteboardDiagram<T>() {
  return useMutation({
    mutationFn: (body: { prompt: string }) =>
      apiRequest<T>('/api/whiteboards/diagram', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}
