import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhilosophicalAnalysisService } from '../services/PhilosophicalAnalysisService';
import { LoggingService } from '../services/LoggingService';
import { useTheme } from '../contexts/ThemeContext';

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
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'works' | 'analysis'>('works');
  const [analysis, setAnalysis] = useState<PhilosophicalAnalysis | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [newWork, setNewWork] = useState<Partial<PhilosophicalWork>>({
    title: '',
    content: '',
    type: 'essay',
    tags: [],
  });

  const { isDarkMode } = useTheme();
  const theme = {
    background: isDarkMode ? '#1c1c1c' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    subtitle: isDarkMode ? '#888' : '#666',
    card: isDarkMode ? '#232323' : '#f8f8f8',
    border: isDarkMode ? '#444' : '#ddd',
    button: '#007AFF',
    secondaryButton: isDarkMode ? '#2a2a2a' : '#e5e5e5',
    buttonText: '#fff',
  };

  // Memoize expensive computations
  const worksContent = useMemo(() => 
    works.map(work => work.content).join('\n\n'),
    [works]
  );

  // Memoize callbacks
  const handleUploadDocument = useCallback(async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.assets?.[0]) {
        const newWork: PhilosophicalWork = {
          id: Date.now().toString(),
          title: result.assets[0].name,
          content: 'Document content will be processed here...',
          date: new Date().toISOString(),
          tags: [],
          type: 'essay',
        };

        setWorks(prev => [newWork, ...prev]);
        await saveData();
      }
    } catch (error) {
      LoggingService.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedWorks = await AsyncStorage.getItem('philosophical_works');
      
      if (storedWorks) {
        setWorks(JSON.parse(storedWorks));
      }
    } catch (error) {
      LoggingService.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('philosophical_works', JSON.stringify(works));
    } catch (error) {
      LoggingService.error('Error saving data:', error);
    }
  };

  const analyzeConversationHistory = async () => {
    setAnalyzing(true);
    try {
      if (!works || works.length === 0) {
        Alert.alert('No Data', 'No philosophical works found to analyze.');
        setAnalyzing(false);
        return;
      }
  
      // Use the PhilosophicalAnalysisService to analyze the works
      const analysisResult = await PhilosophicalAnalysisService.analyzePhilosophicalViewpoint(worksContent);
      setAnalysis(analysisResult);
      setShowAnalysisModal(true);
      
      saveData();
    } catch (error) {
      LoggingService.error('Error analyzing works:', error);
      Alert.alert('Error', 'Failed to analyze your philosophical works. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderWorksTab = (theme: any) => (
    <View style={[styles.tabContent, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.uploadButton, { backgroundColor: theme.button }]}
        onPress={handleUploadDocument}
        disabled={loading}
      >
        <Icon name="cloud-upload" size={24} color={theme.buttonText} />
        <Text style={[styles.uploadButtonText, { color: theme.buttonText }]}>
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
            }}
          >
            <Text style={[styles.workTitle, { color: theme.text }]}>{work.title}</Text>
            <Text style={[styles.workDate, { color: theme.subtitle }]}>{new Date(work.date).toLocaleDateString()}</Text>
            <Text style={[styles.workType, { color: theme.text }]}>{work.type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAnalysisTab = (theme: any) => (
    <View style={[styles.tabContent, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.analyzeButton, { backgroundColor: theme.button }]}
        onPress={analyzeConversationHistory}
        disabled={analyzing}
      >
        <Icon name="analytics" size={24} color={theme.buttonText} />
        <Text style={[styles.analyzeButtonText, { color: theme.buttonText }]}>
          {analyzing ? 'Analyzing...' : 'Analyze Conversation History'}
        </Text>
      </TouchableOpacity>

      {analysis && (
        <View style={[styles.analysisContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.analysisTitle, { color: theme.text }]}>Your Philosophical Analysis</Text>
          <Text style={[styles.analysisText, { color: theme.text }]}>{analysis.summary}</Text>
        </View>
      )}
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
          <Text style={styles.modalTitle}>Analysis Results</Text>
          {analysis && (
            <>
              <Text style={[styles.modalText, { color: theme.text }]}>School: {analysis.school}</Text>
              <Text style={[styles.modalText, { color: theme.text }]}>Key Themes: {analysis.keyThemes.join(', ')}</Text>
              <Text style={[styles.modalText, { color: theme.text }]}>Strengths: {analysis.strengths.join(', ')}</Text>
              <Text style={[styles.modalText, { color: theme.text }]}>Areas for Growth: {analysis.areasForGrowth.join(', ')}</Text>
              <Text style={[styles.modalText, { color: theme.text }]}>Summary: {analysis.summary}</Text>
            </>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAnalysisModal(false)}
          >
            <Text style={[styles.closeButtonText, { color: theme.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Personal Philosophy Hub</Text>
      </View>

      <View style={[styles.tabBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: selectedTab === 'works' ? theme.button : theme.background }]}
          onPress={() => setSelectedTab('works')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'works' ? theme.buttonText : theme.subtitle, fontWeight: selectedTab === 'works' ? 'bold' : 'normal' }]}>
            Works
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: selectedTab === 'analysis' ? theme.button : theme.background }]}
          onPress={() => setSelectedTab('analysis')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'analysis' ? theme.buttonText : theme.subtitle, fontWeight: selectedTab === 'analysis' ? 'bold' : 'normal' }]}>
            Analysis
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {selectedTab === 'works' ? renderWorksTab(theme) : renderAnalysisTab(theme)}
      </View>
      {renderAnalysisModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontSize: 16,
  },
  selectedTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  worksList: {
    flex: 1,
  },
  workCard: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  workTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  workDate: {
    color: '#666',
    fontSize: 14,
  },
  workType: {
    color: '#007AFF',
    fontSize: 14,
    marginTop: 8,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  analyzeButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  analysisContainer: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
  },
  analysisTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  analysisText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 8,
    width: '90%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 