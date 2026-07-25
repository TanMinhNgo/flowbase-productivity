'use client';

import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';

export type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function useAiAssistant() {
  return useMutation({
    mutationFn: (messages: AssistantMessage[]) =>
      apiRequest<{ text: string }>('/api/ai-assistant', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      }),
  });
}
