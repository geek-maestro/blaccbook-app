import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Platform
} from 'react-native';
import { Text, Button, Divider, CheckBox } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { firestore } from '../../firebase/config';
import moment from 'moment';

const BookingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { serviceId, serviceTitle, providerName, price } = route.params || {};
  const { currentUser } = useAuth();
  
  // Service data
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);
  
  // Booking states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  
  // UI states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  
  // Calculate prices
  const basePrice = service?.price || price || 0;
  const discountAmount = (basePrice * discount) / 100;
  const total = basePrice - discountAmount;
  
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        if (!serviceId) {
          setLoading(false);
          return;
        }
        
        // Fetch service details
        const serviceDoc = await getDoc(doc(firestore, 'services', serviceId));
        
        if (!serviceDoc.exists()) {
          Alert.alert('Error', 'Service not found');
          navigation.goBack();
          return;
        }
        
        const serviceData = serviceDoc.data();
        setService(serviceData);
        
        // Get today's day of week
        const today = moment().format('ddd').toLowerCase();
        
        // If service has availability, check if today is available
        if (serviceData.availability && serviceData.availability[today]) {
          // Generate time slots based on availability
          generateTimeSlots(serviceData.availability[today]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching service details:', error);
        Alert.alert('Error', 'Failed to load service details');
        setLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [serviceId]);
  
  // Generate time slots based on availability string (e.g., "9:00 AM - 5:00 PM")
  const generateTimeSlots = (availabilityString) => {
    try {
      const [startTime, endTime] = availabilityString.split(' - ');
      
      const start = moment(startTime, 'h:mm A');
      const end = moment(endTime, 'h:mm A');
      
      const slots = [];
      let current = moment(start);
      
      // Generate 1-hour slots
      while (current.isBefore(end)) {
        slots.push(current.format('h:mm A'));
        current.add(1, 'hour');
      }
      
      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error('Error generating time slots:', error);
      setAvailableTimeSlots([]);
    }
  };
  
  // Check if selected date is today
  const isToday = moment(selectedDate).isSame(moment(), 'day');
  
  // Handle date change
  const onDateChange = (event, selected) => {
    setShowDatePicker(false);
    
    if (selected) {
      setSelectedDate(selected);
      setSelectedTime(''); // Reset selected time when date changes
      
      const dayOfWeek = moment(selected).format('ddd').toLowerCase();
      
      // Check if service has availability for the selected day
      if (service?.availability && service.availability[dayOfWeek]) {
        generateTimeSlots(service.availability[dayOfWeek]);
      } else {
        setAvailableTimeSlots([]);
      }
    }
  };
  
  // Apply promo code
  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }
    
    try {
      // Check if promo code exists and is valid
      const promoQuery = query(
        collection(firestore, 'promoCodes'),
        where('code', '==', promoCode.toUpperCase())
      );
      
      const promoSnapshot = await getDocs(promoQuery);
      
      if (promoSnapshot.empty) {
        Alert.alert('Invalid Code', 'The promo code you entered is invalid');
        return;
      }
      
      const promoData = promoSnapshot.docs[0].data();
      
      // Check if promo code is expired
      if (promoData.expiryDate && new Date(promoData.expiryDate.toDate()) < new Date()) {
        Alert.alert('Expired Code', 'This promo code has expired');
        return;
      }
      
      // Apply discount
      setDiscount(promoData.discountPercentage || 0);
      setPromoApplied(true);
      Alert.alert('Success', `Promo code applied! You got ${promoData.discountPercentage}% off`);
    } catch (error) {
      console.error('Error applying promo code:', error);
      Alert.alert('Error', 'Failed to apply promo code');
    }
  };
  
  // Create a booking
  const createBooking = async () => {
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }
    
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return;
    }
    
    try {
      setBookingInProgress(true);
      
      // Format date and time for booking
      const bookingDate = moment(selectedDate).format('YYYY-MM-DD');
      
      // Create a new booking
      const bookingData = {
        userId: currentUser.uid,
        serviceId,
        providerId: service.providerId,
        date: bookingDate,
        time: selectedTime,
        basePrice,
        discount,
        totalPrice: total,
        address,
        notes: additionalNotes,
        paymentMethod,
        promoCode: promoApplied ? promoCode : null,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      // Add to Firestore
      const bookingRef = await addDoc(collection(firestore, 'bookings'), bookingData);
      
      // Get user info for notification
      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Create notification for provider
      await addDoc(collection(firestore, 'notifications'), {
        userId: service.providerId,
        title: 'New Booking',
        message: `You have a new booking from ${userData.name || 'a customer'} for ${serviceTitle} on ${bookingDate} at ${selectedTime}`,
        type: 'booking',
        bookingId: bookingRef.id,
        read: false,
        createdAt: serverTimestamp()
      });
      
      setBookingInProgress(false);
      
      // Navigate to success screen
      navigation.navigate('BookingConfirmation', {
        bookingId: bookingRef.id,
        serviceTitle,
        providerName,
        date: bookingDate,
        time: selectedTime,
        totalPrice: total
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking');
      setBookingInProgress(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking</Text>
        <View style={styles.placeholder} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.serviceInfoContainer}>
            <Text style={styles.serviceTitle}>{serviceTitle || service?.title}</Text>
            <Text style={styles.providerName}>by {providerName || service?.providerName}</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Select Date & Time</Text>
            
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar" size={18} color="#000" style={styles.dateIcon} />
              <Text style={styles.dateText}>
                {moment(selectedDate).format('dddd, MMMM D, YYYY')}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            
            <Text style={styles.timeSlotLabel}>Available Time Slots:</Text>
            
            {availableTimeSlots.length > 0 ? (
              <View style={styles.timeSlotContainer}>
                {availableTimeSlots.map((time, index) => {
                  // If it's today, disable past time slots
                  const isPastTime = isToday && moment(time, 'h:mm A').isBefore(moment());
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.selectedTimeSlot,
                        isPastTime && styles.disabledTimeSlot
                      ]}
                      onPress={() => !isPastTime && setSelectedTime(time)}
                      disabled={isPastTime}
                    >
                      <Text 
                        style={[
                          styles.timeSlotText,
                          selectedTime === time && styles.selectedTimeSlotText,
                          isPastTime && styles.disabledTimeSlotText
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noTimeSlotsText}>
                No available time slots for the selected date
              </Text>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            
            <Text style={styles.inputLabel}>Your Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
              multiline
            />
            
            <Text style={styles.inputLabel}>Notes for Service Provider (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Add any specific instructions or notes"
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              multiline
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Promo Code</Text>
            
            <View style={styles.promoContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                value={promoCode}
                onChangeText={setPromoCode}
                editable={!promoApplied}
              />
              <Button
                title={promoApplied ? "Applied" : "Apply"}
                onPress={applyPromoCode}
                buttonStyle={[
                  styles.promoButton, 
                  promoApplied && styles.promoAppliedButton
                ]}
                titleStyle={styles.promoButtonText}
                disabled={promoApplied || !promoCode.trim()}
              />
            </View>
            
            {promoApplied && (
              <Text style={styles.promoAppliedText}>
                {discount}% discount applied!
              </Text>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <View style={styles.paymentMethodsContainer}>
              <CheckBox
                title="Credit Card"
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                checked={paymentMethod === 'credit_card'}
                onPress={() => setPaymentMethod('credit_card')}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
              />
              
              <CheckBox
                title="Debit Card"
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                checked={paymentMethod === 'debit_card'}
                onPress={() => setPaymentMethod('debit_card')}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
              />
              
              <CheckBox
                title="Digital Wallet"
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                checked={paymentMethod === 'digital_wallet'}
                onPress={() => setPaymentMethod('digital_wallet')}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
              />
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Price:</Text>
              <Text style={styles.summaryValue}>${basePrice.toFixed(2)}</Text>
            </View>
            
            {promoApplied && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount ({discount}%):</Text>
                <Text style={styles.discountValue}>-${discountAmount.toFixed(2)}</Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
          
          <Button
            title="Confirm Booking"
            onPress={createBooking}
            buttonStyle={styles.confirmButton}
            titleStyle={styles.confirmButtonText}
            containerStyle={styles.confirmButtonContainer}
            loading={bookingInProgress}
            disabled={!selectedTime || !address.trim() || bookingInProgress}
          />
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
  placeholder: {
    width: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  serviceInfoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  providerName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 20,
    backgroundColor: '#f0f0f0',
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 16,
  },
  timeSlotLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  timeSlot: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    margin: 5,
    minWidth: 90,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#000',
  },
  disabledTimeSlot: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  timeSlotText: {
    color: '#000',
    fontSize: 14,
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledTimeSlotText: {
    color: '#888',
  },
  noTimeSlotsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
  },
  promoButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  promoAppliedButton: {
    backgroundColor: '#4cd964',
  },
  promoButtonText: {
    fontSize: 14,
  },
  promoAppliedText: {
    color: '#4cd964',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paymentMethodsContainer: {
    marginTop: 10,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginLeft: 0,
    marginBottom: 15,
  },
  checkboxText: {
    fontWeight: 'normal',
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
  },
  discountValue: {
    fontSize: 16,
    color: '#4cd964',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: a8,
    fontWeight: 'bold',
  },
  confirmButtonContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  confirmButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookingScreen;
