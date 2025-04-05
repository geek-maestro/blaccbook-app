import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { Text, Card, Button, Rating, Slider } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, query, getDocs, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { firestore } from '../../firebase/config';

const ServiceListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { searchQuery, filter, category, showFilters } = route.params || {};

  // States
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [filtersVisible, setFiltersVisible] = useState(showFilters || false);
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [noMoreResults, setNoMoreResults] = useState(false);
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState(category || '');
  const [minimumRating, setMinimumRating] = useState(0);
  const [sortBy, setSortBy] = useState('rating'); // 'price', 'rating', 'newest'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  // Location options (would normally come from backend)
  const locations = ['Any Location', 'New York', 'Los Angeles', 'Chicago', 'Miami', 'Houston'];
  
  // Service type options (would normally come from backend)
  const serviceTypes = ['Any Type', 'Hair', 'Massage', 'Spa', 'Nails', 'Makeup', 'Barber', 'Fitness', 'Wellness'];

  useEffect(() => {
    if (category) {
      setSelectedServiceType(category);
    }
    fetchServices(true);
  }, [category, filter]);

  const fetchServices = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
      setNoMoreResults(false);
    } else {
      setLoadingMore(true);
    }
    
    try {
      let serviceQuery = collection(firestore, 'services');
      let queryConstraints = [];
      
      // Apply filter based on navigation params or current filter state
      if (filter === 'topRated') {
        queryConstraints.push(orderBy('rating', 'desc'));
      } else if (filter === 'featured') {
        queryConstraints.push(where('featured', '==', true));
      }
      
      // Apply search term
      if (searchTerm) {
        // Note: This is a simplified search. In a real app, you might use 
        // Firebase extensions like Algolia for better search capabilities
        queryConstraints.push(where('tags', 'array-contains', searchTerm.toLowerCase()));
      }
      
      // Apply price filter
      if (priceRange[0] > 0 || priceRange[1] < 1000) {
        queryConstraints.push(where('price', '>=', priceRange[0]));
        queryConstraints.push(where('price', '<=', priceRange[1]));
      }
      
      // Apply location filter
      if (selectedLocation && selectedLocation !== 'Any Location') {
        queryConstraints.push(where('location', '==', selectedLocation));
      }
      
      // Apply service type filter
      if (selectedServiceType && selectedServiceType !== 'Any Type') {
        queryConstraints.push(where('type', '==', selectedServiceType));
      }
      
      // Apply minimum rating filter
      if (minimumRating > 0) {
        queryConstraints.push(where('rating', '>=', minimumRating));
      }
      
      // Apply sorting
      queryConstraints.push(orderBy(sortBy, sortOrder));
      
      // Add pagination
      if (!isInitialLoad && lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }
      
      // Limit results
      queryConstraints.push(limit(10));
      
      // Execute query
      const q = query(serviceQuery, ...queryConstraints);
      const snapshot = await getDocs(q);
      
      if (snapshot.empty && isInitialLoad) {
        setServices([]);
        setNoMoreResults(true);
      } else if (snapshot.empty) {
        setNoMoreResults(true);
      } else {
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (isInitialLoad) {
          setServices(servicesData);
        } else {
          setServices(prev => [...prev, ...servicesData]);
        }
        
        // Set the last document for pagination
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices(true);
  };

  const loadMoreServices = () => {
    if (!loadingMore && !noMoreResults) {
      fetchServices(false);
    }
  };

  const applyFilters = () => {
    setFiltersVisible(false);
    fetchServices(true);
  };

  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedLocation('');
    setSelectedServiceType('');
    setMinimumRating(0);
    setSortBy('rating');
    setSortOrder('desc');
  };

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id })}
    >
      <Card containerStyle={styles.serviceCard}>
        <Card.Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.serviceImage}
        />
        <View style={styles.serviceContent}>
          <View style={styles.serviceTypeContainer}>
            <Text style={styles.serviceType}>{item.type}</Text>
          </View>
          
          <Text style={styles.serviceTitle} numberOfLines={1}>{item.title}</Text>
          
          <View style={styles.ratingContainer}>
            <Rating
              readonly
              startingValue={item.rating || 0}
              imageSize={16}
              style={styles.rating}
            />
            <Text style={styles.reviewCount}>({item.reviewCount || 0})</Text>
          </View>
          
          <Text style={styles.servicePrice}>${item.price}</Text>
          
          <Text style={styles.serviceLocation} numberOfLines={1}>
            <Icon name="map-marker" size={14} color="#888" /> {item.location}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={() => fetchServices(true)}
            returnKeyType="search"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFiltersVisible(true)}
        >
          <Icon name="sliders" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No services found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          <Button
            title="Reset Filters"
            onPress={() => {
              resetFilters();
              fetchServices(true);
            }}
            buttonStyle={styles.resetButton}
            titleStyle={styles.resetButtonText}
          />
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.servicesList}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={loadMoreServices}
          onEndReachedThreshold={0.3}
          ListFooterComponent={() => 
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#000" />
              </View>
            ) : noMoreResults ? (
              <Text style={styles.noMoreResultsText}>No more services</Text>
            ) : null
          }
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={filtersVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFiltersVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFiltersVisible(false)}>
                <Icon name="times" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <Text style={styles.rangeText}>${priceRange[0]} - ${priceRange[1]}</Text>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                minimumValue={0}
                maximumValue={1000}
                step={10}
                allowTouchTrack
                trackStyle={{ height: 5, backgroundColor: '#d0d0d0' }}
                thumbStyle={{ height: 20, width: 20, backgroundColor: '#000' }}
                thumbTouchSize={{ width: 40, height: 40 }}
                minimumTrackTintColor="#000"
              />
            </View>

            {/* Location Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Location</Text>
              <View style={styles.optionsContainer}>
                {locations.map((location, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      selectedLocation === location && styles.selectedOption
                    ]}
                    onPress={() => setSelectedLocation(location === 'Any Location' ? '' : location)}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        selectedLocation === location && styles.selectedOptionText
                      ]}
                    >
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Service Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Service Type</Text>
              <View style={styles.optionsContainer}>
                {serviceTypes.map((type, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      selectedServiceType === type && styles.selectedOption
                    ]}
                    onPress={() => setSelectedServiceType(type === 'Any Type' ? '' : type)}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        selectedServiceType === type && styles.selectedOptionText
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rating Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              <Rating
                showRating={false}
                startingValue={minimumRating}
                onFinishRating={setMinimumRating}
                style={styles.ratingPicker}
                imageSize={30}
              />
            </View>

            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortOptions}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'rating' && styles.selectedSortButton
                  ]}
                  onPress={() => {
                    setSortBy('rating');
                    setSortOrder('desc');
                  }}
                >
                  <Text 
                    style={[
                      styles.sortButtonText,
                      sortBy === 'rating' && styles.selectedSortButtonText
                    ]}
                  >
                    Top Rated
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'price' && sortOrder === 'asc' && styles.selectedSortButton
                  ]}
                  onPress={() => {
                    setSortBy('price');
                    setSortOrder('asc');
                  }}
                >
                  <Text 
                    style={[
                      styles.sortButtonText,
                      sortBy === 'price' && sortOrder === 'asc' && styles.selectedSortButtonText
                    ]}
                  >
                    Price: Low to High
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'price' && sortOrder === 'desc' && styles.selectedSortButton
                  ]}
                  onPress={() => {
                    setSortBy('price');
                    setSortOrder('desc');
                  }}
                >
                  <Text 
                    style={[
                      styles.sortButtonText,
                      sortBy === 'price' && sortOrder === 'desc' && styles.selectedSortButtonText
                    ]}
                  >
                    Price: High to Low
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'createdAt' && styles.selectedSortButton
                  ]}
                  onPress={() => {
                    setSortBy('createdAt');
                    setSortOrder('desc');
                  }}
                >
                  <Text 
                    style={[
                      styles.sortButtonText,
                      sortBy === 'createdAt' && styles.selectedSortButtonText
                    ]}
                  >
                    Newest First
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterButtons}>
              <Button
                title="Reset"
                onPress={resetFilters}
                buttonStyle={styles.resetFilterButton}
                titleStyle={styles.resetFilterButtonText}
                containerStyle={styles.filterButtonContainer}
              />
              <Button
                title="Apply Filters"
                onPress={applyFilters}
                buttonStyle={styles.applyFilterButton}
                titleStyle={styles.applyFilterButtonText}
                containerStyle={styles.filterButtonContainer}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicesList: {
    padding: 10,
  },
  serviceItem: {
    marginBottom: 15,
  },
  serviceCard: {
    margin: 0,
    borderRadius: 10,
    padding: 0,
    overflow: 'hidden',
  },
  serviceImage: {
    height: 180,
    width: '100%',
  },
  serviceContent: {
    padding: 15,
  },
  serviceTypeContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  serviceType: {
    fontSize: 12,
    color: '#666',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rating: {
    paddingVertical: 5,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  serviceLocation: {
    fontSize: 14,
    color: '#666',
  },
  footerLoading: {
    padding: 20,
    alignItems: 'center',
  },
  noMoreResultsText: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  resetButton: {
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  resetButtonText: {
    fontSize: 16,
  },
  // Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterSection: {
    marginTop: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  rangeText: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
    color: '#666',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
  },
  selectedOption: {
    backgroundColor: '#000',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedOptionText: {
    color: '#fff',
  },
  ratingPicker: {
    paddingVertical: 10,
  },
  sortOptions: {
    flexDirection: 'column',
  },
  sortButton: {
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
  },
  selectedSortButton: {
    backgroundColor: '#000',
  },
  sortButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  selectedSortButtonText: {
    color: '#fff',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 10,
  },
  filterButtonContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  resetFilterButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 10,
  },
  resetFilterButtonText: {
    color: '#000',
  },
  applyFilterButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyFilterButtonText: {
    color: '#fff',
  }
});

export default ServiceListScreen;
