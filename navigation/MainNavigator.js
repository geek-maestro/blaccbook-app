import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome';

// Home and Service Screens
import HomeScreen from '../components/Home/HomeScreen';
import ServiceListScreen from '../components/Service/ServiceListScreen';
import ServiceDetailScreen from '../components/Service/ServiceDetailScreen';

// Booking Screens
import BookingScreen from '../components/Booking/BookingScreen';
import BookingHistoryScreen from '../components/Booking/BookingHistoryScreen';
import BookingConfirmationScreen from '../components/Booking/BookingConfirmationScreen';

// Profile Screen
import ProfileScreen from '../components/Profile/ProfileScreen';

// Chat Screens
import ChatList from '../components/Chat/ChatList';
import ChatScreen from '../components/Chat/ChatScreen';

// Call Screen
import CallScreen from '../components/Call/CallScreen';

// Notification Screen
import NotificationScreen from '../components/Notification/NotificationScreen';

// Support & Privacy Screens
import SupportScreen from '../components/Support/SupportScreen';
import PrivacyScreen from '../components/Privacy/PrivacyScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Home tab
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="ServiceList" component={ServiceListScreen} />
    <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
    <Stack.Screen name="Booking" component={BookingScreen} />
    <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
    <Stack.Screen name="Notification" component={NotificationScreen} />
  </Stack.Navigator>
);

// Stack navigator for Bookings tab
const BookingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} />
    <Stack.Screen name="BookingDetail" component={BookingConfirmationScreen} />
    <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
  </Stack.Navigator>
);

// Stack navigator for Chat tab
const ChatsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="ChatList" component={ChatList} />
    <Stack.Screen name="Chat" component={ChatScreen} />
    <Stack.Screen name="Call" component={CallScreen} />
  </Stack.Navigator>
);

// Stack navigator for Profile tab
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="Support" component={SupportScreen} />
    <Stack.Screen name="Privacy" component={PrivacyScreen} />
    <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} />
    <Stack.Screen name="Notification" component={NotificationScreen} />
  </Stack.Navigator>
);

// Main tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 65,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Bookings') {
            iconName = 'calendar';
          } else if (route.name === 'Chats') {
            iconName = 'comments';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          // You can return any component here
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Bookings" component={BookingsStack} />
      <Tab.Screen name="Chats" component={ChatsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

// Root navigator that includes tab navigator and modal screens
const MainNavigator = () => {
  return (
    <Stack.Navigator
      mode="modal"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen 
        name="Call" 
        component={CallScreen}
        options={{
          cardStyle: { backgroundColor: 'transparent' },
          cardOverlayEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
