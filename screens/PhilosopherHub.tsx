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
import { PhilosopherChat, Message } from '../types/philosophy';
import { MAJOR_PHILOSOPHERS } from '../utils/philosophers';
import { PhilosopherChatService, Chat } from '../services/PhilosopherChatService';
import { StorageService } from '../services/StorageService';
import { constructWikidataUrl, extractImageUrl, isPhilosopher } from '../utils/wikidataApi';
import { Swipeable } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';

type PhilosopherHubProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PhilosopherHub'>;
};

type SearchResult = {
  id: string;
  name: string;
  description: string;
  image: string;
  url: string;
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
  const [isOnline, setIsOnline] = useState(true);

  // Sort chats by most recent activity
  const sortedChats = [...chats].sort((a, b) => 
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  useEffect(() => {
    // Check network status
    const unsubscribe = NetInfo.addEventListener((state: { isConnected: boolean | null }) => {
      setIsOnline(state.isConnected ?? false);
    });

    // Load chats
    loadChats();

    return () => {
      unsubscribe();
    };
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

  const searchPhilosophers = async (query: string) => {
    console.log('Searching for:', query);
    setIsSearching(true);
    try {
      const response = await fetch(
        constructWikidataUrl('wbsearchentities', {
          search: query,
          language: 'en',
          type: 'item'
        })
      );
      const data = await response.json();
      console.log('Search response:', data);
      
      if (!data.search) {
        console.log('No search results');
        setSearchResults([]);
        return;
      }

      // Filter for philosophers (Q5 is human, P106 is occupation, Q4964182 is philosopher)
      const philosopherIds = data.search
        .filter((result: any) => {
          // Extract the Q-number from the concepturi
          const qNumber = result.id;
          return qNumber;
        })
        .map((result: any) => result.id);
      console.log('Philosopher IDs:', philosopherIds);

      if (philosopherIds.length > 0) {
        // Get detailed information for each philosopher
        const entityResponse = await fetch(
          constructWikidataUrl('wbgetentities', {
            ids: philosopherIds.join('|'),
            props: 'descriptions|labels|claims'
          })
        );
        const entityData = await entityResponse.json();
        console.log('Entity data:', entityData);
        
        const results = Object.values(entityData.entities)
          .filter((entity: any) => isPhilosopher(entity))
          .map((entity: any) => {
            const imageUrl = extractImageUrl(entity, 200);
            console.log('Philosopher found:', entity.labels?.en?.value, 'Image:', imageUrl);

            return {
              id: entity.id,
              name: entity.labels?.en?.value || 'Unknown',
              description: entity.descriptions?.en?.value || '',
              image: imageUrl,
              url: `https://www.wikidata.org/wiki/${entity.id}`
            };
          });

        console.log('Final results:', results);
        setSearchResults(results);
      } else {
        console.log('No philosopher IDs found');
        setSearchResults([]);
      }
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
      unreadCount: 0
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

  const saveChats = async (updatedChats: Chat[]) => {
    try {
      await AsyncStorage.setItem('philosopher_chats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error saving chats:', error);
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
        // Update the selected chat with the new message
        const updatedChat = await PhilosopherChatService.loadChatHistory(selectedChat.philosopherId);
        if (updatedChat) {
          setSelectedChat(updatedChat);
          // Update the chats list
          const updatedChats = chats.map(chat => 
            chat.philosopherId === updatedChat.philosopherId ? updatedChat : chat
          );
          setChats(updatedChats);
        }
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
      const success = await PhilosopherChatService.deleteChat(philosopherId);
      if (success) {
        // Update local state
        setChats(chats.filter(chat => chat.philosopherId !== philosopherId));
        if (selectedChat?.philosopherId === philosopherId) {
          setSelectedChat(null);
        }
      } else {
        Alert.alert('Error', 'Failed to delete chat. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      Alert.alert('Error', 'Failed to delete chat. Please try again.');
    }
  };

  const renderRightActions = (philosopherId: string) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDeleteChat(philosopherId)}
    >
      <Icon name="trash-outline" size={24} color="#fff" />
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const existingChat = chats.find(chat => chat.philosopherId === item.id);
    
    return (
      <TouchableOpacity
        style={styles.searchResultItem}
        onPress={() => existingChat ? setSelectedChat(existingChat) : addNewPhilosopher(item)}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.searchResultImage}
        />
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultName}>{item.name}</Text>
          <Text style={styles.searchResultDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <Icon 
          name={existingChat ? "chatbubble-outline" : "add-circle-outline"} 
          size={24} 
          color="#007AFF" 
        />
      </TouchableOpacity>
    );
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.philosopherId)}
      onSwipeableOpen={() => handleDeleteChat(item.philosopherId)}
    >
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => setSelectedChat(item)}
      >
        <Image
          source={{ uri: `https://www.wikidata.org/wiki/Special:EntityData/${item.philosopherId}.json` }}
          style={styles.chatImage}
          defaultSource={require('../assets/default-philosopher.png')}
        />
        <View style={styles.chatInfo}>
          <Text style={styles.philosopherName}>{item.philosopherName}</Text>
          <Text style={styles.lastMessage}>
            {item.messages.length > 0
              ? item.messages[item.messages.length - 1].content
              : 'No messages yet'}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <Text style={[
        styles.messageText,
        item.isUser ? styles.messageTextUser : styles.messageTextAssistant
      ]}>
        {item.content}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  const renderChatMessages = () => {
    if (!selectedChat) return null;

    return (
      <FlatList
        data={selectedChat.messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        inverted
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>You are offline. Changes will sync when you reconnect.</Text>
          </View>
        )}
        <Text>Loading chats...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>You are offline. Changes will sync when you reconnect.</Text>
          </View>
        )}
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadChats} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You are offline. Changes will sync when you reconnect.</Text>
        </View>
      )}
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
              {renderChatMessages()}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Philosopher Hub</Text>
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search philosophers..."
                placeholderTextColor="#888"
              />
              {isSearching && (
                <ActivityIndicator size="small" color="#007AFF" style={styles.searchLoading} />
              )}
            </View>
          </View>
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.searchResultsList}
            />
          ) : (
            <FlatList
              data={sortedChats}
              renderItem={renderChatItem}
              keyExtractor={item => item.philosopherId}
              contentContainerStyle={styles.chatsList}
            />
          )}
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
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 8,
    fontSize: 16,
  },
  searchLoading: {
    marginLeft: 8,
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
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  searchResultsList: {
    padding: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  searchResultDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  chatsList: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  chatInfo: {
    flex: 1,
  },
  philosopherName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#ccc',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteAction: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageTextUser: {
    color: '#fff',
  },
  messageTextAssistant: {
    color: '#000',
  },
  offlineBanner: {
    backgroundColor: '#ffcc00',
    padding: 10,
    alignItems: 'center',
  },
  offlineText: {
    color: '#000',
    fontSize: 14,
  },
  chatImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  messagesList: {
    flex: 1,
  },
}); 