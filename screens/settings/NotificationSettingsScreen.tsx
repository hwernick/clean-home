import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, Platform, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import NotificationService from '../../services/NotificationService';

interface NotificationPreferences {
  dailyQuotes: boolean;
  newFeatures: boolean;
  reminders: boolean;
  sound: boolean;
  vibration: boolean;
}

export default function NotificationSettingsScreen() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyQuotes: true,
    newFeatures: true,
    reminders: true,
    sound: true,
    vibration: true,
  });

  useEffect(() => {
    loadPreferences();
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    const hasPermission = await NotificationService.requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Notification Permission Required',
        'Please enable notifications in your device settings to receive updates.'
      );
    }
  };

  const loadPreferences = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.preferences?.notifications) {
          setPreferences(userData.preferences.notifications);
        }
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;
    try {
      // First update the local state to make the UI responsive
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      
      // Then update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        'preferences.notifications': newPreferences
      });

      // Handle notification scheduling based on preferences
      try {
        if (key === 'dailyQuotes' && value) {
          await NotificationService.scheduleDailyNotification(
            'Daily Quote',
            'Time for your daily philosophical insight!',
            9, // 9 AM
            0  // 0 minutes
          );
        } else if (key === 'dailyQuotes' && !value) {
          // Cancel daily quote notifications
          const notifications = await NotificationService.getAllScheduledNotifications();
          notifications
            .filter(n => n.content.title === 'Daily Quote')
            .forEach(n => NotificationService.cancelNotification(n.identifier));
        }

        if (key === 'reminders' && value) {
          await NotificationService.scheduleDailyNotification(
            'Daily Reminder',
            'Time to reflect on your philosophical journey!',
            20, // 8 PM
            0   // 0 minutes
          );
        } else if (key === 'reminders' && !value) {
          // Cancel reminder notifications
          const notifications = await NotificationService.getAllScheduledNotifications();
          notifications
            .filter(n => n.content.title === 'Daily Reminder')
            .forEach(n => NotificationService.cancelNotification(n.identifier));
        }

        // Update notification handler settings based on sound/vibration preferences
        if (key === 'sound' || key === 'vibration') {
          NotificationService.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: newPreferences.sound,
              shouldSetBadge: true,
            }),
          });
        }
      } catch (notificationError) {
        console.error('Error handling notifications:', notificationError);
        // Don't show an alert for notification errors, just log them
        // This ensures the UI remains responsive even if notification scheduling fails
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      // Revert the local state if Firestore update fails
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const renderSwitch = (key: keyof NotificationPreferences, label: string, description?: string) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={preferences[key]}
        onValueChange={(value) => updatePreference(key, value)}
        trackColor={{ false: '#3a3a3c', true: 'blue' }}
        thumbColor={Platform.OS === 'ios' ? '#fff' : preferences[key] ? 'blue' : '#f4f3f4'}
        ios_backgroundColor="#3a3c3c"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          {renderSwitch('dailyQuotes', 'Daily Quotes', 'Receive daily philosophical quotes and insights')}
          {renderSwitch('reminders', 'Reminders', 'Receive daily reminders for your philosophical journey')}
          {renderSwitch('newFeatures', 'New Features', 'Get notified about app updates and new features')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          {renderSwitch('sound', 'Sound', 'Play sound for notifications')}
          {renderSwitch('vibration', 'Vibration', 'Vibrate for notifications')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#888',
  },
}); 