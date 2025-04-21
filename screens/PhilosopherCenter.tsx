import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Ionicons';

type PhilosopherCenterProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PhilosopherCenter'>;
};

// Sample philosopher data
const philosophers = [
  {
    id: '1',
    name: 'Socrates',
    period: 'Classical Greece (470-399 BCE)',
    school: 'Socratic Method',
    description: 'Known for the Socratic method of questioning and his famous statement "I know that I know nothing."',
    keyWorks: ['Apology', 'Crito', 'Phaedo'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Socrates_Louvre.jpg/220px-Socrates_Louvre.jpg',
  },
  {
    id: '2',
    name: 'Plato',
    period: 'Classical Greece (428-348 BCE)',
    school: 'Platonism',
    description: 'Student of Socrates and teacher of Aristotle. Founded the Academy in Athens.',
    keyWorks: ['The Republic', 'Phaedo', 'Symposium'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Plato_Silanion_Musei_Capitolini_MC137.jpg/220px-Plato_Silanion_Musei_Capitolini_MC137.jpg',
  },
  {
    id: '3',
    name: 'Aristotle',
    period: 'Classical Greece (384-322 BCE)',
    school: 'Aristotelianism',
    description: 'Student of Plato. Made significant contributions to logic, ethics, and natural sciences.',
    keyWorks: ['Nicomachean Ethics', 'Politics', 'Metaphysics'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Aristotle_Altemps_Inv8575.jpg/220px-Aristotle_Altemps_Inv8575.jpg',
  },
  {
    id: '4',
    name: 'Immanuel Kant',
    period: 'Enlightenment (1724-1804)',
    school: 'Kantianism',
    description: 'Developed the categorical imperative and transcendental idealism.',
    keyWorks: ['Critique of Pure Reason', 'Groundwork of the Metaphysics of Morals'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Kant_gemaelde_3.jpg/220px-Kant_gemaelde_3.jpg',
  },
  {
    id: '5',
    name: 'Friedrich Nietzsche',
    period: 'Modern (1844-1900)',
    school: 'Existentialism',
    description: 'Known for his critique of traditional morality and the concept of the "Übermensch."',
    keyWorks: ['Thus Spoke Zarathustra', 'Beyond Good and Evil', 'The Genealogy of Morals'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Nietzsche187a.jpg/220px-Nietzsche187a.jpg',
  },
  {
    id: '6',
    name: 'René Descartes',
    period: 'Early Modern (1596-1650)',
    school: 'Cartesianism',
    description: 'Known for "Cogito, ergo sum" and his dualistic view of mind and body.',
    keyWorks: ['Meditations on First Philosophy', 'Discourse on the Method'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg/220px-Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg',
  },
  {
    id: '7',
    name: 'John Locke',
    period: 'Early Modern (1632-1704)',
    school: 'Empiricism',
    description: 'Known for his theory of the mind as a "tabula rasa" and his influence on political liberalism.',
    keyWorks: ['An Essay Concerning Human Understanding', 'Two Treatises of Government'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/John_Locke_by_Herman_Verelst.jpg/220px-John_Locke_by_Herman_Verelin.jpg',
  },
  {
    id: '8',
    name: 'David Hume',
    period: 'Early Modern (1711-1776)',
    school: 'Empiricism',
    description: 'Known for his skepticism and the problem of induction.',
    keyWorks: ['A Treatise of Human Nature', 'An Enquiry Concerning Human Understanding'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/David_Hume_by_Allan_Ramsay.jpg/220px-David_Hume_by_Allan_Ramsay.jpg',
  },
];

export default function PhilosopherCenter({ navigation }: PhilosopherCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<string | null>(null);

  // Filter philosophers based on search query
  const filteredPhilosophers = philosophers.filter(philosopher =>
    philosopher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    philosopher.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
    philosopher.period.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPhilosopherItem = ({ item }: { item: typeof philosophers[0] }) => (
    <TouchableOpacity
      style={styles.philosopherCard}
      onPress={() => setSelectedPhilosopher(item.id)}
    >
      <View style={styles.cardContent}>
        <Image source={{ uri: item.image }} style={styles.philosopherImage} />
        <View style={styles.philosopherInfo}>
          <Text style={styles.philosopherName}>{item.name}</Text>
          <Text style={styles.philosopherPeriod}>{item.period}</Text>
          <Text style={styles.philosopherSchool}>{item.school}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPhilosopherDetail = () => {
    if (!selectedPhilosopher) return null;
    
    const philosopher = philosophers.find(p => p.id === selectedPhilosopher);
    if (!philosopher) return null;

    return (
      <View style={styles.detailContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedPhilosopher(null)}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back to List</Text>
        </TouchableOpacity>
        
        <ScrollView style={styles.detailScroll}>
          <Image source={{ uri: philosopher.image }} style={styles.detailImage} />
          <Text style={styles.detailName}>{philosopher.name}</Text>
          <Text style={styles.detailPeriod}>{philosopher.period}</Text>
          <Text style={styles.detailSchool}>{philosopher.school}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionText}>{philosopher.description}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Works</Text>
            {philosopher.keyWorks.map((work, index) => (
              <Text key={index} style={styles.workItem}>• {work}</Text>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => {
              // Navigate to Dialogue screen with a pre-filled message about the philosopher
              navigation.navigate('Dialogue', {
                initialMessage: `Tell me more about ${philosopher.name} and their philosophical ideas.`
              });
            }}
          >
            <Text style={styles.exploreButtonText}>Explore in Dialogue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {selectedPhilosopher ? (
        renderPhilosopherDetail()
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Philosopher Center</Text>
            <Text style={styles.subtitle}>Explore the great minds of philosophy</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search philosophers..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredPhilosophers}
            renderItem={renderPhilosopherItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  philosopherCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  philosopherImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  philosopherInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  philosopherName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  philosopherPeriod: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 2,
  },
  philosopherSchool: {
    fontSize: 14,
    color: '#aaa',
  },
  detailContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  detailScroll: {
    flex: 1,
    padding: 16,
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  detailPeriod: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 2,
  },
  detailSchool: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: '#ddd',
    lineHeight: 24,
  },
  workItem: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 4,
    paddingLeft: 8,
  },
  exploreButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 