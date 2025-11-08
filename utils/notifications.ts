import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';


export const scheduleMedicationNotification = async (medication: any, time: string) => {
  try {
    const [hour, minute] = time.split(':').map(Number);

    const now = new Date();
    const trigger = new Date();
    trigger.setHours(hour, minute, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (trigger <= now) {
      trigger.setDate(trigger.getDate() + 1);
    }

    // ✅ Use "CALENDAR" trigger with explicit type
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Medication Reminder`,
        body: `Time to take your ${medication.name} (${medication.dosage})`,
        sound: true,
        data: { medicationId: medication.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true, // 🔁 daily reminder at same time
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule medication notification:', error);
  }
};


export async function ensureNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const ask = await Notifications.requestPermissionsAsync();
  return ask.granted || ask.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function scheduleReminder(id: string, title: string, body: string, when: Date) {
  const allowed = await ensureNotificationPermissions();
  if (!allowed) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: { id } },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    },
  });
}

export async function cancelReminder(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {}
}

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function configureChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}


