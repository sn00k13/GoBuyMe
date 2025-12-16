# React Native App Integration Guide
## VPS API Integration Steps

This guide walks you through integrating the VPS payment orchestration API with your React Native application.

---

## Prerequisites

- ✅ VPS API endpoints implemented and deployed at `https://kwuo.gobuyme.shop`
- ✅ Firebase Authentication configured in your app
- ✅ Firestore database set up
- ✅ Order creation flow working

---

## Step 1: Create API Service Module

Create a new file `services/paymentOrchestrationAPI.js`:

```javascript
import { getAuth } from 'firebase/auth';

const API_BASE_URL = 'https://kwuo.gobuyme.shop/api';

// Get Firebase auth token for API calls
const getAuthToken = async () => {
  const auth = getAuth();
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }
  throw new Error('User not authenticated');
};

// Generic API call function
const apiCall = async (endpoint, method = 'GET', body = null) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Call Error (${endpoint}):`, error);
    throw error;
  }
};

// Calculate commission when order is created
export const calculateCommission = async (orderData) => {
  const { orderId, orderValue, deliveryFee, vendorId, agentId } = orderData;
  
  return await apiCall('/calculate-commission', 'POST', {
    orderId,
    orderValue, // in kobo
    deliveryFee, // in kobo
    vendorId,
    agentId: agentId || null,
  });
};

// Initiate vendor payout when order is confirmed
export const initiateVendorPayout = async (orderId, transactionLedgerId) => {
  return await apiCall('/initiate-vendor-payout', 'POST', {
    orderId,
    transactionLedgerId,
  });
};

// Initiate agent payout when order is delivered
export const initiateAgentPayout = async (orderId, transactionLedgerId, agentId) => {
  return await apiCall('/initiate-agent-payout', 'POST', {
    orderId,
    transactionLedgerId,
    agentId,
  });
};

// Get transaction ledger for an order
export const getTransactionLedger = async (orderId) => {
  return await apiCall(`/transaction-ledger/${orderId}`, 'GET');
};

// Get pending payouts
export const getPendingPayouts = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `/pending-payouts?${queryParams}` : '/pending-payouts';
  return await apiCall(endpoint, 'GET');
};

export default {
  calculateCommission,
  initiateVendorPayout,
  initiateAgentPayout,
  getTransactionLedger,
  getPendingPayouts,
};
```

---

## Step 2: Update Order Creation Flow

Update your payment success handler to call the commission calculation API.

### For Restaurant Orders (`screens/restaurant/RestaurantPaymentScreen.js`):

```javascript
import { calculateCommission } from '../../services/paymentOrchestrationAPI';

const handlePaymentSuccess = async (response) => {
  try {
    setProcessing(true);

    // ... existing code to fetch restaurant data ...

    // Create order document
    const orderRef = doc(db, 'orders', response.transactionRef.reference);
    const orderData = {
      userId: auth.currentUser.uid,
      items: cartItems,
      totalAmount,
      status: 'Pending',
      deliveryFee,
      dropOffLocation: userData.address.district,
      pickUpLocation: restaurantDistrict,
      paymentStatus: selectedMethod === 'bank' ? 'pending' : 'paid',
      paymentReference: response.transactionRef.reference,
      paymentMethod: selectedMethod,
      customerName: userData.name,
      customerPhone: userData.phone,
      customerEmail: userData.email,
      deliveryAddress: userData.address,
      restaurantId: restaurantId, // Ensure this is set
      vendorId: restaurantId, // For payment orchestration
      createdAt: serverTimestamp(),
      // ... other fields ...
    };

    // Save order to Firestore
    await setDoc(orderRef, orderData);

    // Call VPS API to calculate commission
    try {
      const commissionResult = await calculateCommission({
        orderId: response.transactionRef.reference,
        orderValue: totalAmount * 100, // Convert to kobo
        deliveryFee: deliveryFee * 100, // Convert to kobo
        vendorId: restaurantId,
        agentId: null, // Will be set when agent is assigned
      });

      // Update order with transaction ledger ID
      await updateDoc(orderRef, {
        transactionLedgerId: commissionResult.transactionLedgerId,
      });

      console.log('Commission calculated:', commissionResult);
    } catch (commissionError) {
      console.error('Commission calculation failed:', commissionError);
      // Log error but don't block order creation
      // You may want to show a warning to the user
    }

    // ... rest of existing code (notifications, cart clearing, etc.) ...
  } catch (error) {
    console.error('Payment success error:', error);
    Alert.alert('Error', 'Failed to process order. Please contact support.');
  } finally {
    setProcessing(false);
  }
};
```

### For Store Orders (`screens/store/PaymentScreen.js`):

Apply the same pattern, using `storeId` instead of `restaurantId`.

---

## Step 3: Update Order Confirmation Flow

When an order status changes to "confirmed", call the vendor payout initiation API.

**Where orders are confirmed** (likely in an admin panel or vendor app):

```javascript
import { initiateVendorPayout } from '../services/paymentOrchestrationAPI';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const confirmOrder = async (orderId, transactionLedgerId) => {
  try {
    // Update order status
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'confirmed',
      confirmedAt: serverTimestamp(),
    });

    // Initiate vendor payout via VPS API
    if (transactionLedgerId) {
      try {
        const payoutResult = await initiateVendorPayout(orderId, transactionLedgerId);
        console.log('Vendor payout initiated:', payoutResult);
      } catch (payoutError) {
        console.error('Vendor payout initiation failed:', payoutError);
        // Log error but don't block order confirmation
      }
    }
  } catch (error) {
    console.error('Order confirmation error:', error);
    throw error;
  }
};
```

---

## Step 4: Update Order Delivery Flow

When an order is marked as "delivered", call the agent payout initiation API.

**Where orders are marked as delivered** (likely in delivery agent app):

```javascript
import { initiateAgentPayout } from '../services/paymentOrchestrationAPI';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const markOrderDelivered = async (orderId, agentId) => {
  try {
    // Get order to find transaction ledger ID
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderSnap.data();
    const transactionLedgerId = orderData.transactionLedgerId;

    // Update order status
    await updateDoc(orderRef, {
      status: 'delivered',
      deliveredAt: serverTimestamp(),
      agentId: agentId, // Set agent ID if not already set
    });

    // Initiate agent payout via VPS API
    if (transactionLedgerId && agentId) {
      try {
        const payoutResult = await initiateAgentPayout(
          orderId,
          transactionLedgerId,
          agentId
        );
        console.log('Agent payout initiated:', payoutResult);
      } catch (payoutError) {
        console.error('Agent payout initiation failed:', payoutError);
        // Log error but don't block order delivery
      }
    }
  } catch (error) {
    console.error('Order delivery error:', error);
    throw error;
  }
};
```

---

## Step 5: Add Error Handling & Retry Logic

Create a utility for handling API failures with retry:

```javascript
// utils/apiRetry.js
export const retryApiCall = async (apiFunction, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiFunction();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// Usage:
import { retryApiCall } from '../utils/apiRetry';
import { calculateCommission } from '../services/paymentOrchestrationAPI';

const result = await retryApiCall(() => 
  calculateCommission({
    orderId: '...',
    orderValue: 10000,
    deliveryFee: 500,
    vendorId: '...',
  })
);
```

---

## Step 6: Add Loading States & User Feedback

Update your UI to show loading states during API calls:

```javascript
const [calculatingCommission, setCalculatingCommission] = useState(false);

// In handlePaymentSuccess:
setCalculatingCommission(true);
try {
  await calculateCommission({...});
  // Show success message
} catch (error) {
  Alert.alert(
    'Warning',
    'Commission calculation is processing. Your order is confirmed.',
    [{ text: 'OK' }]
  );
} finally {
  setCalculatingCommission(false);
}
```

---

## Step 7: Testing Checklist

### Test Commission Calculation
- [ ] Create a test order
- [ ] Verify commission API is called
- [ ] Check transaction_ledger in Firestore
- [ ] Verify commission amounts are correct (Tier 1: 7.5%, Tier 2: 3%)

### Test Vendor Payout Initiation
- [ ] Confirm a test order
- [ ] Verify vendor payout API is called
- [ ] Check pending_payouts collection
- [ ] Verify payout amount matches vendor share

### Test Agent Payout Initiation
- [ ] Mark a test order as delivered
- [ ] Verify agent payout API is called
- [ ] Check pending_payouts collection
- [ ] Verify payout amount matches agent share (15% of delivery fee)

### Test Error Handling
- [ ] Test with invalid order data
- [ ] Test with network failures
- [ ] Verify graceful error handling
- [ ] Check error logs

---

## Step 8: Monitor & Verify

### Check VPS API Logs
```bash
# On your VPS
pm2 logs payment-api
# or
tail -f /var/log/payment-api.log
```

### Verify Firestore Data
- Check `transaction_ledger` collection for commission calculations
- Check `pending_payouts` collection for payout tasks
- Verify order documents have `transactionLedgerId` field

### Test End-to-End Flow
1. Create order → Commission calculated
2. Confirm order → Vendor payout initiated
3. Deliver order → Agent payout initiated
4. Wait for batch processing (or trigger manually)
5. Verify payouts in Paystack dashboard

---

## Common Issues & Solutions

### Issue: "Unauthorized" Error
**Solution**: Ensure Firebase Auth token is being sent correctly. Check `getAuthToken()` function.

### Issue: Commission Not Calculated
**Solution**: 
- Verify API endpoint is correct
- Check order data (orderValue, deliveryFee, vendorId)
- Review VPS API logs for errors

### Issue: Payout Not Initiated
**Solution**:
- Verify `transactionLedgerId` exists in order document
- Check vendor/agent has `payoutEnabled: true`
- Verify payout details are complete

### Issue: Network Timeout
**Solution**:
- Implement retry logic
- Increase timeout values
- Check VPS server status

---

## Next Steps After Integration

1. **Monitor First Orders**: Watch the first few orders closely
2. **Verify Calculations**: Manually verify commission calculations
3. **Test Batch Processing**: Wait for or manually trigger batch payout
4. **Review Logs**: Check both app logs and VPS API logs
5. **User Feedback**: Collect feedback from vendors and agents

---

## Support

For issues or questions:
- Review [API_ENDPOINTS.md](./API_ENDPOINTS.md) for API specifications
- Check [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for setup details
- Review VPS API logs for error details

---

**Integration Status**: Ready for implementation  
**Estimated Time**: 2-4 hours for full integration and testing

