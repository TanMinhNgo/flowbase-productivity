'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';
export const settingsKey = ['settings'] as const;
export const categoriesKey = ['categories'] as const;
export function useSettings<T>() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => apiRequest<T>('/api/settings'),
  });
}
export function useUpdateSettings<T>() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<T>('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: settingsKey }),
  });
}
export function useCategories<T>() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: () => apiRequest<T>('/api/categories'),
  });
}
export function useCreateCategory<T>() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<T>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: categoriesKey }),
  });
}
export function useUpdateCategory<T>() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiRequest<T>(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: categoriesKey }),
  });
}
export function useDeleteCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: categoriesKey }),
  });
}
