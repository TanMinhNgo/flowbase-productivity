'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';
export const kanbanKeys = {
  all: ['kanban'] as const,
  collaborators: (boardId: number) =>
    ['kanban', boardId, 'collaborators'] as const,
};
export function useKanban<T>() {
  return useQuery({
    queryKey: kanbanKeys.all,
    queryFn: () => apiRequest<T>('/api/kanban'),
  });
}
export function useKanbanMutation<T>() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<T>('/api/kanban', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: kanbanKeys.all }),
  });
}
export function useKanbanCollaborators<T>(boardId: number) {
  return useQuery({
    queryKey: kanbanKeys.collaborators(boardId),
    queryFn: () => apiRequest<T>(`/api/kanban/${boardId}/collaborators`),
    enabled: boardId > 0,
  });
}
export function useInviteKanbanCollaborator<T>() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, email }: { boardId: number; email: string }) =>
      apiRequest<T>(`/api/kanban/${boardId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    onSuccess: (_data, variables) =>
      client.invalidateQueries({
        queryKey: kanbanKeys.collaborators(variables.boardId),
      }),
  });
}
