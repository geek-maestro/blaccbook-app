import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Divider, Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const PrivacyScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" type="font-awesome" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.lastUpdated}>Last Updated: May 1, 2023</Text>
        
        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to BlaccBook ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
          This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our mobile 
          application ("App") and related services.
        </Text>
        <Text style={styles.paragraph}>
          By using our App, you agree to the collection and use of information in accordance with this policy.
        </Text>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.subSectionTitle}>Personal Data</Text>
        <Text style={styles.paragraph}>
          We may collect personally identifiable information, such as:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Name</Text>
          <Text style={styles.bulletItem}>• Email address</Text>
          <Text style={styles.bulletItem}>• Phone number</Text>
          <Text style={styles.bulletItem}>• Address</Text>
          <Text style={styles.bulletItem}>• Payment information</Text>
          <Text style={styles.bulletItem}>• Profile pictures</Text>
        </View>
        
        <Text style={styles.subSectionTitle}>Usage Data</Text>
        <Text style={styles.paragraph}>
          We may also collect information about how you use our App, including:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Device information (device type, operating system)</Text>
          <Text style={styles.bulletItem}>• App usage statistics</Text>
          <Text style={styles.bulletItem}>• IP address</Text>
          <Text style={styles.bulletItem}>• Booking history</Text>
          <Text style={styles.bulletItem}>• Chat communications</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Provide and maintain our services</Text>
          <Text style={styles.bulletItem}>• Process and manage your bookings</Text>
          <Text style={styles.bulletItem}>• Facilitate payments and transactions</Text>
          <Text style={styles.bulletItem}>• Enable communication between users and service providers</Text>
          <Text style={styles.bulletItem}>• Send notifications related to your account or bookings</Text>
          <Text style={styles.bulletItem}>• Improve our services and develop new features</Text>
          <Text style={styles.bulletItem}>• Respond to your requests and provide customer support</Text>
          <Text style={styles.bulletItem}>• Detect and prevent fraudulent activities</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Information Sharing and Disclosure</Text>
        <Text style={styles.paragraph}>
          We may share your information with:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Service providers: We share information with service providers you book through our platform to facilitate your booking.</Text>
          <Text style={styles.bulletItem}>• Payment processors: To process your payments.</Text>
          <Text style={styles.bulletItem}>• Service providers & partners: Third parties who assist us in operating our App and conducting our business.</Text>
          <Text style={styles.bulletItem}>• Legal requirements: If required by law or to protect our rights.</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational measures to protect the security of your personal data. 
          However, please note that no method of transmission over the Internet or electronic storage is 100% secure.
        </Text>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Your Data Rights</Text>
        <Text style={styles.paragraph}>
          Depending on your location, you may have certain rights regarding your personal data, including:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Access to your personal data</Text>
          <Text style={styles.bulletItem}>• Correction of inaccurate data</Text>
          <Text style={styles.bulletItem}>• Deletion of your data</Text>
          <Text style={styles.bulletItem}>• Restriction of processing</Text>
          <Text style={styles.bulletItem}>• Data portability</Text>
        </View>
        <Text style={styles.paragraph}>
          To exercise any of these rights, please contact us using the information provided below.
        </Text>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our services are not intended for use by children under the age of 13. We do not knowingly collect personally 
          identifiable information from children under 13.
        </Text>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
          on this page and updating the "Last Updated" date.
        </Text>
        <Text style={styles.paragraph}>
          You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective 
          when they are posted on this page.
        </Text>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us:
        </Text>
        <View style={styles.contactInfo}>
          <Text style={styles.contactItem}>Email: privacy@blaccbook.com</Text>
          <Text style={styles.contactItem}>Phone: +1 (123) 456-7890</Text>
          <Text style={styles.contactItem}>Address: 123 Main Street, City, State, ZIP</Text>
        </View>
      </ScrollView>
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 5,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 15,
  },
  bulletList: {
    marginLeft: 10,
    marginBottom: 15,
  },
  bulletItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 5,
  },
  divider: {
    marginVertical: 20,
    backgroundColor: '#f0f0f0',
    height: 1,
  },
  contactInfo: {
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
  },
  contactItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
  },
});

export default PrivacyScreen;
