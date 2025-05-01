import NotificationService from '../services/NotificationService';

export type NotificationType = {
  key: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
};

export const NOTIFICATION_CONFIGS: Record<string, NotificationType> = {
  dailyQuotes: {
    key: 'dailyQuotes',
    title: 'Daily Quote',
    body: 'Time for your daily philosophical insight!',
    hour: 9,
    minute: 0
  },
  reminders: {
    key: 'reminders',
    title: 'Daily Reminder',
    body: 'Time to reflect on your philosophical journey!',
    hour: 20,
    minute: 0
  }
};

export const handleNotificationScheduling = async (
  type: keyof typeof NOTIFICATION_CONFIGS,
  enabled: boolean
) => {
  const config = NOTIFICATION_CONFIGS[type];
  if (enabled) {
    await NotificationService.scheduleDailyNotification(
      config.title,
      config.body,
      config.hour,
      config.minute
    );
  } else {
    const notifications = await NotificationService.getAllScheduledNotifications();
    notifications
      .filter(n => n.content.title === config.title)
      .forEach(n => NotificationService.cancelNotification(n.identifier));
  }
}; 