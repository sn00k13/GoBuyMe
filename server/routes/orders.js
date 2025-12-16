const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const pushNotificationService = require('../services/pushNotificationService');
const fetch = require('node-fetch');

const VPS_API_BASE_URL = 'https://kwuo.gobuyme.shop/api';

// Helper function to call VPS API
// Note: For server-side calls, you may want to use a service account token
// or API key for authentication instead of Firebase user token
const callVPSAPI = async (endpoint, method = 'POST', body = null) => {
  try {
    const url = `${VPS_API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add authentication header if your VPS API requires it for server calls
        // 'Authorization': `Bearer ${serviceAccountToken}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`VPS API Error (${endpoint}):`, error.message);
    throw error;
  }
};

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
    const { status, agentId } = req.body;
    
    // Get the order first to get userId and previous status
    const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const orderData = orderDoc.data();
    const userId = orderData.userId;
    const previousStatus = orderData.status;
    const transactionLedgerId = orderData.transactionLedgerId;
    const restaurantId = orderData.restaurantId || orderData.vendorId;
    const storeId = orderData.storeId;
    
    // Prepare update data
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Handle status-specific updates
    if (status === 'confirmed' || status === 'Confirmed') {
      updateData.confirmedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    if (status === 'delivered' || status === 'Delivered') {
      updateData.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
      if (agentId) {
        updateData.agentId = agentId;
      }
    }

    // Update the order status
    await admin.firestore().collection('orders').doc(orderId).update(updateData);

    // Handle vendor payout initiation (only for restaurant orders, when status changes to confirmed)
    if ((status === 'confirmed' || status === 'Confirmed') && 
        (previousStatus !== 'confirmed' && previousStatus !== 'Confirmed') &&
        restaurantId && !storeId && transactionLedgerId) {
      try {
        await callVPSAPI('/initiate-vendor-payout', 'POST', {
          orderId,
          transactionLedgerId,
        });
        console.log(`Vendor payout initiated for order: ${orderId}`);
      } catch (payoutError) {
        console.error('Vendor payout initiation failed:', payoutError);
        // Log error but don't block order status update
      }
    }

    // Handle agent payout initiation (when status changes to delivered)
    if ((status === 'delivered' || status === 'Delivered') && 
        (previousStatus !== 'delivered' && previousStatus !== 'Delivered') &&
        transactionLedgerId) {
      const finalAgentId = agentId || orderData.agentId;
      if (finalAgentId) {
        try {
          await callVPSAPI('/initiate-agent-payout', 'POST', {
            orderId,
            transactionLedgerId,
            agentId: finalAgentId,
          });
          console.log(`Agent payout initiated for order: ${orderId}`);
        } catch (payoutError) {
          console.error('Agent payout initiation failed:', payoutError);
          // Log error but don't block order status update
        }
      } else {
        console.warn(`Cannot initiate agent payout for order ${orderId}: agentId not provided`);
      }
    }

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