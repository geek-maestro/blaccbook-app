import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  TextInput,
  ActivityIndicator 
} from 'react-native';
import { Text, Icon, Button } from 'react-native-elements';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Service } from '../../types';
import { collection, query, limit, getDocs, orderBy, where } from 'firebase/firestore';
import { firestore } from '../../firebase/config';

// Service category icons map
const categoryIcons: {[key: string]: string} = {
  'beauty': 'cut',
  'home': 'home',
  'health': 'heartbeat',
  'automotive': 'car',
  'education': 'book',
  'events': 'calendar',
  'technology': 'laptop',
  'food': 'utensils',
};

const HomeScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [topPicks, setTopPicks] = useState<Service[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Fetch top picks (highest rated services)
      const topPicksRef = query(
        collection(firestore, 'services'), 
        orderBy('rating', 'desc'), 
        limit(5)
      );
      
      const topPicksSnapshot = await getDocs(topPicksRef);
      const topPicksData = topPicksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      
      setTopPicks(topPicksData);
      
      // Fetch featured listings (featured flag or recently added)
      const featuredRef = query(
        collection(firestore, 'services'),
        where('featured', '==', true),
        limit(5)
      );
      
      const featuredSnapshot = await getDocs(featuredRef);
      const featuredData = featuredSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      
      setFeaturedListings(featuredData);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch categories from a categories collection
      const categoriesRef = collection(firestore, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const categoriesData = categoriesSnapshot.docs.map(doc => doc.data().name);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories if fetch fails
      setCategories(Object.keys(categoryIcons));
    }
  };

  const handleSearch = () => {
    router.push({
      pathname: '/service/list',
      params: { query: searchQuery }
    });
  };

  const navigateToService = (serviceId: string) => {
    router.push(`/service/${serviceId}`);
  };

  const navigateToServiceList = (category?: string) => {
    router.push({
      pathname: '/service/list',
      params: { category: category }
    });
  };

  const renderServiceCard = ({ item }: { item: Service }) => (
    <TouchableOpacity onPress={() => navigateToService(item.id)} style={styles.serviceCard}>
      <View style={[styles.card, { backgroundColor: '#fff' }]}>
        <Image 
          source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
          style={styles.cardImage}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardPrice}>${item.price}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.ratingContainer}>
              <Icon name="star" type="font-awesome" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              <Icon name="map-marker" type="font-awesome" size={12} color="#666" /> {item.location.address}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.categoryItem} 
      onPress={() => navigateToServiceList(item)}
    >
      <View style={styles.categoryIconContainer}>
        <Icon 
          name={categoryIcons[item.toLowerCase()] || 'tag'} 
          type="font-awesome" 
          size={20} 
          color="#fff" 
        />
      </View>
      <Text style={styles.categoryText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userProfile?.name || 'Guest'}</Text>
          <Text style={styles.subGreeting}>Find and book services</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile/index')}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'G'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" type="font-awesome" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => navigateToServiceList()}>
          <Icon name="sliders" type="font-awesome" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item}
              style={styles.categoriesList}
            />
          </View>

          {/* Top Picks */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Picks</Text>
              <TouchableOpacity onPress={() => navigateToServiceList()}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={topPicks}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderServiceCard}
              keyExtractor={(item) => item.id}
              style={styles.servicesList}
            />
          </View>

          {/* Featured Listings */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Listings</Text>
              <TouchableOpacity onPress={() => navigateToServiceList()}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredListings}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderServiceCard}
              keyExtractor={(item) => item.id}
              style={styles.servicesList}
            />
          </View>

          {/* Spacer for bottom navigation */}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#000',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 10,
  },
  seeAllText: {
    color: '#000',
    fontWeight: 'bold',
  },
  categoriesList: {
    paddingLeft: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  servicesList: {
    paddingLeft: 10,
  },
  serviceCard: {
    width: 180,
    marginRight: 10,
  },
  card: {
    padding: 0,
    margin: 5,
    borderRadius: 10,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    height: 120,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
});

export default HomeScreen;