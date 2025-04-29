import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function PrivacyScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

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
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('DataUsage')}
          >
            <View style={styles.menuItemLeft}>
              <Icon name="shield-outline" size={24} color="#fff" />
              <Text style={styles.menuItemText}>Data Collection</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>

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
          <View style={styles.deleteAccountContainer}>
            <Text style={[styles.menuItemText, styles.deleteText]}>Delete Account</Text>
          </View>
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
  infoText: {
    fontSize: 14,
    color: '#888',
  },
  deleteAccount: {
    marginTop: 'auto',
    borderBottomWidth: 0,
  },
  deleteAccountContainer: {
    flex: 1,
    alignItems: 'center',
  },
  deleteText: {
    color: '#ff3b30',
  },
}); 