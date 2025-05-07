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
  ImageSourcePropType,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Ionicons';
import { PhilosopherChat, Message } from '../types/philosophy';
import { MAJOR_PHILOSOPHERS } from '../utils/philosophers';
import { PhilosopherChatService, Chat } from '../services/PhilosopherChatService';
import { StorageService } from '../services/StorageService';
import { Swipeable } from 'react-native-gesture-handler';

type PhilosopherHubProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PhilosopherHub'>;
};

type SearchResult = {
  id: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
};

export default function PhilosopherHub({ navigation }: PhilosopherHubProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sort chats by most recent activity
  const sortedChats = [...chats].sort((a, b) => 
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  useEffect(() => {
    // Load chats
    loadChats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      searchTimeout.current = setTimeout(() => {
        searchPhilosophers(searchQuery.trim());
      }, 500);
    } else {
      setSearchResults([]);
    }
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Philosopher Hub',
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

  const searchPhilosophers = (query: string) => {
    setIsSearching(true);
    try {
      // Search in our local philosophers list
      const results = Object.values(MAJOR_PHILOSOPHERS)
        .filter(philosopher => 
          philosopher.name.toLowerCase().includes(query.toLowerCase())
        )
        .map(philosopher => ({
          id: philosopher.id,
          name: philosopher.name,
          description: `Chat with ${philosopher.name}`,
          image: philosopher.image
        }));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching philosophers:', error);
      Alert.alert('Error', 'Failed to search for philosophers. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addNewPhilosopher = async (philosopher: SearchResult) => {
    // Check if a chat with this philosopher already exists
    const existingChat = chats.find(chat => chat.philosopherId === philosopher.id);
    
    if (existingChat) {
      // If chat exists, just select it
      setSelectedChat(existingChat);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    // Only create a new chat if one doesn't exist
    const newChat: Chat = {
      id: philosopher.id,
      philosopherId: philosopher.id,
      philosopherName: philosopher.name,
      messages: [],
      lastMessageTime: Date.now(),
      createdAt: Date.now()
    };

    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    setSelectedChat(newChat);
    setSearchQuery('');
    setSearchResults([]);
    
    // Save the new chat
    await StorageService.save(`chat_${philosopher.id}`, newChat);
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const loadedChats = await PhilosopherChatService.loadChats();
      setChats(loadedChats);
      setError(null);
    } catch (err) {
      setError('Failed to load chats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !message.trim()) return;

    try {
      setIsLoading(true);
      const response = await PhilosopherChatService.sendMessage(
        selectedChat.philosopherId,
        message.trim()
      );
      
      if (response) {
        setMessage('');
        // Reload chats to get the updated messages
        await loadChats();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (philosopherId: string) => {
    try {
      await PhilosopherChatService.deleteChat(philosopherId);
      setChats(chats.filter(chat => chat.philosopherId !== philosopherId));
      if (selectedChat?.philosopherId === philosopherId) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      Alert.alert('Error', 'Failed to delete chat. Please try again.');
    }
  };

  const renderRightActions = (philosopherId: string) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleDeleteChat(philosopherId)}
    >
      <Icon name="trash-outline" size={24} color="#fff" />
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.searchResult}
      onPress={() => addNewPhilosopher(item)}
    >
      <Image
        source={item.image}
        style={styles.searchResultImage}
      />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderChatItem = ({ item }: { item: Chat }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.philosopherId)}
    >
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => setSelectedChat(item)}
      >
        <Image
          source={MAJOR_PHILOSOPHERS[item.philosopherId]?.image}
          style={styles.chatImage}
        />
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{item.philosopherName}</Text>
          <Text style={styles.chatLastMessage} numberOfLines={1}>
            {item.messages.length > 0
              ? item.messages[item.messages.length - 1].content
              : 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  const renderChatMessages = () => {
    if (!selectedChat) return null;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {selectedChat.messages.map((message, index) => (
            <View key={index} style={styles.messageWrapper}>
              {renderMessage({ item: message })}
            </View>
          ))}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
            placeholderTextColor="#666"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!message.trim() || isLoading}
          >
            <Icon
              name="send"
              size={24}
              color={message.trim() ? '#fff' : '#666'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {selectedChat ? (
        renderChatMessages()
      ) : (
        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search philosophers..."
              placeholderTextColor="#666"
            />
            {isSearching && (
              <ActivityIndicator style={styles.searchIndicator} color="#007AFF" />
            )}
          </View>
          {searchQuery.trim() ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={item => item.id}
              style={styles.searchResults}
            />
          ) : (
            <FlatList
              data={sortedChats}
              renderItem={renderChatItem}
              keyExtractor={item => item.id}
              style={styles.chatList}
            />
          )}
        </View>
      )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
  },
  searchContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  searchIndicator: {
    marginLeft: 8,
  },
  searchResults: {
    flex: 1,
  },
  searchResult: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultDescription: {
    color: '#888',
    fontSize: 14,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  chatImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatLastMessage: {
    color: '#888',
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
}); 