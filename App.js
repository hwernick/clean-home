import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { OPENAI_API_KEY } from '@env';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a Socratic tutor who only responds with thoughtful, guiding questions.',
            },
            ...updatedMessages,
          ],
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;

      if (reply) {
        setMessages([...updatedMessages, { role: 'assistant', content: reply.trim() }]);
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: '⚠️ No response received.' }]);
      }
    } catch (err) {
      setMessages([...updatedMessages, { role: 'assistant', content: '⚠️ Error contacting assistant.' }]);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.mainContainer}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            ref={scrollRef}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.messageRow,
                  msg.role === 'user' ? styles.userAlign : styles.assistantAlign,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userText : styles.assistantText,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            ))}
            {loading && (
              <View style={[styles.messageRow, styles.assistantAlign]}>
                <ActivityIndicator size="small" color="#ccc" />
              </View>
            )}
          </ScrollView>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Reply to Claude..."
              placeholderTextColor="#888"
              multiline
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={styles.sendButton} 
              onPress={sendMessage}
              disabled={loading || !input.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  messageRow: {
    marginBottom: 18,
    maxWidth: '90%',
  },
  assistantAlign: {
    alignSelf: 'flex-start',
  },
  userAlign: {
    alignSelf: 'flex-end',
  },
  assistantText: {
    color: '#c5c5c5',
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: '#f1f1f1',
    fontSize: 16,
    lineHeight: 24,
  },
  inputWrapper: {
    padding: 12,
    backgroundColor: '#1c1c1c',
    borderTopWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
