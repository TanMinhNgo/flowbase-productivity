'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';
export const aiTemplateKeys = {
  all: ['ai-templates'] as const,
  detail: (id: number) => ['ai-templates', id] as const,
};
export function useAiTemplates<T>() {
  return useQuery({
    queryKey: aiTemplateKeys.all,
    queryFn: () => apiRequest<T>('/api/ai-templates'),
  });
}
export function useAiTemplate<T>(id: number) {
  return useQuery({
    queryKey: aiTemplateKeys.detail(id),
    queryFn: () => apiRequest<T>(`/api/ai-templates/${id}`),
    enabled: id > 0,
  });
}
export function useGenerateAiTemplate<T>() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (prompt: string) =>
      apiRequest<{ item: T }>('/api/ai-templates', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: aiTemplateKeys.all }),
  });
}
export function useUpdateAiTemplate<T>() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiRequest<{ item: T }>(`/api/ai-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      Promise.all([
        client.invalidateQueries({ queryKey: aiTemplateKeys.all }),
        client.invalidateQueries({
          queryKey: aiTemplateKeys.detail(variables.id),
        }),
      ]),
  });
}
export function useDeleteAiTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/ai-templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: aiTemplateKeys.all }),
  });
}
