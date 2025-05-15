import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, TextInput, ScrollView, Switch, Linking } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type ProfileScreenProps = {
  navigation: any;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, setUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);

  const handleLogout = async () => {
    try {
      setUser(null);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const updateProfile = async () => {
    try {
      if (!user) return;
      
      setUser({
        ...user,
        displayName
      });
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://your-app-domain.com/privacy-policy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://your-app-domain.com/terms-of-service');
  };

  const clearAppData = () => {
    Alert.alert(
      'Clear App Data',
      'Are you sure you want to clear all app data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement data clearing logic
            Alert.alert('Success', 'App data cleared successfully');
          }
        }
      ]
    );
  };

  const theme = {
    background: isDarkMode ? '#1c1c1c' : '#fff',
    card: isDarkMode ? '#2a2a2a' : '#f8f8f8',
    text: isDarkMode ? '#fff' : '#000',
    border: isDarkMode ? '#444' : '#ddd',
    input: isDarkMode ? '#333' : '#fff',
    secondaryText: isDarkMode ? '#888' : '#666',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={[styles.scrollView, { backgroundColor: theme.background }]}>
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          {/* Profile Section */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.profileIcon, { backgroundColor: theme.input }]}>
                <Ionicons name="person" size={32} color={theme.text} />
              </View>
              <View style={styles.profileInfo}>
                <TextInput
                  style={[styles.profileInput, { color: theme.text }]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.secondaryText}
                />
                <TouchableOpacity 
                  style={styles.updateButton} 
                  onPress={updateProfile}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* App Preferences */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings-outline" size={24} color={theme.text} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>App Preferences</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#2a2a2a', true: '#007AFF' }}
                thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Enable Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#2a2a2a', true: '#007AFF' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Privacy */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-outline" size={24} color={theme.text} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy</Text>
            </View>
            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('DataUsage')}>
              <Text style={styles.linkText}>Data Usage</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={openPrivacyPolicy}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={openTermsOfService}>
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={24} color={theme.text} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
            </View>
            <Text style={[styles.versionText, { color: theme.secondaryText }]}>Version 1.0.0</Text>
            <Text style={[styles.copyrightText, { color: theme.secondaryText }]}>© 2024 Your App Name. All rights reserved.</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={theme.text} style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileInput: {
    flex: 1,
    fontSize: 18,
    padding: 0,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  dangerText: {
    color: '#FF3B30',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 14,
  },
}); 