const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');
const router = express.Router();

// Verify Paystack webhook signature
const verifySignature = (req) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    return hash === req.headers['x-paystack-signature'];
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

// Update order in Firestore
const updateOrder = async (reference, updateData) => {
  const ordersRef = admin.firestore().collection('orders');
  const snapshot = await ordersRef.where('paymentReference', '==', reference).get();
  
  if (snapshot.empty) {
    throw new Error('Order not found');
  }

  const orderDoc = snapshot.docs[0];
  await orderDoc.ref.update({
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return orderDoc.id;
};

// Send notification to user
const sendNotification = async (userId, title, body) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.fcmToken) {
      await admin.messaging().send({
        token: userData.fcmToken,
        notification: { title, body },
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

router.post('/paystack', async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifySignature(req)) {
      console.error('Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    console.log('Received Paystack webhook:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const { reference, amount, channel } = event.data;
        const orderId = await updateOrder(reference, {
          paymentStatus: 'confirmed',
          paymentDetails: event.data,
          status: 'processing'
        });

        // Get order details to send notification
        const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
        const orderData = orderDoc.data();

        // Send notification to user
        await sendNotification(
          orderData.userId,
          'Payment Successful',
          `Your payment of ₦${amount/100} via ${channel} has been confirmed.`
        );
        break;
      }

      case 'transfer.success': {
        const { reference, amount } = event.data;
        const orderId = await updateOrder(reference, {
          paymentStatus: 'confirmed',
          paymentDetails: event.data,
          status: 'processing'
        });

        // Get order details to send notification
        const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
        const orderData = orderDoc.data();

        // Send notification to user
        await sendNotification(
          orderData.userId,
          'Bank Transfer Successful',
          `Your bank transfer of ₦${amount/100} has been confirmed.`
        );
        break;
      }

      case 'transfer.failed':
      case 'charge.failed': {
        const { reference, gateway_response } = event.data;
        const orderId = await updateOrder(reference, {
          paymentStatus: 'failed',
          paymentDetails: event.data,
          failureReason: gateway_response
        });

        // Get order details to send notification
        const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
        const orderData = orderDoc.data();

        // Send notification to user
        await sendNotification(
          orderData.userId,
          'Payment Failed',
          `Your payment failed: ${gateway_response}. Please try again.`
        );
        break;
      }

      default:
        console.log('Unhandled event type:', event.event);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook handler failed');
  }
});

module.exports = router; 