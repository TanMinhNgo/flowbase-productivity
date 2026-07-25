'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';
export const liveblocksKeys = { users: ['liveblocks', 'users'] as const };
export function useLiveblocksUsers<T>() {
  return useQuery({
    queryKey: liveblocksKeys.users,
    queryFn: () => apiRequest<T>('/api/liveblocks/users'),
  });
}
export function useLiveblocksAuth<T>() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<T>('/api/liveblocks/auth', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}
