import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
  }

  // Request permissions and get push token
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      // Get the token that uniquely identifies this device
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'b677a2f8-4f24-456e-a920-5a3a6706cabd'
      })).data;
      
      console.log('Expo push token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Save push token to user's profile in Firestore
  async savePushToken(token) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user && token) {
        await setDoc(doc(db, 'users', user.uid), {
          expoPushToken: token,
          updatedAt: new Date(),
        }, { merge: true });
        
        console.log('Push token saved to user profile');
        this.expoPushToken = token;
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Get current push token
  async getCurrentPushToken() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          return userDoc.data().expoPushToken;
        }
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }
    return null;
  }

  // Send local notification (for testing)
  async sendLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Send immediately
    });
  }

  // Set up notification listeners
  setupNotificationListeners(navigation) {
    // Handle notification received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification response (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Extract orderId from notification data
      const orderId = response.notification.request.content.data.orderId;
      if (navigation && orderId) {
        navigation.navigate('OrderDetails', { orderId }); // Use your actual route name
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  // Initialize push notifications
  async initialize() {
    try {
      console.log('Initializing push notifications...');
      
      // Register for push notifications
      const token = await this.registerForPushNotifications();
      
      if (token) {
        // Save token to user profile
        await this.savePushToken(token);
        
        // Set up notification listeners
        this.setupNotificationListeners();
        
        console.log('Push notifications initialized successfully');
      } else {
        console.log('Failed to get push token');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }
}

export default new PushNotificationService(); 