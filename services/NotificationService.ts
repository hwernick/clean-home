import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should be presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,      // Show alert even when app is in foreground
    shouldPlaySound: true,      // Play sound for notifications
    shouldSetBadge: true,       // Show badge count on app icon
  }),
});

class NotificationService {
  // Request permission to send notifications
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return true;
  }

  // Schedule a daily notification
  static async scheduleDailyNotification(
    title: string,
    body: string,
    hour: number,
    minute: number
  ) {
    const trigger = new Date();
    trigger.setHours(hour, minute, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (trigger.getTime() <= Date.now()) {
      trigger.setDate(trigger.getDate() + 1);
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: 60 * 60 * 24, // 24 hours
        repeats: true,
      },
    });
  }

  // Send an immediate notification
  static async sendImmediateNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null means send immediately
    });
  }

  // Cancel all scheduled notifications
  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get all scheduled notifications
  static async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Cancel a specific notification by ID
  static async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Add a notification response listener
  static addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Add a notification received listener
  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Set notification handler
  static setNotificationHandler(handler: Notifications.NotificationHandler) {
    Notifications.setNotificationHandler(handler);
  }
}

export default NotificationService; 