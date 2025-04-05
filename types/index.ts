// User types
export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: any; // Firebase Timestamp
  lastLogin: any; // Firebase Timestamp
  userType: 'customer' | 'vendor' | 'admin';
  photoURL?: string;
}

// Authentication types
export interface AuthContextType {
  currentUser: any;
  userProfile: UserProfile | null;
  initializing: boolean;
  signUp: (email: string, password: string, displayName: string, phone: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Chat types
export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: any; // Firebase Timestamp
  imageUrl?: string;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any; // Firebase Timestamp
  unreadCount: number;
}

// Service types
export interface Service {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  category: string;
  images: string[];
  rating: number;
  availability: {
    [date: string]: string[]; // Date -> Available time slots
  };
}

// Booking types
export interface Booking {
  id: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  dateTime: any; // Firebase Timestamp
  price: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: string;
  notes?: string;
  promoCode?: string;
  discount?: number;
}

// Call types
export interface Call {
  id: string;
  callerId: string;
  recipientId: string;
  status: 'ringing' | 'ongoing' | 'ended' | 'missed' | 'rejected';
  startTime: any; // Firebase Timestamp
  endTime?: any; // Firebase Timestamp
  duration?: number;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'chat' | 'booking' | 'payment' | 'call' | 'system';
  data: any;
  read: boolean;
  timestamp: any; // Firebase Timestamp
}

// Navigation types
export type RootStackParamList = {
  index: undefined;
  'auth/login': undefined;
  'auth/register': undefined;
  'main/home': undefined;
  'main/chat': undefined;
  'chat/[id]': { id: string };
  'profile/index': undefined;
  'booking/index': undefined;
  'booking/history': undefined;
  'booking/confirmation': { bookingId: string };
  'service/list': undefined;
  'service/[id]': { id: string };
  'call/index': undefined;
  'call/incoming': { callId: string };
  'call/outgoing': { recipientId: string };
  'support/index': undefined;
  'privacy/index': undefined;
  'notification/index': undefined;
};