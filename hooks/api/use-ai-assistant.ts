'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';
export type AssistantMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  actionJson: string | null;
  createdAt: string;
};
export type AssistantAction = {
  id: number;
  type: string;
  summary: string;
  payload: Record<string, unknown>;
};
const keys = {
  all: ['assistant-conversations'] as const,
  detail: (id: number) => ['assistant-conversations', id] as const,
};
export function useAssistantConversations() {
  return useQuery({
    queryKey: keys.all,
    queryFn: () =>
      apiRequest<{
        items: Array<{ id: number; title: string; updatedAt: string }>;
      }>('/api/ai-assistant'),
  });
}
export function useAssistantConversation(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () =>
      apiRequest<{
        conversation: { id: number; title: string };
        messages: AssistantMessage[];
      }>(`/api/ai-assistant/${id}`),
    enabled: id > 0,
  });
}
export function useSendAssistant() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (body: { conversationId?: number; content: string }) =>
      apiRequest<{
        conversationId: number;
        message: AssistantMessage;
        action: AssistantAction | null;
      }>('/api/ai-assistant', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (data) =>
      Promise.all([
        c.invalidateQueries({ queryKey: keys.all }),
        c.invalidateQueries({ queryKey: keys.detail(data.conversationId) }),
      ]),
  });
}
export function useAssistantAction() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirm }: { id: number; confirm: boolean }) =>
      apiRequest<{ status: string; result?: string }>(
        `/api/ai-assistant/actions/${id}`,
        { method: 'PATCH', body: JSON.stringify({ confirm }) },
      ),
    onSuccess: () => c.invalidateQueries({ queryKey: keys.all }),
  });
}
