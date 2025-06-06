const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');

const router = express.Router();

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Verify Paystack webhook signature
const verifySignature = (req) => {
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
  return hash === req.headers['x-paystack-signature'];
};

router.post('/paystack', async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifySignature(req)) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        // Update order status in Firestore
        const reference = event.data.reference;
        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.where('paymentReference', '==', reference).get();
        
        if (!snapshot.empty) {
          const orderDoc = snapshot.docs[0];
          await orderDoc.ref.update({
            paymentStatus: 'confirmed',
            paymentDetails: event.data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;

      case 'transfer.success':
        // Handle successful bank transfers
        // Similar to charge.success
        break;

      case 'transfer.failed':
        // Handle failed bank transfers
        const failedRef = event.data.reference;
        const failedSnapshot = await ordersRef.where('paymentReference', '==', failedRef).get();
        
        if (!failedSnapshot.empty) {
          const orderDoc = failedSnapshot.docs[0];
          await orderDoc.ref.update({
            paymentStatus: 'failed',
            paymentDetails: event.data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook handler failed');
  }
});

module.exports = router;