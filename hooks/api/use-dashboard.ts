'use client';

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/hooks/api/client';

export type DashboardData = {
  features: Array<{
    id: 'calendar' | 'tasks' | 'notes' | 'whiteboard' | 'assistant' | 'template';
    label: string;
    status: 'Active' | 'Ready';
    count: number;
    detail: string;
    href: string;
  }>;
  taskSummary: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionPercentage: number;
  };
  upcoming: Array<{
    id: number;
    title: string;
    kind: string;
    category: string;
    scheduledDate: string;
    scheduledTime: string | null;
    categoryColor: string;
  }>;
  activity: Array<{
    id: string;
    label: string;
    title: string;
    timestamp: string;
    type: string;
    href: string;
  }>;
  recentPages: Array<{
    id: string;
    title: string;
    type: string;
    color: string;
    updatedAt: string;
    href: string;
  }>;
  insights: string[];
};

function localDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const dashboardKeys = {
  overview: (today: string) => ['dashboard', today] as const,
};

export function useDashboard() {
  const today = localDateKey();
  return useQuery({
    queryKey: dashboardKeys.overview(today),
    queryFn: () => apiRequest<DashboardData>(`/api/dashboard?today=${today}`),
  });
}
