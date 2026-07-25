'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';
export const calendarKeys = { all: ['calendar-items'] as const };
export function useCalendarItems<T>() { return useQuery({ queryKey: calendarKeys.all, queryFn: () => apiRequest<T>('/api/calendar-items') }); }
export function useCalendarItemMutation<T>() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, body }: { id?: number; body: Record<string, unknown> }) => apiRequest<{ item: T }>(id ? `/api/calendar-items/${id}` : '/api/calendar-items', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) }), onSuccess: () => client.invalidateQueries({ queryKey: calendarKeys.all }) }); }
export function useDeleteCalendarItem() { const client = useQueryClient(); return useMutation({ mutationFn: (id: number) => apiRequest(`/api/calendar-items/${id}`, { method: 'DELETE' }), onSuccess: () => client.invalidateQueries({ queryKey: calendarKeys.all }) }); }
