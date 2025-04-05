import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Share
} from 'react-native';
import { Text, Button, Divider, Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/config';
import moment from 'moment';

const BookingConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId, serviceTitle, providerName, date, time, totalPrice } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [service, setService] = useState(null);
  const [provider, setProvider] = useState(null);
  
  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else if (serviceTitle && providerName && date && time) {
      // If we navigated from booking creation with params
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [bookingId]);
  
  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch booking data
      const bookingDoc = await getDoc(doc(firestore, 'bookings', bookingId));
      
      if (!bookingDoc.exists()) {
        Alert.alert('Error', 'Booking not found');
        navigation.goBack();
        return;
      }
      
      const bookingData = bookingDoc.data();
      setBooking(bookingData);
      
      // Fetch service data
      if (bookingData.serviceId) {
        const serviceDoc = await getDoc(doc(firestore, 'services', bookingData.serviceId));
        if (serviceDoc.exists()) {
          setService(serviceDoc.data());
        }
      }
      
      // Fetch provider data
      if (bookingData.providerId) {
        const providerDoc = await getDoc(doc(firestore, 'users', bookingData.providerId));
        if (providerDoc.exists()) {
          setProvider(providerDoc.data());
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load booking details');
    }
  };
  
  const formatDate = (dateString) => {
    return moment(dateString).format('dddd, MMMM D, YYYY');
  };
  
  const handleShare = async () => {
    try {
      const title = booking ? booking.service?.title : serviceTitle;
      const shareMessage = `I've booked ${title} on ${formatDate(booking ? booking.date : date)} at ${booking ? booking.time : time}. Can't wait!`;
      
      await Share.share({
        message: shareMessage,
        title: 'My Booking'
      });
    } catch (error) {
      console.error('Error sharing booking:', error);
    }
  };
  
  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'TabNavigator' }],
    });
  };
  
  const handleViewBooking = () => {
    if (bookingId) {
      // If viewing existing booking details, just go back
      navigation.goBack();
    } else {
      // If coming from booking creation, go to booking history
      navigation.navigate('Bookings');
    }
  };
  
  // Use route params if booking not loaded yet
  const displayServiceTitle = booking?.service?.title || service?.title || serviceTitle || 'Service';
  const displayProviderName = booking?.provider?.name || provider?.name || providerName || 'Service Provider';
  const displayDate = booking?.date ? formatDate(booking.date) : date ? formatDate(date) : 'Date not specified';
  const displayTime = booking?.time || time || 'Time not specified';
  const displayTotal = booking?.totalPrice || totalPrice || 0;
  const displayStatus = booking?.status || 'confirmed';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" type="font-awesome" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Confirmation</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Icon name="share" type="font-awesome" size={20} color="#000" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.confirmationHeader}>
            <Icon
              name="check-circle"
              type="font-awesome"
              size={60}
              color="#4CD964"
              containerStyle={styles.successIcon}
            />
            <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
            <Text style={styles.confirmationSubtitle}>
              Your booking has been successfully placed
            </Text>
          </View>
          
          <View style={styles.bookingDetailCard}>
            <Text style={styles.cardTitle}>Booking Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking ID:</Text>
              <Text style={styles.detailValue}>
                {bookingId ? `#${bookingId.substring(0, 8)}` : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service:</Text>
              <Text style={styles.detailValue}>{displayServiceTitle}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provider:</Text>
              <Text style={styles.detailValue}>{displayProviderName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{displayDate}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>{displayTime}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[
                styles.statusBadge,
                displayStatus === 'confirmed' && styles.confirmedBadge,
                displayStatus === 'completed' && styles.completedBadge,
                displayStatus === 'cancelled' && styles.cancelledBadge
              ]}>
                <Text style={styles.statusText}>
                  {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                </Text>
              </View>
            </View>
            
            {booking?.address && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{booking.address}</Text>
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentTitle}>Payment Details</Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Price:</Text>
                <Text style={styles.priceValue}>
                  ${booking?.basePrice?.toFixed(2) || (displayTotal).toFixed(2)}
                </Text>
              </View>
              
              {booking?.discount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Discount:</Text>
                  <Text style={styles.discountValue}>
                    -${((booking.basePrice * booking.discount) / 100).toFixed(2)}
                  </Text>
                </View>
              )}
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${displayTotal.toFixed(2)}</Text>
              </View>
              
              {booking?.paymentMethod && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Payment Method:</Text>
                  <Text style={styles.priceValue}>
                    {booking.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.notesContainer}>
            <Icon
              name="info-circle"
              type="font-awesome"
              size={20}
              color="#666"
              containerStyle={styles.notesIcon}
            />
            <Text style={styles.notesText}>
              You'll receive a notification before your appointment. You can also view or manage this booking in your bookings tab.
            </Text>
          </View>
          
          <View style={styles.buttonsContainer}>
            <Button
              title="View My Bookings"
              onPress={handleViewBooking}
              buttonStyle={styles.viewBookingsButton}
              titleStyle={styles.viewBookingsButtonText}
              containerStyle={styles.buttonContainer}
            />
            
            <Button
              title="Continue"
              onPress={handleContinue}
              buttonStyle={styles.continueButton}
              titleStyle={styles.continueButtonText}
              containerStyle={styles.buttonContainer}
            />
          </View>
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIcon: {
    marginBottom: 15,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bookingDetailCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
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
  divider: {
    marginVertical: 15,
    backgroundColor: '#e0e0e0',
  },
  paymentDetails: {
    marginTop: 5,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
  },
  discountValue: {
    fontSize: 16,
    color: '#4cd964',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notesContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
  },
  notesIcon: {
    marginRight: 10,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonsContainer: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 15,
  },
  viewBookingsButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 10,
  },
  viewBookingsButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookingConfirmationScreen;
