import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Share,
  Linking,
  Dimensions
} from 'react-native';
import { Text, Button, Card, Rating, Image, Divider } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebase/config';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import MapView, { Marker } from 'react-native-maps';

const { width } = Dimensions.get('window');

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ServiceDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { serviceId } = route.params;
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentRating, setCurrentRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);
  
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch service details
        const serviceDoc = await getDoc(doc(firestore, 'services', serviceId));
        
        if (!serviceDoc.exists()) {
          Alert.alert('Error', 'Service not found');
          navigation.goBack();
          return;
        }
        
        const serviceData = serviceDoc.data();
        setService(serviceData);
        setCurrentRating(serviceData.rating || 0);
        
        // Fetch provider details
        if (serviceData.providerId) {
          const providerDoc = await getDoc(doc(firestore, 'users', serviceData.providerId));
          if (providerDoc.exists()) {
            setProvider(providerDoc.data());
          }
        }
        
        // Fetch reviews
        const reviewsQuery = query(
          collection(firestore, 'reviews'),
          where('serviceId', '==', serviceId),
          where('approved', '==', true)
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setReviews(reviewsData);
        
        // Check if service is in user's favorites
        if (currentUser) {
          const favoriteDoc = await getDoc(doc(firestore, 'favorites', `${currentUser.uid}_${serviceId}`));
          setIsFavorite(favoriteDoc.exists());
        }
        
        // Fetch recent bookings
        const bookingsQuery = query(
          collection(firestore, 'bookings'),
          where('serviceId', '==', serviceId),
          where('status', '==', 'completed')
        );
        
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookingsData = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentBookings(bookingsData.slice(0, 3));
        
      } catch (error) {
        console.error('Error fetching service details:', error);
        Alert.alert('Error', 'Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
    
    // Set up real-time listener for new reviews
    const unsubscribe = onSnapshot(
      query(
        collection(firestore, 'reviews'),
        where('serviceId', '==', serviceId),
        where('approved', '==', true)
      ),
      (snapshot) => {
        const updatedReviews = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReviews(updatedReviews);
      },
      (error) => {
        console.error('Reviews listener error:', error);
      }
    );
    
    return () => unsubscribe();
  }, [serviceId, currentUser]);

  const handleBookNow = () => {
    navigation.navigate('Booking', { 
      serviceId, 
      serviceTitle: service?.title,
      providerName: provider?.name,
      price: service?.price 
    });
  };

  const handleContactProvider = () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to contact the service provider');
      return;
    }
    
    if (provider && service) {
      navigation.navigate('Chat', { 
        recipientId: service.providerId,
        recipientName: provider.name,
        recipientImage: provider.profileImage
      });
    }
  };

  const handleCallProvider = () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to call the service provider');
      return;
    }
    
    if (provider && service) {
      navigation.navigate('Call', { 
        recipientId: service.providerId,
        recipientName: provider.name,
        recipientImage: provider.profileImage,
        isOutgoing: true
      });
    }
  };

  const toggleFavorite = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to save to favorites');
      return;
    }
    
    try {
      const favoriteRef = doc(firestore, 'favorites', `${currentUser.uid}_${serviceId}`);
      
      if (isFavorite) {
        await deleteDoc(favoriteRef);
        setIsFavorite(false);
      } else {
        await setDoc(favoriteRef, {
          userId: currentUser.uid,
          serviceId,
          createdAt: new Date().toISOString()
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const shareService = async () => {
    try {
      await Share.share({
        message: `Check out ${service?.title} on BlaccBook! ${service?.description}`,
        title: service?.title,
      });
    } catch (error) {
      console.error('Error sharing service:', error);
    }
  };

  const openMap = () => {
    if (service?.coordinates) {
      const { latitude, longitude } = service.coordinates;
      const url = Platform.select({
        ios: `maps:${latitude},${longitude}?q=${service.location}`,
        android: `geo:${latitude},${longitude}?q=${service.location}`
      });
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="exclamation-circle" size={60} color="#ccc" />
        <Text style={styles.errorText}>Service not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          buttonStyle={styles.errorButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={toggleFavorite}
            >
              <Icon 
                name={isFavorite ? "heart" : "heart-o"} 
                size={20} 
                color={isFavorite ? "#ff3b30" : "#000"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={shareService}
            >
              <Icon name="share" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.imageCarousel}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.floor(e.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(newIndex);
            }}
          >
            {service.images ? (
              service.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.serviceImage}
                  PlaceholderContent={<ActivityIndicator />}
                />
              ))
            ) : (
              <Image
                source={{ uri: service.imageUrl || 'https://via.placeholder.com/400' }}
                style={styles.serviceImage}
                PlaceholderContent={<ActivityIndicator />}
              />
            )}
          </ScrollView>
          
          {service.images && service.images.length > 1 && (
            <View style={styles.paginationContainer}>
              {service.images.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.paginationDot,
                    index === selectedImageIndex && styles.paginationDotActive
                  ]} 
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.serviceDetailsContainer}>
          <View style={styles.serviceTypeContainer}>
            <Text style={styles.serviceType}>{service.type}</Text>
          </View>
          
          <Text style={styles.serviceTitle}>{service.title}</Text>
          
          <View style={styles.serviceMetaContainer}>
            <View style={styles.ratingContainer}>
              <Rating
                readonly
                startingValue={currentRating}
                imageSize={16}
                style={styles.rating}
              />
              <Text style={styles.reviewCount}>({reviews.length} reviews)</Text>
            </View>
            
            <Text style={styles.servicePrice}>${service.price}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.locationContainer}
            onPress={openMap}
          >
            <Icon name="map-marker" size={16} color="#666" />
            <Text style={styles.locationText}>{service.location}</Text>
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{service.description}</Text>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availabilityContainer}>
            {WEEK_DAYS.map((day, index) => (
              <View key={index} style={styles.dayContainer}>
                <Text style={styles.dayText}>{day}</Text>
                <Text style={styles.timeText}>
                  {service.availability && service.availability[day.toLowerCase()] 
                    ? service.availability[day.toLowerCase()] 
                    : 'Closed'}
                </Text>
              </View>
            ))}
          </View>
          
          {service.coordinates && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>Location</Text>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: service.coordinates.latitude,
                  longitude: service.coordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: service.coordinates.latitude,
                    longitude: service.coordinates.longitude,
                  }}
                  title={service.title}
                  description={service.location}
                />
              </MapView>
              <TouchableOpacity 
                style={styles.getDirectionsButton}
                onPress={openMap}
              >
                <Icon name="map-o" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.getDirectionsText}>Get Directions</Text>
              </TouchableOpacity>
            </>
          )}
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Service Provider</Text>
          {provider ? (
            <View style={styles.providerContainer}>
              <Image
                source={{ uri: provider.profileImage || 'https://via.placeholder.com/100' }}
                style={styles.providerImage}
                PlaceholderContent={<ActivityIndicator />}
              />
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerSubtitle}>Service Provider</Text>
                <View style={styles.providerButtons}>
                  <TouchableOpacity 
                    style={styles.providerButton}
                    onPress={handleContactProvider}
                  >
                    <Icon name="comment" size={16} color="#fff" />
                    <Text style={styles.providerButtonText}>Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.providerButton}
                    onPress={handleCallProvider}
                  >
                    <Icon name="phone" size={16} color="#fff" />
                    <Text style={styles.providerButtonText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.noProviderText}>Provider information not available</Text>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <Text style={styles.reviewsCount}>{reviews.length} reviews</Text>
          </View>
          
          {reviews.length > 0 ? (
            <View style={styles.reviewsContainer}>
              {reviews.slice(0, 3).map((review, index) => (
                <View key={index} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: review.userImage || 'https://via.placeholder.com/40' }}
                      style={styles.reviewerImage}
                      PlaceholderContent={<ActivityIndicator />}
                    />
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>{review.userName}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Rating
                      readonly
                      startingValue={review.rating}
                      imageSize={14}
                      style={styles.reviewRating}
                    />
                  </View>
                  <Text style={styles.reviewText}>{review.comment}</Text>
                </View>
              ))}
              
              {reviews.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('Reviews', { serviceId })}
                >
                  <Text style={styles.viewAllText}>View All Reviews</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          )}
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {recentBookings.length > 0 ? (
            <View style={styles.bookingsContainer}>
              {recentBookings.map((booking, index) => (
                <View key={index} style={styles.bookingItem}>
                  <Icon name="calendar-check-o" size={24} color="#000" style={styles.bookingIcon} />
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingUserName}>{booking.userName}</Text>
                    <Text style={styles.bookingDate}>
                      {new Date(booking.date).toLocaleDateString()} at {booking.time}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noBookingsText}>No recent bookings</Text>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>${service.price}</Text>
        </View>
        <Button
          title="Book Now"
          onPress={handleBookNow}
          buttonStyle={styles.bookButton}
          titleStyle={styles.bookButtonText}
          containerStyle={styles.bookButtonContainer}
        />
      </View>
    </SafeAreaView>
  );
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#000',
    paddingHorizontal: 30,
  },
  scrollContainer: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  imageCarousel: {
    width: width,
    height: 300,
  },
  serviceImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  serviceDetailsContainer: {
    padding: 20,
  },
  serviceTypeContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  serviceType: {
    fontSize: 12,
    color: '#666',
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  serviceMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginRight: 5,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  divider: {
    marginVertical: 20,
    backgroundColor: '#f0f0f0',
    height: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
  },
  availabilityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayContainer: {
    width: '30%',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  map: {
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  getDirectionsButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getDirectionsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 15,
  },
  providerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  providerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  providerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  providerButtons: {
    flexDirection: 'row',
  },
  providerButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginRight: 10,
  },
  providerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  noProviderText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reviewsCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewsContainer: {
    marginBottom: 10,
  },
  reviewItem: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewDate: {
    fontSize: 12,
    color: '#888',
  },
  reviewRating: {
    marginLeft: 'auto',
  },
  reviewText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  bookingsContainer: {
    marginBottom: 10,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  bookingIcon: {
    marginRight: 15,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bookingDate: {
    fontSize: 12,
    color: '#666',
  },
  noBookingsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceContainer: {
    justifyContent: 'center',
    marginRight: 15,
  },
  priceLabel: {
    fontSize: 12,
    color: '#888',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookButtonContainer: {
    flex: 1,
  },
  bookButton: {
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 12,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ServiceDetailScreen;
