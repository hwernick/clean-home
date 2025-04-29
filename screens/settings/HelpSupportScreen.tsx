import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function HelpSupportScreen() {
  const faqItems = [
    {
      question: 'How do I start a dialogue?',
      answer: 'To start a dialogue, go to the Home screen and tap on "Start Dialogue". You can choose from different philosophical topics or start with a custom question.'
    },
    {
      question: 'How do I save my notes?',
      answer: 'Your notes are automatically saved when you create them during a dialogue. You can access all your saved notes from the Notes tab.'
    },
    {
      question: 'Can I customize my experience?',
      answer: 'Yes! You can customize various aspects of the app through the Profile screen, including notifications, privacy settings, and more.'
    },
    {
      question: 'How do I delete my account?',
      answer: 'To delete your account, go to the Profile screen, tap on Privacy, and select "Delete Account". Please note that this action cannot be undone.'
    }
  ];

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@cleanhome.com');
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://cleanhome.com/support');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.question}>{item.question}</Text>
              <Text style={styles.answer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <TouchableOpacity style={styles.contactItem} onPress={handleEmailSupport}>
            <Icon name="mail-outline" size={24} color="#fff" />
            <Text style={styles.contactText}>Email Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem} onPress={handleVisitWebsite}>
            <Icon name="globe-outline" size={24} color="#fff" />
            <Text style={styles.contactText}>Visit Support Website</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>March 2024</Text>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  contactText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: {
    fontSize: 16,
    color: '#888',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
  },
}); 