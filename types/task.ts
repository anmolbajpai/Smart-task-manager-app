export type TaskMode = 'urgent' | 'important' | 'optional';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  mode?: TaskMode;
  priority?: TaskPriority;
  dueDate?: string; // ISO string
  timeLimitMinutes?: number;
  completed: boolean;
  estimatedTimeMinutes?: number;
  category?: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  aiSuggested?: boolean;
}

export interface MedicationSchedule {
  id: string;
  name: string;
  dosage: string; // e.g., "500mg"
  frequency: 'daily' | 'weekly' | 'custom';
  times: string[]; // HH:mm in 24h
  daysOfWeek?: number[]; // 0-6, Sun-Sat for weekly/custom
  startDate?: string; // ISO
  endDate?: string; // ISO
  notes?: string;
  createdAt?: string; // ISO
}

export interface DoseLog {
  id: string;
  medicationId: string;
  takenAt: string; // ISO
  dose?: string;
  notes?: string;
}


