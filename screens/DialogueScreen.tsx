import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { sendMessage as sendMessageToAPI } from '../src/services/api';
import { OPENAI_API_KEY } from '@env';
import { useTheme } from '../contexts/ThemeContext';

type Message = {
  role: 'user' | 'assistant' | 'system';
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
  route: {
    params?: {
      initialMessage?: string;
    };
  };
};

export default function DialogueScreen({ navigation, route }: DialogueScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = {
    background: isDarkMode ? '#1c1c1c' : '#f7f7f7',
    card: isDarkMode ? '#232323' : '#fff',
    text: isDarkMode ? '#fff' : '#111',
    secondaryText: isDarkMode ? '#888' : '#666',
    input: isDarkMode ? '#232323' : '#fff',
    inputText: isDarkMode ? '#fff' : '#111',
    border: isDarkMode ? '#444' : '#ddd',
    placeholder: isDarkMode ? '#888' : '#aaa',
    button: '#007AFF',
    userBubble: isDarkMode ? '#2a2a2a' : '#e5e5e5',
    assistantBubble: isDarkMode ? '#333' : '#fff',
  };

  // Extract conversation cleanup logic into a reusable function
  const handleConversationCleanup = useCallback((conversationId: string, messageCount: number) => {
    if (conversationId && messageCount === 0) {
      deleteConversation(conversationId);
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: 'Socratic Dialogue',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            handleConversationCleanup(currentConversationId!, messages.length);
            navigation.goBack();
          }}
          style={{ marginLeft: 8, marginBottom: 16 }}
        >
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowHistory(true)}
          style={{ marginRight: 8, marginBottom: 16 }}
        >
          <Icon name="menu" size={24} color={theme.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, currentConversationId, messages, handleConversationCleanup, theme.text]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    return () => {
      if (currentConversationId && messages.length === 0) {
        deleteConversation(currentConversationId);
      }
    };
  }, [currentConversationId, messages]);

  // Handle initial message if provided
  useEffect(() => {
    if (route.params?.initialMessage) {
      setInput(route.params.initialMessage);
    }
  }, [route.params?.initialMessage]);

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
    if (!currentConversationId || messages.length < 2) return;
    
    try {
      const titlePrompt: Message[] = [
        {
          role: 'system' as const,
          content: 'Generates concise, relevant titles for conversations. Create a title that is 3-5 words maximum, capturing the main topic or theme of the conversation. The title should be clear and meaningful without being too long. Only respond with the title, no additional text.',
        },
        {
          role: 'user' as const,
          content: `Generate a concise, relevant title (3-5 words) for this conversation based on the first exchange:\n\n${messages.slice(0, 2).map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}`,
        },
      ];

      const title = await sendMessageToAPI(titlePrompt);
      const cleanTitle = title.trim().replace(/["']/g, '');
      
      if (cleanTitle) {
        setConversations(prev => {
          const updated = prev.map(conv => 
            conv.id === currentConversationId 
              ? { ...conv, title: cleanTitle, messages }
              : conv
          );
          saveConversations(updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error generating title:', error);
      // Fallback to a simple title if the API call fails
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
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      // Append user message immediately
      const userMessage: Message = {
        role: 'user',
        content: content.trim(),
      };

      // Update messages state with user message
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setLoading(true);

      // Send message using the API service
      const reply = await sendMessageToAPI([...messages, userMessage]);
      
      // Create assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: reply.trim(),
      };

      // Update messages with both user and assistant messages
      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Handle conversation saving
      if (currentConversationId) {
        // Update existing conversation
        const updatedConversation: Conversation = {
          id: currentConversationId,
          title: conversations.find(c => c.id === currentConversationId)?.title || 'New Conversation',
          messages: updatedMessages,
          timestamp: Date.now(),
        };

        // Update conversations state and save
        const updatedConversations = conversations.map(conv => 
          conv.id === currentConversationId ? updatedConversation : conv
        );
        await saveConversations(updatedConversations);

        // Only update the title after the first exchange and if it's still the default
        if (updatedMessages.length === 2 && (!updatedConversation.title || updatedConversation.title === 'New Conversation')) {
          await updateConversationTitle(updatedMessages);
        }
      } else {
        // Create new conversation
        const newId = Date.now().toString();
        const newConversation: Conversation = {
          id: newId,
          title: 'New Conversation',
          messages: updatedMessages,
          timestamp: Date.now(),
        };

        // Update state and save
        setCurrentConversationId(newId);
        const updatedConversations = [...conversations, newConversation];
        await saveConversations(updatedConversations);

        // Only update the title after the first exchange
        if (updatedMessages.length === 2) {
          await updateConversationTitle(updatedMessages);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const deleteConversation = async (id: string) => {
    const updatedConversations = conversations.filter(conv => conv.id !== id);
    await saveConversations(updatedConversations);
    if (currentConversationId === id) {
      setMessages([]);
      setCurrentConversationId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1, backgroundColor: theme.background }}
              contentContainerStyle={{ padding: 16 }}
            >
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.messageRow,
                    msg.role === 'user' ? styles.userAlign : styles.assistantAlign,
                    { backgroundColor: msg.role === 'user' ? theme.userBubble : theme.assistantBubble, borderRadius: 14, padding: 12, marginBottom: 10 },
                  ]}
                >
                  <Text
                    style={{ color: theme.text, fontSize: 16, lineHeight: 24 }}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={[styles.messageRow, styles.assistantAlign, { backgroundColor: theme.assistantBubble, borderRadius: 14, padding: 12, marginBottom: 10 }] }>
                  <ActivityIndicator size="small" color={theme.secondaryText} />
                </View>
              )}
            </ScrollView>

            <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { backgroundColor: theme.input, borderColor: theme.border }] }>
                  <TextInput
                    style={[styles.input, { color: theme.inputText }]}
                    placeholder="What's on your mind..."
                    placeholderTextColor={theme.placeholder}
                    value={input}
                    onChangeText={setInput}
                    multiline
                    onSubmitEditing={() => sendMessage(input)}
                    returnKeyType="send"
                  />
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.input, borderColor: theme.border }]}
                    onPress={() => {
                      if (currentConversationId) {
                        navigation.navigate('Notes', {
                          conversationId: currentConversationId,
                          messages: messages,
                        });
                      } else {
                        createNewConversation();
                        navigation.navigate('Notes', {
                          conversationId: currentConversationId || Date.now().toString(),
                          messages: messages,
                        });
                      }
                    }}
                  >
                    <Icon name="book-outline" size={20} color={theme.secondaryText} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]} 
                    onPress={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                  >
                    <Icon name="arrow-up" size={20} color={input.trim() && !loading ? "#fff" : theme.secondaryText} />
                  </TouchableOpacity>
                </View>
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
                  onLongPress={() => {
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
                          onPress: () => deleteConversation(item.id)
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.conversationTitle}>{item.title}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showContextMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContextMenu(false)}
      >
        <Pressable 
          style={styles.contextMenuOverlay}
          onPress={() => setShowContextMenu(false)}
        >
          <View style={styles.contextMenu}>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => {
                setShowContextMenu(false);
                if (currentConversationId) {
                  navigation.navigate('Notes', {
                    conversationId: currentConversationId,
                    messages: messages,
                  });
                } else {
                  createNewConversation();
                  navigation.navigate('Notes', {
                    conversationId: currentConversationId || Date.now().toString(),
                    messages: messages,
                  });
                }
              }}
            >
              <Icon name="book-outline" size={20} color="#888" />
              <Text style={styles.contextMenuText}>Generate Notes</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderBottomWidth: 0,
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
    borderBottomWidth: 0,
  },
  activeConversation: {
    backgroundColor: '#2a2a2a',
  },
  conversationTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0,
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
  contextMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenu: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 8,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#333',
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  contextMenuText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  inputBar: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#333',
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
