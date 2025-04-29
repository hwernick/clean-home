import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../authService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState(userProfile?.preferences?.notifications ?? true);

  const handleLogout = async () => {
    try {
      await logoutUser();
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'preferences.notifications': value
      });
      setNotifications(value);
    } catch (error) {
      console.error('Error updating notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <Icon name="person-circle" size={80} color="#fff" />
          <Text style={styles.username}>{user?.displayName || 'User Name'}</Text>
          <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Icon name="notifications-outline" size={24} color="#fff" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#3a3a3c', true: 'blue' }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : notifications ? '#34c759' : '#f4f3f4'}
              ios_backgroundColor="#3a3a3c"
              style={styles.switch}
            />
          </View>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Privacy')}
          >
            <View style={styles.menuItemLeft}>
              <Icon name="lock-closed-outline" size={24} color="#fff" />
              <Text style={styles.menuItemText}>Privacy</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <View style={styles.menuItemLeft}>
              <Icon name="help-circle-outline" size={24} color="#fff" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  email: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 16,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 