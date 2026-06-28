import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useAppStore } from '../store';

// Your web app's Firebase configuration
// In a real application, you would replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let messaging: ReturnType<typeof getMessaging> | null = null;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.error("Firebase Messaging could not be initialized:", error);
}

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      if (messaging) {
        try {
          const currentToken = await getToken(messaging, { 
            // In a real app, replace with your VAPID key
            vapidKey: 'YOUR_VAPID_KEY_HERE' 
          });
          
          if (currentToken) {
            console.log('FCM Token received:', currentToken);
            // In a real app, you would send this token to your server
            return currentToken;
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } catch (err) {
          console.error('An error occurred while retrieving token. ', err);
        }
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
        
        // Handle incoming messages while app is in foreground
        if (payload.notification) {
          const { title, body } = payload.notification;
          
          // Use browser notification if possible
          if (Notification.permission === 'granted') {
            new Notification(title || 'Notification', {
              body: body || '',
              icon: '/icon.png' // assuming you have an icon
            });
          }
          
          // Add to store notifications
          useAppStore.getState().addNotification({
            id: Math.random().toString(36).substring(7),
            title: title || 'New Update',
            description: body || '',
            createdAt: new Date().toISOString(),
            isRead: false,
            type: payload.data?.type === 'APPROVAL' ? 'SUCCESS' : 'INFO'
          });
        }
      });
    }
  });

// Simulated function to trigger local push notifications for testing
export const simulatePushNotification = (title: string, body: string, type: 'SUCCESS' | 'INFO') => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
  
  useAppStore.getState().addNotification({
    id: Math.random().toString(36).substring(7),
    title,
    description: body,
    createdAt: new Date().toISOString(),
    isRead: false,
    type
  });
};
