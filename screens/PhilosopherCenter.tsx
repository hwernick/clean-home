import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Ionicons';

type PhilosopherCenterProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PhilosopherCenter'>;
};

type Philosopher = {
  id: string;
  name: string;
  description: string;
  image: string;
  url: string;
};

const MAJOR_PHILOSOPHERS = {
  'socrates': { name: 'Socrates', id: 'Q913' },
  'plato': { name: 'Plato', id: 'Q859' },
  'aristotle': { name: 'Aristotle', id: 'Q868' },
  'mill': { name: 'John Stuart Mill', id: 'Q12718' },
  'locke': { name: 'John Locke', id: 'Q9359' },
  'descartes': { name: 'René Descartes', id: 'Q9191' },
  'nietzsche': { name: 'Friedrich Nietzsche', id: 'Q9358' }
};

export default function PhilosopherCenter({ navigation }: PhilosopherCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([]);
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<Philosopher | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Load initial philosophers when the screen opens
  useEffect(() => {
    const loadInitialPhilosophers = async () => {
      setLoading(true);
      try {
        const philosopherIds = Object.values(MAJOR_PHILOSOPHERS).map(p => p.id);
        const response = await fetch(
          `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${philosopherIds.join('|')}&format=json&origin=*&props=descriptions|labels|claims`
        );
        const data = await response.json();
        
        const results: Philosopher[] = Object.values(data.entities)
          .map((entity: any) => {
            const philosopher = Object.values(MAJOR_PHILOSOPHERS).find(p => p.id === entity.id);
            if (!philosopher) return null;

            let imageUrl = '';
            if (entity.claims?.P18) {
              const imageClaim = entity.claims.P18[0];
              if (imageClaim.mainsnak?.datavalue?.value) {
                const imageName = imageClaim.mainsnak.datavalue.value;
                // Use a higher quality image size and ensure proper encoding
                imageUrl = `https://commons.wikimedia.org/w/thumb.php?width=500&fname=${encodeURIComponent(imageName)}`;
              }
            }

            return {
              id: entity.id,
              name: philosopher.name,
              description: entity.descriptions?.en?.value || '',
              image: imageUrl,
              url: `https://www.wikidata.org/wiki/${entity.id}`
            } as Philosopher;
          })
          .filter((philosopher): philosopher is Philosopher => philosopher !== null);

        setPhilosophers(results);
      } catch (error) {
        console.error('Error loading initial philosophers:', error);
        // Set a default image URL for each philosopher if the API call fails
        const fallbackResults: Philosopher[] = Object.values(MAJOR_PHILOSOPHERS).map(philosopher => ({
          id: philosopher.id,
          name: philosopher.name,
          description: 'Loading description...',
          image: `https://commons.wikimedia.org/w/thumb.php?width=500&fname=${encodeURIComponent(philosopher.name.toLowerCase().replace(' ', '_') + '.jpg')}`,
          url: `https://www.wikidata.org/wiki/${philosopher.id}`
        }));
        setPhilosophers(fallbackResults);
      } finally {
        setLoading(false);
      }
    };

    loadInitialPhilosophers();
  }, []);

  const searchWikipedia = async (query: string) => {
    if (!query.trim()) {
      // When search is cleared, show the initial philosophers again
      const loadInitialPhilosophers = async () => {
        setLoading(true);
        try {
          const philosopherIds = Object.values(MAJOR_PHILOSOPHERS).map(p => p.id);
          const response = await fetch(
            `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${philosopherIds.join('|')}&format=json&origin=*&props=descriptions|labels|claims`
          );
          const data = await response.json();
          
          const results: Philosopher[] = Object.values(data.entities)
            .map((entity: any) => {
              const philosopher = Object.values(MAJOR_PHILOSOPHERS).find(p => p.id === entity.id);
              if (!philosopher) return null;

              let imageUrl = '';
              if (entity.claims?.P18) {
                const imageClaim = entity.claims.P18[0];
                if (imageClaim.mainsnak?.datavalue?.value) {
                  const imageName = imageClaim.mainsnak.datavalue.value;
                  // Use a higher quality image size and ensure proper encoding
                  imageUrl = `https://commons.wikimedia.org/w/thumb.php?width=500&fname=${encodeURIComponent(imageName)}`;
                }
              }

              return {
                id: entity.id,
                name: philosopher.name,
                description: entity.descriptions?.en?.value || '',
                image: imageUrl,
                url: `https://www.wikidata.org/wiki/${entity.id}`
              } as Philosopher;
            })
            .filter((philosopher): philosopher is Philosopher => philosopher !== null);

          setPhilosophers(results);
        } catch (error) {
          console.error('Error loading initial philosophers:', error);
        } finally {
          setLoading(false);
        }
      };

      loadInitialPhilosophers();
      return;
    }

    setLoading(true);
    try {
      // First check if the query matches a major philosopher
      const searchLower = query.toLowerCase();
      const exactMatch = Object.entries(MAJOR_PHILOSOPHERS).find(([key, _]) => 
        key.includes(searchLower) || searchLower.includes(key)
      );

      if (exactMatch) {
        const [_, philosopher] = exactMatch;
        console.log('Found exact match:', philosopher.name);
        
        // Get detailed information about the philosopher using their Wikidata ID
        const entityResponse = await fetch(
          `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${philosopher.id}&format=json&origin=*&props=descriptions|labels|claims`
        );
        const entityData = await entityResponse.json();
        const entity = entityData.entities[philosopher.id];
        
        // Get English description
        const description = entity.descriptions?.en?.value || '';
        
        // Get image if available
        let imageUrl = '';
        if (entity.claims?.P18) { // P18 is the property ID for image
          const imageClaim = entity.claims.P18[0];
          if (imageClaim.mainsnak?.datavalue?.value) {
            const imageName = imageClaim.mainsnak.datavalue.value;
            imageUrl = `https://commons.wikimedia.org/w/thumb.php?width=200&fname=${encodeURIComponent(imageName)}`;
          }
        }

        setPhilosophers([{
          id: philosopher.id,
          name: philosopher.name,
          description: description,
          image: imageUrl,
          url: `https://www.wikidata.org/wiki/${philosopher.id}`
        }]);
      } else {
        console.log('No exact match found, using search');
        // Search Wikidata for philosophers
        const response = await fetch(
          `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&origin=*&type=item`
        );
        const data = await response.json();
        
        if (!data.search) {
          console.log('No search results found');
          setPhilosophers([]);
          return;
        }

        // Filter for philosophers (Q5 is human, P106 is occupation, Q4964182 is philosopher)
        const philosopherIds = data.search
          .filter((result: any) => result.concepturi?.includes('Q5'))
          .map((result: any) => result.id);

        if (philosopherIds.length > 0) {
          // Get detailed information for each philosopher
          const entityResponse = await fetch(
            `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${philosopherIds.join('|')}&format=json&origin=*&props=descriptions|labels|claims`
          );
          const entityData = await entityResponse.json();
          
          const results = Object.values(entityData.entities)
            .filter((entity: any) => {
              // Check if the entity has philosopher as occupation
              const occupations = entity.claims?.P106 || [];
              return occupations.some((claim: any) => 
                claim.mainsnak?.datavalue?.value?.id === 'Q4964182'
              );
            })
            .map((entity: any, index: number) => {
              // Get image if available
              let imageUrl = '';
              if (entity.claims?.P18) {
                const imageClaim = entity.claims.P18[0];
                if (imageClaim.mainsnak?.datavalue?.value) {
                  const imageName = imageClaim.mainsnak.datavalue.value;
                  imageUrl = `https://commons.wikimedia.org/w/thumb.php?width=200&fname=${encodeURIComponent(imageName)}`;
                }
              }

              return {
                id: entity.id,
                name: entity.labels?.en?.value || 'Unknown',
                description: entity.descriptions?.en?.value || '',
                image: imageUrl,
                url: `https://www.wikidata.org/wiki/${entity.id}`
              };
            });

          console.log('Found search results:', results.length);
          setPhilosophers(results);
        } else {
          setPhilosophers([]);
        }
      }
    } catch (error: any) {
      console.error('Error searching Wikidata:', error);
      setPhilosophers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhilosopherImage = async (philosopher: Philosopher) => {
    try {
      // Try to get image from Wikipedia API first
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
          philosopher.name
        )}&prop=pageimages&format=json&origin=*&pithumbsize=500`
      );
      const data = await response.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      const imageUrl = pages[pageId].thumbnail?.source;

      if (imageUrl) {
        setPhilosophers(prev =>
          prev.map(p =>
            p.id === philosopher.id ? { ...p, image: imageUrl } : p
          )
        );
      } else {
        // If no image found, try Wikidata API
        const wikidataResponse = await fetch(
          `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${philosopher.id}&format=json&origin=*&props=claims`
        );
        const wikidataData = await wikidataResponse.json();
        const entity = wikidataData.entities[philosopher.id];
        
        if (entity?.claims?.P18) {
          const imageClaim = entity.claims.P18[0];
          if (imageClaim.mainsnak?.datavalue?.value) {
            const imageName = imageClaim.mainsnak.datavalue.value;
            const newImageUrl = `https://commons.wikimedia.org/w/thumb.php?width=500&fname=${encodeURIComponent(imageName)}`;
            setPhilosophers(prev =>
              prev.map(p =>
                p.id === philosopher.id ? { ...p, image: newImageUrl } : p
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error fetching philosopher image:', error);
    }
  };

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      searchWikipedia(searchQuery);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const renderPhilosopherItem = ({ item }: { item: Philosopher }) => (
    <TouchableOpacity
      style={styles.philosopherCard}
      onPress={() => setSelectedPhilosopher(item)}
    >
      <View style={styles.cardContent}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.philosopherImage}
            onError={() => {
              // If image fails to load, try to fetch it again
              fetchPhilosopherImage(item);
            }}
          />
        ) : (
          <View style={[styles.philosopherImage, styles.placeholderImage]}>
            <Icon name="person" size={40} color="#666" />
          </View>
        )}
        <View style={styles.philosopherInfo}>
          <Text style={styles.philosopherName}>{item.name}</Text>
          <Text style={styles.philosopherDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPhilosopherDetail = () => {
    if (!selectedPhilosopher) return null;

    return (
      <View style={styles.detailContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedPhilosopher(null)}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back to Search</Text>
        </TouchableOpacity>
        
        <ScrollView style={styles.detailScroll}>
          {selectedPhilosopher.image ? (
            <Image source={{ uri: selectedPhilosopher.image }} style={styles.detailImage} />
          ) : (
            <View style={[styles.detailImage, styles.placeholderImage]}>
              <Icon name="person" size={60} color="#666" />
            </View>
          )}
          <Text style={styles.detailName}>{selectedPhilosopher.name}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionText}>{selectedPhilosopher.description}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => {
              navigation.navigate('Dialogue', {
                initialMessage: `Tell me more about ${selectedPhilosopher.name} and their philosophical ideas.`
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
            <Text style={styles.subtitle}>Search and explore philosophers</Text>
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
            {loading && (
              <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
            )}
          </View>
          
          <FlatList
            data={philosophers}
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
  loadingIndicator: {
    marginLeft: 8,
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
  placeholderImage: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
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
  philosopherDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
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