import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { Text, Card, Button, Rating, Divider, Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from '../../firebase/config';
import moment from 'moment';

const BookingHistoryScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'canceled'
  
  // Rating modal state
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  
  // Cancel booking modal state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellingBooking, setCancellingBooking] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      fetchBookings();
    }
  }, [currentUser, activeTab]);
  
  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      let bookingsQuery;
      
      if (activeTab === 'upcoming') {
        bookingsQuery = query(
          collection(firestore, 'bookings'),
          where('userId', '==', currentUser.uid),
          where('status', 'in', ['pending', 'confirmed']),
          orderBy('date', 'asc')
        );
      } else if (activeTab === 'completed') {
        bookingsQuery = query(
          collection(firestore, 'bookings'),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'completed'),
          orderBy('date', 'desc')
        );
      } else {
        bookingsQuery = query(
          collection(firestore, 'bookings'),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'cancelled'),
          orderBy('date', 'desc')
        );
      }
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      const bookingsData = [];
      
      for (const bookingDoc of bookingsSnapshot.docs) {
        const bookingData = bookingDoc.data();
        
        // Get service details
        const serviceDoc = await getDoc(doc(firestore, 'services', bookingData.serviceId));
        
        // Get provider details
        const providerDoc = await getDoc(doc(firestore, 'users', bookingData.providerId));
        
        bookingsData.push({
          id: bookingDoc.id,
          ...bookingData,
          service: serviceDoc.exists() ? {
            id: serviceDoc.id,
            ...serviceDoc.data()
          } : null,
          provider: providerDoc.exists() ? {
            id: providerDoc.id,
            ...providerDoc.data()
          } : null
        });
      }
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };
  
  const handleViewBooking = (booking) => {
    navigation.navigate('BookingDetail', { bookingId: booking.id });
  };
  
  const handleCancelBooking = (booking) => {
    setSelectedBooking(booking);
    setCancellationReason('');
    setCancelModalVisible(true);
  };
  
  const confirmCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }
    
    try {
      setCancellingBooking(true);
      
      await updateDoc(doc(firestore, 'bookings', selectedBooking.id), {
        status: 'cancelled',
        cancellationReason,
        cancelledAt: serverTimestamp(),
        cancelledBy: 'user'
      });
      
      // Create notification for provider
      await addDoc(collection(firestore, 'notifications'), {
        userId: selectedBooking.providerId,
        title: 'Booking Cancelled',
        message: `A booking for ${selectedBooking.service.title} on ${selectedBooking.date} at ${selectedBooking.time} has been cancelled by the customer.`,
        type: 'booking_cancelled',
        bookingId: selectedBooking.id,
        read: false,
        createdAt: serverTimestamp()
      });
      
      setCancelModalVisible(false);
      setCancellingBooking(false);
      
      // Refresh bookings
      fetchBookings();
      
      Alert.alert('Success', 'Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'Failed to cancel booking');
      setCancellingBooking(false);
    }
  };
  
  const handleRateService = (booking) => {
    setSelectedBooking(booking);
    setRating(0);
    setReview('');
    setRatingModalVisible(true);
  };
  
  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    
    try {
      setSubmittingRating(true);
      
      // Add review to Firestore
      await addDoc(collection(firestore, 'reviews'), {
        userId: currentUser.uid,
        serviceId: selectedBooking.serviceId,
        bookingId: selectedBooking.id,
        rating,
        comment: review.trim() || 'Great service!',
        userName: currentUser.displayName || 'Customer',
        userImage: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        approved: true // Auto-approve for simplicity
      });
      
      // Update booking with review status
      await updateDoc(doc(firestore, 'bookings', selectedBooking.id), {
        isRated: true
      });
      
      // Update service rating (in a real app, this would be done with a Cloud Function)
      const serviceRef = doc(firestore, 'services', selectedBooking.serviceId);
      const serviceDoc = await getDoc(serviceRef);
      
      if (serviceDoc.exists()) {
        const serviceData = serviceDoc.data();
        const currentRating = serviceData.rating || 0;
        const reviewCount = serviceData.reviewCount || 0;
        
        // Calculate new average rating
        const newRating = (currentRating * reviewCount + rating) / (reviewCount + 1);
        
        await updateDoc(serviceRef, {
          rating: newRating,
          reviewCount: reviewCount + 1
        });
      }
      
      setRatingModalVisible(false);
      setSubmittingRating(false);
      
      // Refresh bookings
      fetchBookings();
      
      Alert.alert('Success', 'Thank you for your review!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
      setSubmittingRating(false);
    }
  };
  
  const isFutureBooking = (booking) => {
    const bookingDateTime = moment(`${booking.date} ${booking.time}`, 'YYYY-MM-DD h:mm A');
    return bookingDateTime.isAfter(moment());
  };
  
  const renderBookingItem = ({ item }) => {
    const bookingDate = moment(item.date).format('ddd, MMM D, YYYY');
    const isPastBooking = !isFutureBooking(item);
    const canCancel = !isPastBooking && item.status !== 'cancelled';
    const canRate = item.status === 'completed' && !item.isRated;
    
    return (
      <Card containerStyle={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View>
            <Text style={styles.bookingDate}>
              {bookingDate} at {item.time}
            </Text>
            <Text style={styles.bookingId}>Booking ID: #{item.id.substring(0, 8)}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            item.status === 'confirmed' && styles.confirmedBadge,
            item.status === 'completed' && styles.completedBadge,
            item.status === 'cancelled' && styles.cancelledBadge
          ]}>
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <Divider style={styles.cardDivider} />
        
        <View style={styles.serviceDetails}>
          <Text style={styles.serviceTitle}>{item.service?.title || 'Service'}</Text>
          <Text style={styles.providerName}>
            by {item.provider?.name || 'Service Provider'}
          </Text>
        </View>
        
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>{item.address}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>${item.totalPrice.toFixed(2)}</Text>
          </View>
          
          {item.status === 'cancelled' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reason:</Text>
              <Text style={styles.detailValue}>{item.cancellationReason}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.bookingActions}>
          <Button
            title="View Details"
            onPress={() => handleViewBooking(item)}
            buttonStyle={styles.viewButton}
            titleStyle={styles.viewButtonText}
          />
          
          {canCancel && (
            <Button
              title="Cancel"
              onPress={() => handleCancelBooking(item)}
              buttonStyle={styles.cancelButton}
              titleStyle={styles.cancelButtonText}
            />
          )}
          
          {canRate && (
            <Button
              title="Rate"
              onPress={() => handleRateService(item)}
              buttonStyle={styles.rateButton}
              titleStyle={styles.rateButtonText}
              icon={
                <Icon
                  name="star"
                  type="font-awesome"
                  size={15}
                  color="#FFF"
                  style={{ marginRight: 5 }}
                />
              }
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text h4 style={styles.title}>My Bookings</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'upcoming' && styles.activeTab
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'upcoming' && styles.activeTabText
          ]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'completed' && styles.activeTab
          ]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'completed' && styles.activeTabText
          ]}>
            Completed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'canceled' && styles.activeTab
          ]}
          onPress={() => setActiveTab('canceled')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'canceled' && styles.activeTabText
          ]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            name="calendar-times-o"
            type="font-awesome"
            size={60}
            color="#ccc"
          />
          <Text style={styles.emptyText}>No {activeTab} bookings found</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.bookingsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModal}>
            <Text style={styles.ratingTitle}>Rate Your Experience</Text>
            <Text style={styles.ratingServiceTitle}>
              {selectedBooking?.service?.title || 'Service'}
            </Text>
            
            <Rating
              showRating
              startingValue={rating}
              onFinishRating={setRating}
              style={styles.ratingStars}
            />
            
            <TextInput
              style={styles.reviewInput}
              placeholder="Write a review (optional)"
              value={review}
              onChangeText={setReview}
              multiline
              maxLength={500}
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setRatingModalVisible(false)}
                buttonStyle={styles.cancelRatingButton}
                titleStyle={styles.cancelRatingButtonText}
                containerStyle={styles.modalButton}
                disabled={submittingRating}
              />
              
              <Button
                title="Submit"
                onPress={submitRating}
                buttonStyle={styles.submitRatingButton}
                titleStyle={styles.submitRatingButtonText}
                containerStyle={styles.modalButton}
                loading={submittingRating}
                disabled={rating === 0 || submittingRating}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Cancel Booking Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModal}>
            <Text style={styles.cancelTitle}>Cancel Booking</Text>
            <Text style={styles.cancelSubtitle}>
              Please provide a reason for cancellation:
            </Text>
            
            <TextInput
              style={styles.cancelReasonInput}
              placeholder="Reason for cancellation"
              value={cancellationReason}
              onChangeText={setCancellationReason}
              multiline
              maxLength={500}
            />
            
            <Text style={styles.cancelNote}>
              Note: Cancellations may be subject to fees depending on the service provider's policy.
            </Text>
            
            <View style={styles.modalButtons}>
              <Button
                title="Go Back"
                onPress={() => setCancelModalVisible(false)}
                buttonStyle={styles.backButton}
                titleStyle={styles.backButtonText}
                containerStyle={styles.modalButton}
                disabled={cancellingBooking}
              />
              
              <Button
                title="Confirm Cancel"
                onPress={confirmCancelBooking}
                buttonStyle={styles.confirmCancelButton}
                titleStyle={styles.confirmCancelButtonText}
                containerStyle={styles.modalButton}
                loading={cancellingBooking}
                disabled={!cancellationReason.trim() || cancellingBooking}
              />
            </View>
          </View>
        </View>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingsList: {
    padding: 10,
  },
  bookingCard: {
    borderRadius: 10,
    marginBottom: a5,
    padding: a5,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bookingId: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  confirmedBadge: {
    backgroundColor: '#4cd964',
  },
  completedBadge: {
    backgroundColor: '#007aff',
  },
  cancelledBadge: {
    backgroundColor: '#ff3b30',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardDivider: {
    marginVertical: 15,
  },
  serviceDetails: {
    marginBottom: 15,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  providerName: {
    fontSize: 14,
    color: '#666',
  },
  bookingDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    backgroundColor: '#000',
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
  },
  rateButton: {
    backgroundColor: '#ffcc00',
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  rateButtonText: {
    fontSize: 14,
    color: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  ratingServiceTitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingStars: {
    marginVertical: 20,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelRatingButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelRatingButtonText: {
    color: '#000',
  },
  submitRatingButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitRatingButtonText: {
    color: '#fff',
  },
  cancelModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  cancelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  cancelSubtitle: {
    fontSize: 16,
    marginBottom: 15,
  },
  cancelReasonInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  cancelNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#000',
  },
  confirmCancelButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmCancelButtonText: {
    color: '#fff',
  },
});

export default BookingHistoryScreen;
