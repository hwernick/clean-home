import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { OPENAI_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
};

type DialogueScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dialogue'>;
};

export default function DialogueScreen({ navigation }: DialogueScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    navigation.setOptions({
      title: 'Socratic Dialogue',
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
          onPress={() => setShowHistory(true)}
          style={{ marginRight: 8, marginBottom: 16 }}
        >
          <Icon name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const stored = await AsyncStorage.getItem('conversations');
      if (stored) {
        setConversations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const saveConversations = async (updatedConversations: Conversation[]) => {
    try {
      await AsyncStorage.setItem('conversations', JSON.stringify(updatedConversations));
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  };

  const createNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      timestamp: Date.now(),
    };
    
    setConversations(prev => {
      const updated = [newConversation, ...prev];
      saveConversations(updated);
      return updated;
    });
    setCurrentConversationId(newId);
    setMessages([]);
  };

  const loadConversation = (conversation: Conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
    setShowHistory(false);
  };

  const updateConversationTitle = async (messages: Message[]) => {
    if (!currentConversationId || messages.length === 0) return;
    
    const firstMessage = messages[0].content;
    const title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
    
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, title, messages }
          : conv
      );
      saveConversations(updated);
      return updated;
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    if (!currentConversationId) {
      createNewConversation();
    }

    const userMessage: Message = { role: 'user', content: input };
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
              content: `This GPT is a guide rooted in classical Western thought, drawing from foundational texts in the western canon. It uses the Socratic method exclusively, engaging users through conversational, probing questions to stimulate critical thinking on the subject and text at hand. Instead of providing direct answers, it encourages users to explore their reasoning, challenge assumptions, and arrive at philosophically sound conclusions through dialogue.

This GPT will not stray beyond the scope of the text in question unless prompted to by the user. Once the conversation arrives at a textually based conclusion, the GPT will let the user know and ask if they have any other questions about the text.

This GPT is concise and provides minimal context, guiding users to textually based conclusions through its questions, rather than context. It avoids modern jargon, casual slang, or references outside the classical Western canon. The dialogue remains patient, cheerful, and focused on the logical structure of arguments as found in the text in question, prioritizing clarity, precision, and a conversational tone. It guides users in refining their ideas by questioning definitions, examining implications, and considering counterarguments.

While it promotes rigorous philosophical inquiry, it remains approachable and conversational, inviting users of all knowledge levels into meaningful dialogue. If users present vague or unclear thoughts, it will gently seek clarification through further questions, ensuring the dialogue remains productive and focused.

IMPORTANT: Ask only 1-2 focused questions per response. Avoid overwhelming the user with multiple questions at once. Each question should build on the previous discussion and guide the user toward deeper understanding without creating cognitive overload.

The GPT will never offer definitive answers but will guide users toward uncovering them through self-discovery, fostering a deeper understanding of philosophical principles and critical thinking.`,
            },
            ...updatedMessages,
          ],
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;

      if (reply) {
        const assistantMessage: Message = { role: 'assistant', content: reply.trim() };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        updateConversationTitle(finalMessages);
      } else {
        const errorMessage: Message = { role: 'assistant', content: '⚠️ No response received.' };
        setMessages([...updatedMessages, errorMessage]);
      }
    } catch (err) {
      const errorMessage: Message = { role: 'assistant', content: '⚠️ Error contacting assistant.' };
      setMessages([...updatedMessages, errorMessage]);
    }

    setLoading(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const deleteConversation = async (id: string) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedConversations = conversations.filter(conv => conv.id !== id);
            await saveConversations(updatedConversations);
            if (currentConversationId === id) {
              setMessages([]);
              setCurrentConversationId(null);
            }
          }
        }
      ]
    );
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
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              ref={scrollRef}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
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
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="What's on your mind..."
                    placeholderTextColor="#888"
                    multiline
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                  />
                  <TouchableOpacity 
                    style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]} 
                    onPress={sendMessage}
                    disabled={loading || !input.trim()}
                  >
                    <Icon name="arrow-up" size={20} color={input.trim() && !loading ? "#fff" : "#888"} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={styles.penButton}
                  onPress={() => {
                    if (currentConversationId) {
                      navigation.navigate('Notes', {
                        conversationId: currentConversationId,
                        messages: messages,
                      });
                    } else {
                      // If no conversation exists yet, create one first
                      createNewConversation();
                      navigation.navigate('Notes', {
                        conversationId: currentConversationId || Date.now().toString(),
                        messages: messages,
                      });
                    }
                  }}
                >
                  <Icon name="pencil" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Conversations</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowHistory(false)}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.newConversationButton}
              onPress={() => {
                createNewConversation();
                setShowHistory(false);
              }}
            >
              <Icon name="add-circle-outline" size={24} color="#007AFF" />
              <Text style={styles.newConversationText}>New Conversation</Text>
            </TouchableOpacity>
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.conversationItem,
                    item.id === currentConversationId && styles.activeConversation,
                  ]}
                  onPress={() => loadConversation(item)}
                >
                  <Text style={styles.conversationTitle}>{item.title}</Text>
                  <Text style={styles.conversationDate}>{formatDate(item.timestamp)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  historyButton: {
    padding: 8,
  },
  keyboardAvoid: {
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
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  assistantText: {
    color: '#c5c5c5',
  },
  userText: {
    color: '#f1f1f1',
  },
  inputWrapper: {
    padding: 12,
    backgroundColor: '#1c1c1c',
    borderTopWidth: 1,
    borderColor: '#333',
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    paddingRight: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  penButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  conversationItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationContent: {
    flex: 1,
  },
  conversationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activeConversation: {
    backgroundColor: '#2a2a2a',
  },
  conversationTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  conversationDate: {
    color: '#888',
    fontSize: 12,
  },
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  newConversationText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
