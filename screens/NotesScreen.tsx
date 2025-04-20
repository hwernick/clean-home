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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OPENAI_API_KEY } from '@env';

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
  const [notes, setNotes] = useState(''); // Store the notes
  const [title, setTitle] = useState('Notes'); // Title for the notes
  const [loading, setLoading] = useState(false); // Loading state while fetching notes
  const [saving, setSaving] = useState(false); // Saving state while saving notes
  const [isEditing, setIsEditing] = useState(false); // Whether the user is editing
  const [tempTitle, setTempTitle] = useState('Notes'); // Temporary title while editing
  const [tempNotes, setTempNotes] = useState(''); // Temporary notes content while editing

  // Set up navigation options (e.g., back button)
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
    });
  }, [navigation]);

  // Load and generate initial notes on screen mount
  useEffect(() => {
    loadNotes();
    generateInitialNotes();
  }, []);

  // Update temporary title and notes when the main title or notes change
  useEffect(() => {
    setTempTitle(title);
    setTempNotes(notes);
  }, [title, notes]);

  // Load notes from AsyncStorage
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

  // Save notes to AsyncStorage
  const saveNotes = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(`notes_${conversationId}`, notes);
      await AsyncStorage.setItem(`notes_title_${conversationId}`, title);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
    setSaving(false);
  };

  // Generate initial notes from OpenAI API based on the conversation
  const generateInitialNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `
              You are an assistant responsible for dynamically organizing the user's thoughts in a question-based outline from a Socratic dialogue. Your goal is to structure insights clearly and adaptively as new information emerges.

Core Objectives:
Focus on Questions: Every entry should center around a question.

Evidence: Include key points or discussions related to the question.

Conclusion: Provide the user's takeaways or insights.

Structure:
Track questions in a linear, chronological list.
Do not nest questions.
Each question should have its own section, formatted like this:

Question: [Insert question]

Evidence:
• [Insert relevant point or discussion]
• [Insert additional point as needed]
• [Add new evidence here as it arises]

Conclusion: [Insert or update the user's current insight]
Update Behavior:
Adapt to new insights:

Add new questions as they arise.

Continuously update the Evidence and Conclusion sections for each question. Do not overwrite user edits. Append or adjust insights while preserving any manual changes.

Formatting:
Keep notes clean, concise, and easy to read.
Use bullet points in the Evidence section.
Reflect conceptual relationships through content, not through indentation or nesting.
Leave questions open if the user is still exploring them (e.g., "Still reflecting on this question").
            `,
            },
            {
              role: 'user',
              content: `Please create organized notes from this conversation:\n\n${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate notes');
      }

      const data = await response.json();
      const generatedNotes = data.choices[0].message.content;

      // Generate a title based on the first user message
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        const generatedTitle = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
        setTitle(`Notes: ${generatedTitle}`);
      }

      setNotes(generatedNotes);
      await saveNotes();
    } catch (error) {
      console.error('Error generating notes:', error);
      // Fallback to basic formatting if API call fails
      const basicNotes = messages.map(msg => 
        `## ${msg.role === 'user' ? 'You' : 'Assistant'}\n\n${msg.content}\n\n---\n\n`
      ).join('');
      setNotes(basicNotes);
      await saveNotes();
    }
    setLoading(false);
  };

  // Save changes after editing
  const saveChanges = () => {
    setTitle(tempTitle);
    setNotes(tempNotes);
    setIsEditing(false);
    saveNotes();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.mainContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Generating notes...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.notesScrollView}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={styles.notesContentContainer}
                showsVerticalScrollIndicator={false}
              >
                {isEditing ? (
                  <TextInput
                    style={styles.notesInput}
                    value={tempNotes}
                    onChangeText={setTempNotes}
                    placeholder="Your notes will appear here..."
                    placeholderTextColor="#888"
                    multiline
                    scrollEnabled={false}
                    textAlignVertical="top"
                  />
                ) : (
                  <Text style={styles.notesText}>{notes}</Text>
                )}
              </ScrollView>
            )}
            
            {saving && (
              <View style={styles.savingIndicator}>
                <Text style={styles.savingText}>Saving...</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.floatingEditButton}
              onPress={() => {
                if (isEditing) {
                  saveChanges();
                } else {
                  setIsEditing(true);
                }
              }}
            >
              <Icon 
                name={isEditing ? "checkmark" : "pencil"} 
                size={20} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
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
  notesScrollView: {
    flex: 1,
  },
  notesContentContainer: {
    padding: 8,
  },
  notesInput: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 1000,
  },
  notesText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
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
  floatingEditButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
});
