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
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhilosophicalAnalysisService } from '../services/PhilosophicalAnalysisService';

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
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('philosophical_works', JSON.stringify(works));
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
      if (!works || works.length === 0) {
        Alert.alert('No Data', 'No philosophical works found to analyze.');
        setAnalyzing(false);
        return;
      }
  
      // Extract all content from works
      const worksContent = works.map(work => work.content).join('\n\n');
  
      // Use the PhilosophicalAnalysisService to analyze the works
      const analysisResult = await PhilosophicalAnalysisService.analyzePhilosophicalViewpoint(worksContent);
      setAnalysis(analysisResult);
      setShowAnalysisModal(true);
      
      saveData();
    } catch (error) {
      console.error('Error analyzing works:', error);
      Alert.alert('Error', 'Failed to analyze your philosophical works. Please try again.');
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
            }}
          >
            <Text style={styles.workTitle}>{work.title}</Text>
            <Text style={styles.workDate}>{new Date(work.date).toLocaleDateString()}</Text>
            <Text style={styles.workType}>{work.type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAnalysisTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={styles.analyzeButton}
        onPress={analyzeConversationHistory}
        disabled={analyzing}
      >
        <Icon name="analytics" size={24} color="#fff" />
        <Text style={styles.analyzeButtonText}>
          {analyzing ? 'Analyzing...' : 'Analyze Conversation History'}
        </Text>
      </TouchableOpacity>

      {analysis && (
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>Your Philosophical Analysis</Text>
          <Text style={styles.analysisText}>{analysis.summary}</Text>
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
              <Text style={styles.modalText}>School: {analysis.school}</Text>
              <Text style={styles.modalText}>Key Themes: {analysis.keyThemes.join(', ')}</Text>
              <Text style={styles.modalText}>Strengths: {analysis.strengths.join(', ')}</Text>
              <Text style={styles.modalText}>Areas for Growth: {analysis.areasForGrowth.join(', ')}</Text>
              <Text style={styles.modalText}>Summary: {analysis.summary}</Text>
            </>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAnalysisModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal Philosophy Hub</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'works' && styles.selectedTab]}
          onPress={() => setSelectedTab('works')}
        >
          <Text style={[styles.tabText, selectedTab === 'works' && styles.selectedTabText]}>
            Works
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'analysis' && styles.selectedTab]}
          onPress={() => setSelectedTab('analysis')}
        >
          <Text style={[styles.tabText, selectedTab === 'analysis' && styles.selectedTabText]}>
            Analysis
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'works' ? renderWorksTab() : renderAnalysisTab()}
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