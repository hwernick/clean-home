import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function DataUsageScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Data</Text>
          
          <View style={styles.infoItem}>
            <Icon name="chatbubble-outline" size={24} color="#fff" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Chat History</Text>
              <Text style={styles.infoText}>
                We store your chat history to provide you with a seamless experience and allow you to access your conversations across devices.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="person-outline" size={24} color="#fff" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Profile Information</Text>
              <Text style={styles.infoText}>
                Your profile information helps us personalize your experience and maintain your account security.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="settings-outline" size={24} color="#fff" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>App Preferences</Text>
              <Text style={styles.infoText}>
                We store your app preferences to maintain your customized settings and provide a consistent experience.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="shield-checkmark-outline" size={24} color="#fff" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Data Security</Text>
              <Text style={styles.infoText}>
                Your data is encrypted and stored securely. We never share your personal information with third parties without your explicit consent.
              </Text>
            </View>
          </View>
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
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
}); 