import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NotesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Notes'>;
  route: {
    params: {
      conversationId: string;
      messages: Array<{ role: string; content: string }>;
    };
  };
};

export default function NotesScreen({ navigation, route }: NotesScreenProps) {
  const { conversationId, messages } = route.params;
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('Notes');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Notes',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 8, marginBottom: 16 }}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={saveNotes}
          style={{ marginRight: 8, marginBottom: 16 }}
        >
          <Icon name="save-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, notes]);

  useEffect(() => {
    loadNotes();
    generateInitialNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem(`notes_${conversationId}`);
      if (storedNotes) {
        setNotes(storedNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(`notes_${conversationId}`, notes);
      // Also save the title
      await AsyncStorage.setItem(`notes_title_${conversationId}`, title);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
    setSaving(false);
  };

  const generateInitialNotes = async () => {
    if (notes) return; // Don't generate if notes already exist
    
    setLoading(true);
    try {
      // Format the conversation into notes
      let formattedNotes = '';
      
      // Add a header
      formattedNotes += '# Conversation Notes\n\n';
      
      // Add each message with proper formatting
      messages.forEach((msg, index) => {
        const role = msg.role === 'user' ? 'You' : 'Assistant';
        formattedNotes += `## ${role} (Message ${index + 1})\n\n`;
        formattedNotes += `${msg.content}\n\n`;
        
        // Add a separator between messages
        if (index < messages.length - 1) {
          formattedNotes += '---\n\n';
        }
      });
      
      // Add a summary section
      formattedNotes += '## Summary\n\n';
      formattedNotes += 'Key points from this conversation:\n\n';
      formattedNotes += '- [Add key point 1]\n';
      formattedNotes += '- [Add key point 2]\n';
      formattedNotes += '- [Add key point 3]\n\n';
      
      // Add an action items section
      formattedNotes += '## Action Items\n\n';
      formattedNotes += '- [ ] [Add action item 1]\n';
      formattedNotes += '- [ ] [Add action item 2]\n';
      
      setNotes(formattedNotes);
      
      // Generate a title based on the first user message
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        const generatedTitle = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
        setTitle(`Notes: ${generatedTitle}`);
      }
    } catch (error) {
      console.error('Error generating notes:', error);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.mainContainer}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Notes Title"
            placeholderTextColor="#888"
          />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Generating notes...</Text>
            </View>
          ) : (
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Your notes will appear here..."
              placeholderTextColor="#888"
              multiline
              textAlignVertical="top"
            />
          )}
          
          {saving && (
            <View style={styles.savingIndicator}>
              <Text style={styles.savingText}>Saving...</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  keyboardAvoid: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  notesInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    padding: 8,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  savingIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
  },
  savingText: {
    color: '#fff',
    fontSize: 14,
  },
}); 