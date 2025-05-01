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
import { constructWikidataUrl, extractImageUrl, isPhilosopher } from '../utils/wikidataApi';
import { Swipeable } from 'react-native-gesture-handler';

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
  const [chats, setChats] = useState<PhilosopherChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<PhilosopherChat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sort chats by most recent activity
  const sortedChats = [...chats].sort((a, b) => 
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  useEffect(() => {
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
    const newChat: PhilosopherChat = {
      id: philosopher.id,
      philosopherId: philosopher.id,
      philosopherName: philosopher.name,
      philosopherImage: philosopher.image,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      messages: [],
    };

    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    setSelectedChat(newChat);
    setSearchQuery('');
    setSearchResults([]);
    await saveChats(updatedChats);
  };

  const loadChats = async () => {
    try {
      const storedChats = await AsyncStorage.getItem('philosopher_chats');
      let loadedChats: PhilosopherChat[] = [];
      
      if (storedChats) {
        // Parse and remove duplicates based on philosopherId
        const parsedChats = JSON.parse(storedChats);
        const uniqueChats = new Map();
        
        // Keep only the most recent chat for each philosopher
        parsedChats.forEach((chat: PhilosopherChat) => {
          if (!uniqueChats.has(chat.philosopherId) || 
              new Date(chat.lastMessageTime) > new Date(uniqueChats.get(chat.philosopherId).lastMessageTime)) {
            uniqueChats.set(chat.philosopherId, chat);
          }
        });
        
        loadedChats = Array.from(uniqueChats.values());
      } else {
        // Initialize with empty chats for major philosophers
        loadedChats = Object.values(MAJOR_PHILOSOPHERS).map(philosopher => ({
          id: philosopher.id,
          philosopherId: philosopher.id,
          philosopherName: philosopher.name,
          philosopherImage: `https://commons.wikimedia.org/w/thumb.php?width=500&fname=${encodeURIComponent(philosopher.name.toLowerCase().replace(' ', '_') + '.jpg')}`,
          lastMessage: '',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: [],
        }));
      }
      
      setChats(loadedChats);
      await AsyncStorage.setItem('philosopher_chats', JSON.stringify(loadedChats));
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

  const deleteChat = async (chatId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedChats = chats.filter(chat => chat.id !== chatId);
            setChats(updatedChats);
            if (selectedChat?.id === chatId) {
              setSelectedChat(null);
            }
            await saveChats(updatedChats);
          },
        },
      ],
    );
  };

  const renderRightActions = (chatId: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => deleteChat(chatId)}
      >
        <Icon name="trash-outline" size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

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

  const renderChatItem = ({ item }: { item: PhilosopherChat }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.id)}
      overshootRight={false}
    >
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
    </Swipeable>
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
              keyExtractor={item => item.id}
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
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
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
    color: '#ccc',
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
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
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
}); 