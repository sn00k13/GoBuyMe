# Next Steps - Getting Started
## Payment Orchestration System Implementation Roadmap

Follow these steps in order to get your payment orchestration system up and running.

---

## 🎯 Phase 1: Preparation & Setup (Day 1-2)

### Step 1: Verify Prerequisites

**Required Accounts:**
- [ ] Firebase/GCP project with billing enabled
- [ ] Paystack account (production or test account)
- [ ] Node.js 18+ installed locally
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)

**Verify Setup:**
```bash
# Check Node.js version
node --version  # Should be 18 or higher

# Check Firebase CLI
firebase --version

# Login to Firebase
firebase login
```

---

### Step 2: Configure Environment Variables

**Set Paystack Secret Key on VPS:**

Create a `.env` file on your VPS server:
```bash
# On your VPS server
PAYSTACK_SECRET_KEY=sk_test_YOUR_TEST_KEY
PAYSTACK_PUBLIC_KEY=pk_test_YOUR_TEST_KEY
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_SDK_KEY=/path/to/serviceAccountKey.json
```

**Security Note**: 
- Store `.env` file securely with restricted permissions (`chmod 600 .env`)
- Never commit `.env` to version control

**Get Your Paystack Keys:**
1. Go to https://dashboard.paystack.com
2. Navigate to Settings → API Keys & Webhooks
3. Copy your **Test Secret Key** (starts with `sk_test_`)
4. For production, use **Live Secret Key** (starts with `sk_live_`)

---

### Step 3: Install Dependencies

```bash
cd functions
npm install
```

**Verify packages installed:**
- firebase-admin
- firebase-functions
- axios
- dotenv

---

## 🗄️ Phase 2: Database Setup (Day 2-3)

### Step 4: Update Restaurant Collection Schema

Add `tier` field to your existing restaurants. You can do this via Firebase Console or programmatically.

**Via Firebase Console:**
1. Go to Firestore Database
2. Open a restaurant document (in `restaurants` collection)
3. Add field: `tier` (number)
   - Set to `1` for 7.5% commission
   - Set to `2` for 3% commission

**Via Code (Update existing restaurants):**
```javascript
// Run this script to update existing restaurants
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function updateRestaurants() {
  const restaurantsRef = db.collection('restaurants');
  const snapshot = await restaurantsRef.get();
  
  const batch = db.batch();
  let count = 0;
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    // Only update if tier doesn't exist
    if (!data.tier && !data.subscriptionTier) {
      batch.update(doc.ref, { 
        tier: 1  // Default to Tier 1, change as needed
      });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`Updated ${count} restaurants with tier field`);
  }
}

updateRestaurants().then(() => process.exit(0));
```

---

### Step 5: Update Restaurant Payout Details

Ensure restaurants have payout details configured:

**Required fields in restaurant document:**
```javascript
{
  tier: 1,  // or 2
  payoutDetails: {
    accountNumber: "0123456789",
    bankCode: "044",
    accountName: "Restaurant Name",
    bankName: "Access Bank",  // Optional
    verified: true,
    recipientCode: null  // Will be created by Paystack
  },
  payoutEnabled: true
}
```

**For each restaurant:**
1. Verify bank account using existing `verifyBankAccount` function
2. Update restaurant document with payout details
3. Set `payoutEnabled: true`

---

### Step 6: Update Order Collection Schema

Ensure orders collection has required fields. Update your order creation code to include:

```javascript
{
  // ... existing order fields ...
  paymentStatus: "pending",  // "pending" | "paid" | "failed"
  paymentReference: null,    // Paystack payment reference
  status: "pending",         // "pending" | "confirmed" | "delivered" etc.
  confirmedAt: null,         // Timestamp when order confirmed
  deliveredAt: null,         // Timestamp when order delivered
  vendorId: "restaurant_123", // Restaurant ID (or restaurantId field)
  restaurantId: "restaurant_123", // Alternative field name
  agentId: null              // Set when agent assigned (reference to agents collection)
}
```

---

### Step 7: Deploy Firestore Indexes

```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Or create manually via Firebase Console:
# 1. Go to Firestore → Indexes
# 2. Import firestore.indexes.json
```

**Verify indexes are created:**
- Go to Firebase Console → Firestore → Indexes
- Wait for indexes to finish building (can take a few minutes)

---

## ⚙️ Phase 3: Implement and Deploy VPS API (Day 3-4)

### Step 8: Set Up VPS API Server

1. **Install dependencies on VPS:**
```bash
# On your VPS server
npm init -y
npm install express firebase-admin axios crypto dotenv cors
```

2. **Implement API endpoints** (see [API_ENDPOINTS.md](./API_ENDPOINTS.md) for specifications):
   - `POST /api/calculate-commission`
   - `POST /api/initiate-vendor-payout`
   - `POST /api/initiate-agent-payout`
   - `POST /api/process-batch-payouts`
   - `POST /api/paystack-webhook`
   - `GET /api/transaction-ledger/:orderId`
   - `GET /api/pending-payouts`

3. **Test API endpoints locally** (optional but recommended):
```bash
# Test with curl or Postman
curl -X POST http://localhost:3000/api/calculate-commission \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test","orderValue":10000,"deliveryFee":500,"vendorId":"test_vendor"}'
```

---

### Step 9: Deploy VPS API

1. **Deploy your API code to VPS:**
   - Use PM2, systemd, or your preferred process manager
   - Ensure API is accessible at `https://kwuo.gobuyme.shop`

2. **Set up process manager (PM2 example):**
```bash
pm2 start server.js --name payment-api
pm2 save
pm2 startup
```

3. **Verify API is running:**
```bash
curl https://kwuo.gobuyme.shop/api/verify-account
```

**Note the webhook URL** - you'll need it in the next step: `https://kwuo.gobuyme.shop/api/paystack-webhook`

---

### Step 10: Configure Paystack Webhook

1. **Webhook URL:**
   ```
   https://kwuo.gobuyme.shop/api/paystack-webhook
   ```

2. **Configure in Paystack Dashboard:**
   - Go to https://dashboard.paystack.com
   - Settings → API Keys & Webhooks
   - Click "Add Webhook"
   - Paste your webhook URL: `https://kwuo.gobuyme.shop/api/paystack-webhook`
   - Enable these events:
     - ✅ `charge.success`
     - ✅ `charge.failed`
     - ✅ `transfer.success`
     - ✅ `transfer.failed`
     - ✅ `transfer.reversed`
   - Click "Save"

3. **Test Webhook:**
   - Paystack will send a test event
   - Check VPS API logs for webhook receipt
   - Verify signature verification works
   - Test manually:
   ```bash
   curl -X POST https://kwuo.gobuyme.shop/api/paystack-webhook \
     -H "X-Paystack-Signature: test_signature" \
     -H "Content-Type: application/json" \
     -d '{"event":"charge.success","data":{...}}'
   ```

---

## 🧪 Phase 4: Testing (Day 4-5)

### Step 11: Test Commission Calculation

**Create a test order:**

```javascript
// In your React Native app or via Firebase Console
const testOrder = {
  total: 10000,  // ₦100.00 in kobo
  deliveryFee: 500,  // ₦5.00 in kobo
  vendorId: "your_test_vendor_id",
  status: "pending",
  paymentStatus: "pending",
  createdAt: new Date()
};

// Create order
await db.collection('orders').add(testOrder);
```

**Check results:**
1. Go to Firestore → `transaction_ledger` collection
2. Find document with matching `orderId`
3. Verify commission calculated correctly:
   - Tier 1 restaurant: Commission = ₦750 (7.5%)
   - Tier 2 restaurant: Commission = ₦300 (3%)
4. Verify `vendorId` references restaurant document ID

---

### Step 12: Test Vendor Payout Initiation

**Update order status to confirmed:**
```javascript
await db.collection('orders').doc('ORDER_ID').update({
  status: 'confirmed',
  confirmedAt: new Date(),
  paymentStatus: 'paid'
});
```

**Check results:**
1. Go to Firestore → `pending_payouts` collection
2. Find payout task with:
   - `recipientType: "vendor"`
   - `status: "pending"`
   - `amount` = vendor share from transaction ledger

---

### Step 13: Test Batch Payout Processing (Manual)

**Trigger manual batch processor:**

```bash
# Get your Firebase auth token
firebase login:ci

# Call the manual batch processor
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/manualBatchPayoutProcessor \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json"
```

**Or via Firebase Console:**
1. Go to Functions
2. Click `manualBatchPayoutProcessor`
3. Click "Test"
4. Execute function

**Check results:**
1. Review VPS API logs
2. Check `batch_payouts` collection in Firestore
3. Verify Paystack transfers created (check Paystack dashboard)
4. Check `pending_payouts` status updated in Firestore

---

### Step 14: Test Webhook Processing

**Simulate payment webhook:**
```javascript
// Use Paystack test mode
// Make a test payment via your app
// Or use Paystack's test card:
// Card: 4084084084084081
// CVV: 408
// Expiry: Any future date
```

**Check results:**
1. VPS API logs should show webhook received
2. `transaction_ledger` should update with payment status
3. Order should update to `paymentStatus: "paid"`

---

## 📊 Phase 5: Monitoring Setup (Day 5-6)

### Step 15: Set Up Cloud Monitoring Dashboard

1. **Create Dashboard:**
   - Go to Cloud Console → Monitoring → Dashboards
   - Create new dashboard
   - Add widgets for:
     - Function execution count
     - Function error rate
     - Function execution time
     - Firestore read/write operations

2. **Set Up Alerts:**
   - Go to Monitoring → Alerting
   - Create alert policies:
     - High payout failure rate (>5%)
     - Unprocessed payouts > 48 hours
     - Commission calculation errors

See [MONITORING.md](./MONITORING.md) for detailed configuration.

---

### Step 16: Set Up Logging

**Verify logs are working:**
```bash
# View VPS API logs
# If using PM2:
pm2 logs payment-api

# Or check application logs:
tail -f /var/log/payment-api.log

# Or check system logs:
journalctl -u payment-api -f
```

**Test logging:**
- Create a test order
- Check logs for commission calculation
- Verify log entries are structured and readable

---

## 🚀 Phase 6: Production Readiness (Day 6-7)

### Step 17: Update to Production Keys

**Switch to Production Paystack Keys:**
```bash
# On your VPS, update .env file:
PAYSTACK_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PRODUCTION_KEY

# Restart API server
pm2 restart payment-api
```

**Update Paystack Webhook URL:**
- Ensure production webhook URL is configured
- Test webhook in production environment

---

### Step 18: Verify All Collections Exist

**Check these collections exist in Firestore:**
- [ ] `transaction_ledger`
- [ ] `pending_payouts`
- [ ] `batch_payouts`
- [ ] `failed_payouts`
- [ ] `orders` (with required fields)
- [ ] `restaurants` (with tier and payoutDetails)
- [ ] `agents` (with payoutDetails)

---

### Step 19: Test Full Payment Flow

**End-to-end test:**
1. Create order in app
2. Process payment via Paystack
3. Confirm order (triggers vendor payout)
4. Deliver order (triggers agent payout)
5. Run batch processor
6. Verify payouts in Paystack dashboard
7. Verify ledger updated correctly

---

### Step 20: Review Deployment Checklist

Go through [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) and verify:
- [ ] All functions deployed
- [ ] All indexes created
- [ ] Webhooks configured
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Documentation reviewed

---

## 📝 Quick Command Reference

```bash
# Install dependencies on VPS
npm install

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Restart VPS API (if using PM2)
pm2 restart payment-api

# View VPS API logs
pm2 logs payment-api

# Test API endpoint
curl https://kwuo.gobuyme.shop/api/verify-account

# Set up cron job for batch processing
crontab -e
# Add: 0 0 * * * curl -X POST https://kwuo.gobuyme.shop/api/process-batch-payouts ...
```

---

## 🆘 Troubleshooting

### Commission Not Calculated
- Check VPS API logs
- Verify API endpoint `/api/calculate-commission` is being called
- Verify order has `total` or `orderValue` field
- Verify vendor has `tier` field
- Check if vendor document exists
- Verify Firebase Admin SDK is properly initialized

### Payout Not Initiated
- Verify API endpoints are being called (`/api/initiate-vendor-payout`, `/api/initiate-agent-payout`)
- Verify order status changed to "confirmed" or "delivered"
- Check vendor/agent has `payoutEnabled: true`
- Verify payout details are complete
- Check VPS API logs for errors

### Webhook Not Working
- Verify webhook URL is correct: `https://kwuo.gobuyme.shop/api/paystack-webhook`
- Check webhook signature verification in VPS API
- Review Paystack webhook delivery logs
- Check VPS API logs
- Verify endpoint is accessible from Paystack servers

### Batch Processing Failing
- Verify cron job is running correctly
- Check VPS API logs
- Verify Paystack balance is sufficient
- Check recipient codes are valid
- Review `failed_payouts` collection
- Manually trigger batch processor to test

---

## 📞 Need Help?

- **Documentation**: Review files in `/payment-orchestration` directory
- **Code Issues**: Review VPS API implementation (see [API_ENDPOINTS.md](./API_ENDPOINTS.md))
- **Paystack Support**: support@paystack.com
- **Firebase Support**: firebase-support@google.com

---

## ✅ Success Criteria

You're ready for production when:
- [ ] All VPS API endpoints implemented and deployed
- [ ] Test orders process correctly
- [ ] Commissions calculate accurately
- [ ] Payouts initiate and process
- [ ] Webhooks receive and process events
- [ ] Cron job for batch processing configured
- [ ] SSL/TLS certificates valid and configured
- [ ] Monitoring and alerts configured
- [ ] Team trained on system operation

---

**Estimated Timeline:** 5-7 days for full implementation and testing

**Next Action:** Start with Phase 1, Step 1 - Verify Prerequisites

Good luck! 🚀

