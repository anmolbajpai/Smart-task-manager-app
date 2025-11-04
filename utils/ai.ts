import { TaskItem, TaskMode, TaskPriority } from '@/types/task';

function computeHoursUntil(dateIso?: string): number | undefined {
  if (!dateIso) return undefined;
  const diffMs = new Date(dateIso).getTime() - Date.now();
  return diffMs / (1000 * 60 * 60);
}

export function suggestModeAndPriority(input: Partial<TaskItem>): {
  mode: TaskMode;
  priority: TaskPriority;
} {
  const hours = computeHoursUntil(input.dueDate);
  const est = input.estimatedTimeMinutes ?? input.timeLimitMinutes ?? 0;

  if (hours !== undefined && hours <= 6) {
    return { mode: 'urgent', priority: hours <= 1 ? 'critical' : 'high' };
  }

  if ((input.title?.toLowerCase().includes('medicat') || input.category === 'health')) {
    return { mode: 'important', priority: 'high' };
  }

  if (est >= 120) {
    return { mode: 'important', priority: 'medium' };
  }

  return { mode: 'optional', priority: 'low' };
}


