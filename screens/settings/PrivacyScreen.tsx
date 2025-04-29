import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function PrivacyScreen() {
  const { user, userProfile } = useAuth();
  const [dataCollection, setDataCollection] = useState(userProfile?.preferences?.dataCollection ?? true);

  const toggleSetting = async (setting: string, value: boolean) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`preferences.${setting}`]: value
      });
      
      if (setting === 'dataCollection') {
        setDataCollection(value);

      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Implement account deletion logic
            Alert.alert('Coming Soon', 'Account deletion will be implemented in a future update.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Icon name="shield-outline" size={24} color="#fff" />
              <Text style={styles.menuItemText}>Data Collection</Text>
            </View>
            <Switch
              value={dataCollection}
              onValueChange={(value) => toggleSetting('dataCollection', value)}
              trackColor={{ false: '#3a3a3c', true: 'blue' }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : dataCollection ? 'blue' : '#f4f3f4'}
              ios_backgroundColor="#3a3a3c"
              style={styles.switch}
            />
          </View>


          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Icon name="key-outline" size={24} color="#fff" />
              <Text style={styles.menuItemText}>Change Password</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Icon name="lock-closed-outline" size={24} color="#fff" />
              <Text style={styles.menuItemText}>Two-Factor Authentication</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.menuItem, styles.deleteAccount]} 
          onPress={handleDeleteAccount}
        >
          <Icon name="trash-outline" size={24} color="#ff3b30" />
          <Text style={[styles.menuItemText, styles.deleteText]}>Delete Account</Text>
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
  deleteAccount: {
    marginTop: 'auto',
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#ff3b30',
  },
}); 