const admin = require('firebase-admin');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

class PushNotificationService {
  constructor() {
    this.db = admin.firestore();
  }

  // Send push notification to a specific user
  async sendNotificationToUser(userId, title, body, data = {}) {
    try {
      // Get user's push token from Firestore
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log('User not found:', userId);
        return false;
      }

      const userData = userDoc.data();
      const expoPushToken = userData.expoPushToken;

      if (!expoPushToken) {
        console.log('No push token found for user:', userId);
        return false;
      }

      // Log the token being used
      console.log('Using Expo push token:', expoPushToken);

      // Send notification via Expo's push service
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      // Log the full Expo response
      console.log('Expo push response:', result);
      
      if (result.data && result.data.status === 'ok') {
        console.log('Push notification sent successfully to user:', userId);
        return true;
      } else {
        console.error('Failed to send push notification:', result);
        return false;
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Send notification to multiple users
  async sendNotificationToUsers(userIds, title, body, data = {}) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendNotificationToUser(userId, title, body, data))
    );
    
    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    console.log(`Sent notifications to ${successful}/${userIds.length} users`);
    
    return results;
  }

  // Send notification when order status changes
  async sendOrderStatusNotification(userId, orderId, status) {
    const title = 'Order Status Updated';
    const body = `Your order status has been updated to "${status}"`;
    const data = {
      type: 'order_update',
      orderId: orderId,
      status: status,
    };

    return await this.sendNotificationToUser(userId, title, body, data);
  }

  // Send notification for new order
  async sendNewOrderNotification(userId, orderId) {
    const title = 'Order Confirmed';
    const body = 'Your order has been successfully placed and is being processed.';
    const data = {
      type: 'new_order',
      orderId: orderId,
    };

    return await this.sendNotificationToUser(userId, title, body, data);
  }

  // Send notification for payment confirmation
  async sendPaymentNotification(userId, amount, method) {
    const title = 'Payment Successful';
    const body = `Your payment of ₦${amount} via ${method} has been confirmed.`;
    const data = {
      type: 'payment_success',
      amount: amount,
      method: method,
    };

    return await this.sendNotificationToUser(userId, title, body, data);
  }
}

module.exports = new PushNotificationService(); 