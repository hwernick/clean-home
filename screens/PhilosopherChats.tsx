import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhilosopherChat } from '../types/philosophy';
import { MAJOR_PHILOSOPHERS } from '../utils/philosophers';
import { PhilosopherChatService } from '../services/PhilosopherChatService';

type PhilosopherChatsProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PhilosopherChats'>;
};

export default function PhilosopherChats({ navigation }: PhilosopherChatsProps) {
  const [chats, setChats] = useState<PhilosopherChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<PhilosopherChat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: 'Philosopher Chats',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (selectedChat) {
              setSelectedChat(null);
            } else {
              navigation.goBack();
            }
          }}
          style={{ marginLeft: 8, marginBottom: 16 }}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedChat]);

  const loadChats = async () => {
    try {
      const storedChats = await AsyncStorage.getItem('philosopher_chats');
      if (storedChats) {
        setChats(JSON.parse(storedChats));
      } else {
        // Initialize with empty chats for major philosophers
        const initialChats: PhilosopherChat[] = Object.values(MAJOR_PHILOSOPHERS).map(philosopher => ({
          id: philosopher.id,
          philosopherId: philosopher.id,
          philosopherName: philosopher.name,
          philosopherImage: `https://commons.wikimedia.org/w/thumb.php?width=500&fname=${encodeURIComponent(philosopher.name.toLowerCase().replace(' ', '_') + '.jpg')}`,
          lastMessage: '',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: [],
        }));
        setChats(initialChats);
        await AsyncStorage.setItem('philosopher_chats', JSON.stringify(initialChats));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const saveChats = async (updatedChats: PhilosopherChat[]) => {
    try {
      await AsyncStorage.setItem('philosopher_chats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isUser: true,
    };

    const updatedChats = chats.map(chat => {
      if (chat.id === selectedChat.id) {
        return {
          ...chat,
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
          messages: [...chat.messages, message],
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setSelectedChat(updatedChats.find(chat => chat.id === selectedChat.id) || null);
    setNewMessage('');
    await saveChats(updatedChats);

    // Get AI response
    setIsLoading(true);
    try {
      const conversationHistory = selectedChat.messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content,
      }));

      const aiResponse = await PhilosopherChatService.sendMessage(
        selectedChat.philosopherId,
        newMessage.trim(),
        conversationHistory
      );

      const philosopherResponse = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        timestamp: new Date().toISOString(),
        isUser: false,
      };

      const finalUpdatedChats = updatedChats.map(chat => {
        if (chat.id === selectedChat.id) {
          return {
            ...chat,
            lastMessage: philosopherResponse.content,
            lastMessageTime: philosopherResponse.timestamp,
            messages: [...chat.messages, philosopherResponse],
          };
        }
        return chat;
      });

      setChats(finalUpdatedChats);
      setSelectedChat(finalUpdatedChats.find(chat => chat.id === selectedChat.id) || null);
      await saveChats(finalUpdatedChats);
    } catch (error) {
      console.error('Error getting AI response:', error);
      Alert.alert('Error', 'Failed to get response from the philosopher. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: PhilosopherChat['messages'][0] }) => (
    <View
      style={[
        styles.messageRow,
        item.isUser ? styles.userAlign : styles.assistantAlign,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.isUser ? styles.userText : styles.assistantText,
        ]}
      >
        {item.content}
      </Text>
    </View>
  );

  const renderChatItem = ({ item }: { item: PhilosopherChat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => setSelectedChat(item)}
    >
      <Image
        source={{ uri: item.philosopherImage }}
        style={styles.chatImage}
      />
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.philosopherName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
      <View style={styles.chatMeta}>
        <Text style={styles.timeText}>
          {new Date(item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {selectedChat ? (
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.mainContainer}>
              <View style={styles.chatHeader}>
                <Image
                  source={{ uri: selectedChat.philosopherImage }}
                  style={styles.headerImage}
                />
                <Text style={styles.headerName}>{selectedChat.philosopherName}</Text>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                ref={scrollRef}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {selectedChat.messages.map((msg, i) => (
                  <View
                    key={i}
                    style={[
                      styles.messageRow,
                      msg.isUser ? styles.userAlign : styles.assistantAlign,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.isUser ? styles.userText : styles.assistantText,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                ))}
                {isLoading && (
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
                      value={newMessage}
                      onChangeText={setNewMessage}
                      placeholder="What's on your mind..."
                      placeholderTextColor="#888"
                      multiline
                      onSubmitEditing={() => handleSendMessage()}
                      returnKeyType="send"
                    />
                    <TouchableOpacity 
                      style={[styles.sendButton, (!newMessage.trim() || isLoading) && styles.sendButtonDisabled]} 
                      onPress={handleSendMessage}
                      disabled={isLoading || !newMessage.trim()}
                    >
                      <Icon name="arrow-up" size={20} color={newMessage.trim() && !isLoading ? "#fff" : "#888"} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Philosopher Chats</Text>
          </View>
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatsList}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
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
  chatsList: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
  },
  chatImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 