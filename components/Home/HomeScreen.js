import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  ActivityIndicator,
  TextInput,
  RefreshControl
} from 'react-native';
import { Text, Card, Button, Rating } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../../firebase/config';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [topPicks, setTopPicks] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch top picks (services with highest ratings)
      const topPicksQuery = query(
        collection(firestore, 'services'),
        orderBy('rating', 'desc'),
        limit(5)
      );
      
      const topPicksSnapshot = await getDocs(topPicksQuery);
      const topPicksData = topPicksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTopPicks(topPicksData);
      
      // Fetch featured listings (services marked as featured)
      const featuredQuery = query(
        collection(firestore, 'services'),
        where('featured', '==', true),
        limit(8)
      );
      
      const featuredSnapshot = await getDocs(featuredQuery);
      const featuredData = featuredSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFeaturedListings(featuredData);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleSearch = () => {
    navigation.navigate('ServiceList', { searchQuery });
  };

  const renderTopPickItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.topPickItem}
      onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id })}
    >
      <Card containerStyle={styles.topPickCard}>
        <Card.Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.topPickImage}
        />
        <View style={styles.topPickContent}>
          <Text style={styles.topPickTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.ratingContainer}>
            <Rating 
              readonly
              startingValue={item.rating || 0}
              imageSize={14}
              style={styles.rating}
            />
            <Text style={styles.ratingText}>({item.reviewCount || 0})</Text>
          </View>
          <Text style={styles.topPickPrice}>${item.price}</Text>
          <Text style={styles.topPickLocation} numberOfLines={1}>
            <Icon name="map-marker" size={12} color="#888" /> {item.location}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.featuredItem}
      onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id })}
    >
      <Card containerStyle={styles.featuredCard}>
        <Card.Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.featuredImage}
        />
        <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.featuredMetaContainer}>
          <Text style={styles.featuredPrice}>${item.price}</Text>
          <View style={styles.featuredRatingContainer}>
            <Icon name="star" size={12} color="#FFD700" />
            <Text style={styles.featuredRatingText}>{item.rating?.toFixed(1) || '0.0'}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text h4 style={styles.welcomeText}>Find the best services</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notification')}
            style={styles.notificationButton}
          >
            <Icon name="bell" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={18} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => navigation.navigate('ServiceList', { showFilters: true })}
          >
            <Icon name="sliders" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Picks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ServiceList', { filter: 'topRated' })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {topPicks.length > 0 ? (
            <FlatList
              data={topPicks}
              renderItem={renderTopPickItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topPicksList}
            />
          ) : (
            <Text style={styles.emptyText}>No top picks available</Text>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Listings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ServiceList', { filter: 'featured' })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {featuredListings.length > 0 ? (
            <FlatList
              data={featuredListings}
              renderItem={renderFeaturedItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          ) : (
            <Text style={styles.emptyText}>No featured listings available</Text>
          )}
        </View>

        <View style={styles.categoriesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Service Categories</Text>
          </View>
          
          <View style={styles.categoriesGrid}>
            {['Hair', 'Massage', 'Spa', 'Nails', 'Makeup', 'Barber', 'Fitness', 'Wellness'].map((category, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.categoryItem}
                onPress={() => navigation.navigate('ServiceList', { category })}
              >
                <View style={styles.categoryIconContainer}>
                  <Icon name={getCategoryIcon(category)} size={24} color="#000" />
                </View>
                <Text style={styles.categoryText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to get icon name based on category
const getCategoryIcon = (category) => {
  const icons = {
    'Hair': 'cut',
    'Massage': 'hand-paper-o',
    'Spa': 'tint',
    'Nails': 'hand-scissors-o',
    'Makeup': 'paint-brush',
    'Barber': 'male',
    'Fitness': 'heartbeat',
    'Wellness': 'leaf'
  };
  
  return icons[category] || 'tag';
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginRight: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
  },
  filterButton: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#666',
  },
  topPicksList: {
    paddingRight: 10,
  },
  topPickItem: {
    width: 220,
    marginRight: 10,
  },
  topPickCard: {
    margin: 0,
    padding: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  topPickImage: {
    height: 120,
    width: '100%',
  },
  topPickContent: {
    padding: 10,
  },
  topPickTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rating: {
    paddingVertical: 5,
  },
  ratingText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  topPickPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  topPickLocation: {
    fontSize: 12,
    color: '#888',
  },
  featuredList: {
    paddingRight: 10,
  },
  featuredItem: {
    width: 160,
    marginRight: 10,
  },
  featuredCard: {
    margin: 0,
    padding: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  featuredImage: {
    height: 100,
    width: '100%',
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    padding: 10,
    paddingBottom: 5,
  },
  featuredMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    paddingTop: 0,
  },
  featuredPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  featuredRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredRatingText: {
    fontSize: 12,
    marginLeft: 3,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    padding: 20,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
  }
});

export default HomeScreen;
