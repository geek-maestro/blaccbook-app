import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Text, Button, Divider, Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/config';

const SupportScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  
  const [supportType, setSupportType] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [requestCallback, setRequestCallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);
  const [showBookings, setShowBookings] = useState(false);
  
  // Support types
  const supportTypes = [
    { id: 'general', label: 'General Inquiry' },
    { id: 'booking', label: 'Booking Issue' },
    { id: 'payment', label: 'Payment Problem' },
    { id: 'app', label: 'App Technical Issue' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'other', label: 'Other' }
  ];
  
  // Fetch recent bookings when booking support type is selected
  React.useEffect(() => {
    if (supportType === 'booking' && currentUser) {
      fetchRecentBookings();
    }
  }, [supportType, currentUser]);
  
  // Fetch recent bookings for selection
  const fetchRecentBookings = async () => {
    try {
      setLoading(true);
      
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('userId', '==', currentUser.uid),
        where('status', 'in', ['pending', 'confirmed', 'completed'])
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      const bookingsData = [];
      for (const doc of bookingsSnapshot.docs) {
        bookingsData.push({
          id: doc.id,
          ...doc.data()
        });
      }
      
      setRecentBookings(bookingsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };
  
  // Submit support request
  const submitSupportRequest = async () => {
    // Validate form fields
    if (!supportType) {
      Alert.alert('Error', 'Please select a support type');
      return;
    }
    
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    
    if (requestCallback && !phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number for callback');
      return;
    }
    
    if (supportType === 'booking' && !bookingId) {
      Alert.alert('Error', 'Please select a booking');
      return;
    }
    
    try {
      setLoading(true);
      
      // Add support request to Firestore
      await addDoc(collection(firestore, 'supportRequests'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        supportType,
        subject: subject.trim(),
        message: message.trim(),
        bookingId: supportType === 'booking' ? bookingId : null,
        requestCallback,
        phoneNumber: requestCallback ? phoneNumber.trim() : null,
        status: 'open',
        createdAt: serverTimestamp()
      });
      
      // Reset form
      setSupportType('');
      setSubject('');
      setMessage('');
      setBookingId('');
      setPhoneNumber('');
      setRequestCallback(false);
      
      setLoading(false);
      
      // Show success message
      Alert.alert(
        'Support Request Submitted',
        'Your support request has been submitted successfully. Our team will respond to you shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting support request:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to submit support request. Please try again later.');
    }
  };
  
  const toggleBookingsList = () => {
    setShowBookings(!showBookings);
  };
  
  const selectBooking = (booking) => {
    setBookingId(booking.id);
    setShowBookings(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" type="font-awesome" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.sectionTitle}>How can we help you?</Text>
          <Text style={styles.sectionSubtitle}>
            Fill out the form below to get assistance from our support team.
          </Text>
          
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Support Type</Text>
            <View style={styles.supportTypesContainer}>
              {supportTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.supportTypeButton,
                    supportType === type.id && styles.selectedSupportType
                  ]}
                  onPress={() => setSupportType(type.id)}
                >
                  <Text style={[
                    styles.supportTypeText,
                    supportType === type.id && styles.selectedSupportTypeText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {supportType === 'booking' && (
              <View style={styles.bookingContainer}>
                <Text style={styles.inputLabel}>Select Booking</Text>
                <TouchableOpacity 
                  style={styles.bookingSelector}
                  onPress={toggleBookingsList}
                >
                  <Text style={styles.bookingSelectorText}>
                    {bookingId 
                      ? `Booking #${bookingId.substring(0, 8)}`
                      : 'Select a booking'
                    }
                  </Text>
                  <Icon name="chevron-down" type="font-awesome" size={12} color="#666" />
                </TouchableOpacity>
                
                {showBookings && (
                  <View style={styles.bookingsDropdown}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#000" style={styles.loadingIndicator} />
                    ) : recentBookings.length === 0 ? (
                      <Text style={styles.noBookingsText}>No recent bookings found</Text>
                    ) : (
                      recentBookings.map((booking) => (
                        <TouchableOpacity
                          key={booking.id}
                          style={styles.bookingItem}
                          onPress={() => selectBooking(booking)}
                        >
                          <Text style={styles.bookingId}>
                            Booking #{booking.id.substring(0, 8)}
                          </Text>
                          <Text style={styles.bookingDate}>
                            {booking.date} - {booking.status}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            )}
            
            <Text style={styles.inputLabel}>Subject</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter subject"
              value={subject}
              onChangeText={setSubject}
            />
            
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              placeholder="Describe your issue or question"
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
            />
            
            <View style={styles.callbackContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setRequestCallback(!requestCallback)}
              >
                <View style={[
                  styles.checkbox,
                  requestCallback && styles.checkboxChecked
                ]}>
                  {requestCallback && (
                    <Icon name="check" type="font-awesome" size={12} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Request a callback</Text>
              </TouchableOpacity>
              
              {requestCallback && (
                <TextInput
                  style={[styles.textInput, styles.phoneInput]}
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              )}
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Button
            title="Submit Request"
            onPress={submitSupportRequest}
            buttonStyle={styles.submitButton}
            titleStyle={styles.submitButtonText}
            loading={loading}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  supportTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    marginHorizontal: -5,
  },
  supportTypeButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
  },
  selectedSupportType: {
    backgroundColor: '#000',
  },
  supportTypeText: {
    fontSize: 14,
    color: '#666',
  },
  selectedSupportTypeText: {
    color: '#fff',
  },
  bookingContainer: {
    marginBottom: 20,
  },
  bookingSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  bookingSelectorText: {
    fontSize: 16,
  },
  bookingsDropdown: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    maxHeight: 200,
  },
  loadingIndicator: {
    padding: 20,
  },
  noBookingsText: {
    padding: 20,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  bookingItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookingId: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bookingDate: {
    fontSize: 12,
    color: '#666',
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
  messageInput: {
    minHeight: 120,
    paddingTop: 15,
  },
  callbackContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#000',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  phoneInput: {
    marginBottom: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SupportScreen;
