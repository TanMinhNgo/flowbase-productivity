'use client';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/hooks/api/client';
export function useAssemblyAiToken() { return useMutation({ mutationFn: () => apiRequest<{ token: string }>('/api/assemblyai/token', { method: 'POST' }) }); }
