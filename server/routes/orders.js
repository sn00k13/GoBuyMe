const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const pushNotificationService = require('../services/pushNotificationService');

// Get order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ id: orderDoc.id, ...orderDoc.data() });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    // Get the order first to get userId
    const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const orderData = orderDoc.data();
    const userId = orderData.userId;
    
    // Update the order status
    await admin.firestore().collection('orders').doc(orderId).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create a notification for the user
    await admin.firestore().collection('notifications').add({
      userId,
      orderId,
      title: 'Order Status Updated',
      body: `Your order status has been updated to "${status}"`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      type: 'order_update'
    });

    // Send push notification
    await pushNotificationService.sendOrderStatusNotification(userId, orderId, status);

    res.json({ message: 'Order status updated and notification sent' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Get user's orders
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const ordersSnapshot = await admin.firestore()
      .collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = [];
    ordersSnapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router; 