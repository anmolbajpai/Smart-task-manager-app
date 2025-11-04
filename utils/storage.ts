import { DoseLog, MedicationSchedule, TaskItem } from '@/types/task';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TASKS: 'stm.tasks.v1',
  MEDS: 'stm.meds.v1',
  DOSE_LOGS: 'stm.doseLogs.v1',
} as const;

export async function loadTasks(): Promise<TaskItem[]> {
  const raw = await AsyncStorage.getItem(KEYS.TASKS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TaskItem[];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: TaskItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}

export async function loadMedications(): Promise<MedicationSchedule[]> {
  const raw = await AsyncStorage.getItem(KEYS.MEDS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MedicationSchedule[];
  } catch {
    return [];
  }
}

export async function saveMedications(meds: MedicationSchedule[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.MEDS, JSON.stringify(meds));
}

export async function loadDoseLogs(): Promise<DoseLog[]> {
  const raw = await AsyncStorage.getItem(KEYS.DOSE_LOGS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DoseLog[];
  } catch {
    return [];
  }
}

export async function saveDoseLogs(logs: DoseLog[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.DOSE_LOGS, JSON.stringify(logs));
}


