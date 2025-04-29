import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Document from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PersonalPhilosophyHubProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PersonalPhilosophyHub'>;
};

type PhilosophicalWork = {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  type: 'essay' | 'thought' | 'dialogue' | 'reflection';
};

type PhilosophicalPersona = {
  interests: string[];
  influences: string[];
  keyIdeas: string[];
  evolution: string[];
};

type PhilosophicalAnalysis = {
  school: string;
  influences: string[];
  keyThemes: string[];
  strengths: string[];
  areasForGrowth: string[];
  summary: string;
};

export default function PersonalPhilosophyHub({ navigation }: PersonalPhilosophyHubProps) {
  const [works, setWorks] = useState<PhilosophicalWork[]>([]);
  const [persona, setPersona] = useState<PhilosophicalPersona>({
    interests: [],
    influences: [],
    keyIdeas: [],
    evolution: [],
  });
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'works' | 'persona' | 'analysis'>('works');
  const [analysis, setAnalysis] = useState<PhilosophicalAnalysis | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [newWork, setNewWork] = useState<Partial<PhilosophicalWork>>({
    title: '',
    content: '',
    type: 'essay',
    tags: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedWorks = await AsyncStorage.getItem('philosophical_works');
      const storedPersona = await AsyncStorage.getItem('philosophical_persona');
      
      if (storedWorks) {
        setWorks(JSON.parse(storedWorks));
      }
      if (storedPersona) {
        setPersona(JSON.parse(storedPersona));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('philosophical_works', JSON.stringify(works));
      await AsyncStorage.setItem('philosophical_persona', JSON.stringify(persona));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        setLoading(true);
        // Here you would process the document and extract its content
        // For now, we'll just create a new work entry
        const newWork: PhilosophicalWork = {
          id: Date.now().toString(),
          title: result.assets[0].name,
          content: 'Document content will be processed here...',
          date: new Date().toISOString(),
          tags: [],
          type: 'essay',
        };

        setWorks(prev => [newWork, ...prev]);
        saveData();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeConversationHistory = async () => {
    setAnalyzing(true);
    try {
      // Get all conversations from AsyncStorage
      const storedConversations = await AsyncStorage.getItem('conversations');
      if (!storedConversations) {
        Alert.alert('No Data', 'No conversation history found to analyze.');
        setAnalyzing(false);
        return;
      }

      const conversations = JSON.parse(storedConversations);
      
      // Extract all user messages from conversations
      const userMessages = conversations.flatMap((conv: any) => 
        conv.messages.filter((msg: any) => msg.role === 'user').map((msg: any) => msg.content)
      );

      if (userMessages.length === 0) {
        Alert.alert('No Data', 'No user messages found in conversation history.');
        setAnalyzing(false);
        return;
      }

      // Prepare the conversation history for analysis
      const conversationHistory = userMessages.join('\n\n');

      // Make API call to analyze the philosophical viewpoint
      // This API call only happens when the user explicitly requests an analysis
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert in philosophical analysis. Your task is to analyze the user's philosophical viewpoint based on their conversation history. 
              
Identify:
1. Which philosophical school or tradition their thinking most closely aligns with
2. Which philosophers or philosophical works have likely influenced their thinking
3. Key themes and recurring ideas in their philosophical discourse
4. Strengths in their philosophical reasoning
5. Areas where their philosophical thinking could be developed further

Provide a concise summary of their overall philosophical perspective.

Format your response as a JSON object with the following structure:
{
  "school": "Name of the philosophical school or tradition",
  "influences": ["Philosopher 1", "Philosopher 2", "Work 1", "Work 2"],
  "keyThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areasForGrowth": ["Area 1", "Area 2", "Area 3"],
  "summary": "A concise paragraph summarizing their philosophical perspective"
}`
            },
            {
              role: 'user',
              content: `Please analyze my philosophical viewpoint based on the following conversation history:\n\n${conversationHistory}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze philosophical viewpoint');
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      // Parse the JSON response
      const analysisResult = JSON.parse(analysisText);
      setAnalysis(analysisResult);
      setShowAnalysisModal(true);
      
      // Update the persona with insights from the analysis
      setPersona(prev => ({
        ...prev,
        interests: [...new Set([...prev.interests, ...analysisResult.keyThemes])],
        influences: [...new Set([...prev.influences, ...analysisResult.influences])],
        keyIdeas: [...new Set([...prev.keyIdeas, ...analysisResult.strengths])],
        evolution: [...prev.evolution, `Based on analysis: ${analysisResult.summary}`],
      }));
      
      saveData();
    } catch (error) {
      console.error('Error analyzing conversation history:', error);
      Alert.alert('Error', 'Failed to analyze your philosophical viewpoint. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderWorksTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUploadDocument}
        disabled={loading}
      >
        <Icon name="cloud-upload" size={24} color="#fff" />
        <Text style={styles.uploadButtonText}>
          {loading ? 'Uploading...' : 'Upload Document'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.worksList}>
        {works.map(work => (
          <TouchableOpacity
            key={work.id}
            style={styles.workCard}
            onPress={() => {
              // Navigate to work detail view
              navigation.navigate('Dialogue', {
                initialMessage: `Let's analyze and discuss this philosophical work: ${work.title}\n\n${work.content}`,
              });
            }}
          >
            <View style={styles.workHeader}>
              <Text style={styles.workTitle}>{work.title}</Text>
              <Text style={styles.workDate}>
                {new Date(work.date).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.workType}>{work.type}</Text>
            <Text style={styles.workPreview} numberOfLines={2}>
              {work.content}
            </Text>
            <View style={styles.tagContainer}>
              {work.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPersonaTab = () => (
    <View style={styles.tabContent}>
      <ScrollView style={styles.personaContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Philosophical Interests</Text>
          <View style={styles.tagContainer}>
            {persona.interests.map((interest, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{interest}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              Alert.prompt(
                'Add Interest',
                'Enter a new philosophical interest',
                (text) => {
                  if (text) {
                    setPersona(prev => ({
                      ...prev,
                      interests: [...prev.interests, text],
                    }));
                    saveData();
                  }
                }
              );
            }}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Interest</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Influences</Text>
          <View style={styles.tagContainer}>
            {persona.influences.map((influence, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{influence}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              Alert.prompt(
                'Add Influence',
                'Enter a philosophical influence',
                (text) => {
                  if (text) {
                    setPersona(prev => ({
                      ...prev,
                      influences: [...prev.influences, text],
                    }));
                    saveData();
                  }
                }
              );
            }}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Influence</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Ideas</Text>
          <View style={styles.tagContainer}>
            {persona.keyIdeas.map((idea, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{idea}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              Alert.prompt(
                'Add Idea',
                'Enter a key philosophical idea',
                (text) => {
                  if (text) {
                    setPersona(prev => ({
                      ...prev,
                      keyIdeas: [...prev.keyIdeas, text],
                    }));
                    saveData();
                  }
                }
              );
            }}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Idea</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Philosophical Evolution</Text>
          {persona.evolution.map((entry, index) => (
            <View key={index} style={styles.evolutionEntry}>
              <Text style={styles.evolutionText}>{entry}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              Alert.prompt(
                'Add Evolution Entry',
                'Describe how your philosophical thinking has evolved',
                (text) => {
                  if (text) {
                    setPersona(prev => ({
                      ...prev,
                      evolution: [...prev.evolution, text],
                    }));
                    saveData();
                  }
                }
              );
            }}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Evolution Entry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderAnalysisTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>Philosophical Viewpoint Analysis</Text>
        <Text style={styles.analysisDescription}>
          Analyze your conversation history to discover your philosophical perspective, influences, and areas for growth.
        </Text>
        
        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={analyzeConversationHistory}
          disabled={analyzing}
        >
          {analyzing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="analytics" size={24} color="#fff" />
              <Text style={styles.analyzeButtonText}>Analyze My Philosophy</Text>
            </>
          )}
        </TouchableOpacity>
        
        {analysis && (
          <View style={styles.analysisSummary}>
            <Text style={styles.analysisSubtitle}>Your Philosophical School</Text>
            <Text style={styles.analysisText}>{analysis.school}</Text>
            
            <Text style={styles.analysisSubtitle}>Summary</Text>
            <Text style={styles.analysisText}>{analysis.summary}</Text>
            
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => setShowAnalysisModal(true)}
            >
              <Text style={styles.viewDetailsButtonText}>View Full Analysis</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderAnalysisModal = () => (
    <Modal
      visible={showAnalysisModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAnalysisModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Philosophical Analysis</Text>
            <TouchableOpacity onPress={() => setShowAnalysisModal(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll}>
            {analysis && (
              <>
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Philosophical School</Text>
                  <Text style={styles.analysisSectionText}>{analysis.school}</Text>
                </View>
                
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Key Influences</Text>
                  {analysis.influences.map((influence, index) => (
                    <View key={index} style={styles.analysisItem}>
                      <Text style={styles.analysisItemText}>• {influence}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Key Themes</Text>
                  {analysis.keyThemes.map((theme, index) => (
                    <View key={index} style={styles.analysisItem}>
                      <Text style={styles.analysisItemText}>• {theme}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Philosophical Strengths</Text>
                  {analysis.strengths.map((strength, index) => (
                    <View key={index} style={styles.analysisItem}>
                      <Text style={styles.analysisItemText}>• {strength}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Areas for Growth</Text>
                  {analysis.areasForGrowth.map((area, index) => (
                    <View key={index} style={styles.analysisItem}>
                      <Text style={styles.analysisItemText}>• {area}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Summary</Text>
                  <Text style={styles.analysisSectionText}>{analysis.summary}</Text>
                </View>
              </>
            )}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowAnalysisModal(false)}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal Philosophy Hub</Text>
        <Text style={styles.subtitle}>Curate your philosophical journey</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'works' && styles.selectedTab]}
          onPress={() => setSelectedTab('works')}
        >
          <Icon
            name="book"
            size={24}
            color={selectedTab === 'works' ? '#fff' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'works' && styles.selectedTabText,
            ]}
          >
            Works
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'persona' && styles.selectedTab]}
          onPress={() => setSelectedTab('persona')}
        >
          <Icon
            name="person"
            size={24}
            color={selectedTab === 'persona' ? '#fff' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'persona' && styles.selectedTabText,
            ]}
          >
            Persona
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'analysis' && styles.selectedTab]}
          onPress={() => setSelectedTab('analysis')}
        >
          <Icon
            name="analytics"
            size={24}
            color={selectedTab === 'analysis' ? '#fff' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'analysis' && styles.selectedTabText,
            ]}
          >
            Analysis
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'works' && renderWorksTab()}
      {selectedTab === 'persona' && renderPersonaTab()}
      {selectedTab === 'analysis' && renderAnalysisTab()}
      
      {renderAnalysisModal()}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  selectedTab: {
    backgroundColor: '#2a2a2a',
  },
  tabText: {
    color: '#888',
    marginLeft: 8,
    fontSize: 16,
  },
  selectedTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  worksList: {
    flex: 1,
    padding: 16,
  },
  workCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  workHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  workDate: {
    color: '#888',
    fontSize: 14,
  },
  workType: {
    color: '#007AFF',
    fontSize: 14,
    marginBottom: 8,
  },
  workPreview: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#333',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
  },
  personaContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 8,
  },
  evolutionEntry: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  evolutionText: {
    color: '#ccc',
    fontSize: 14,
  },
  analysisContainer: {
    flex: 1,
    padding: 16,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  analysisDescription: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 24,
    lineHeight: 22,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  analysisSummary: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  analysisSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  analysisText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
  },
  viewDetailsButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  viewDetailsButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalScroll: {
    maxHeight: '80%',
  },
  analysisSection: {
    marginBottom: 24,
  },
  analysisSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  analysisSectionText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
  },
  analysisItem: {
    marginBottom: 8,
  },
  analysisItemText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 