# Implementation Guide

## Payment Orchestration & Automated Payouts System

---

## Prerequisites

1. **Firebase Project Setup**

   - Firebase project created
   - Billing enabled
   - Firestore database initialized

2. **VPS Setup**

   - Private VPS server configured and accessible
   - API base URL: `https://kwuo.gobuyme.shop`
   - Node.js runtime installed (v18+)
   - SSL/TLS certificates configured for HTTPS

3. **Paystack Account**

   - Production API keys
   - Transfer recipient creation enabled
   - Webhook URL configured (will point to VPS API)

4. **Environment Variables (VPS)**
   - `PAYSTACK_SECRET_KEY` - Paystack secret key
   - `PAYSTACK_PUBLIC_KEY` - Paystack public key (for frontend)
   - `FIREBASE_PROJECT_ID` - Firebase project ID
   - `FIREBASE_ADMIN_SDK_KEY` - Firebase Admin SDK service account key (JSON)

---

## Step 1: Set Up VPS API Server

### Install Dependencies on VPS

```bash
# On your VPS server
npm init -y
npm install express firebase-admin axios crypto dotenv cors
```

Ensure `package.json` includes:

- `express` - Web framework
- `firebase-admin` - Firebase Admin SDK
- `axios` - HTTP client for Paystack API
- `crypto` - Built-in Node.js module for webhook verification
- `dotenv` - Environment variable management
- `cors` - CORS middleware

---

## Step 2: Configure Firestore Indexes

1. Deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

Or manually create indexes via Firebase Console:

- Go to Firestore → Indexes
- Import `firestore.indexes.json` or create manually

---

## Step 3: Configure VPS Environment Variables

Create a `.env` file on your VPS:

```bash
# On your VPS server
cat > .env << EOF
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_SDK_KEY=/path/to/serviceAccountKey.json
PORT=3000
NODE_ENV=production
EOF
```

**Security Note**: 
- Store `.env` file securely with restricted permissions (`chmod 600 .env`)
- Never commit `.env` to version control
- Use environment variable management tools in production

---

## Step 4: Update Existing Collections

### Add Fields to `orders` Collection

Ensure your `orders` collection includes:

- `paymentStatus`: "pending" | "paid" | "failed" | "refunded"
- `paymentReference`: Paystack payment reference
- `status`: "pending" | "confirmed" | "preparing" | "ready" | "in_transit" | "delivered" | "cancelled"
- `confirmedAt`: timestamp (when order confirmed)
- `deliveredAt`: timestamp (when order delivered)
- `transactionLedgerId`: reference to transaction_ledger

### Add Fields to `restaurants` Collection

Ensure restaurants (vendors) have:

- `tier`: Number (1 or 2) - Subscription tier
  - Tier 1: 7.5% commission
  - Tier 2: 3% commission
- `subscriptionTier`: Number (alternative field name, same as tier)

And:

```javascript
{
  payoutDetails: {
    accountNumber: string,
    bankCode: string,
    accountName: string,
    bankName: string,
    verified: boolean,
    recipientCode: string | null  // Paystack recipient code
  },
  payoutEnabled: boolean,
  payoutSchedule: "daily"  // default
}
```

### Add Fields to `agents` Collection

Similar to restaurants:

```javascript
{
  payoutDetails: {
    accountNumber: string,
    bankCode: string,
    accountName: string,
    bankName: string,
    verified: boolean,
    recipientCode: string | null
  },
  payoutEnabled: boolean,
  payoutSchedule: "daily"
}
```

---

## Step 5: Implement VPS API Endpoints

Implement all required API endpoints on your VPS. See `API_ENDPOINTS.md` for detailed endpoint specifications.

**Required Endpoints**:
- `POST /api/calculate-commission`
- `POST /api/initiate-vendor-payout`
- `POST /api/initiate-agent-payout`
- `POST /api/process-batch-payouts`
- `POST /api/paystack-webhook`
- `POST /api/verify-account` (already implemented)
- `GET /api/transaction-ledger/:orderId`
- `GET /api/pending-payouts`

**Basic Express Server Structure**:

```javascript
// server.js
const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(express.json());
app.use(cors());

// Middleware for Firebase Auth verification
const verifyFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Implement endpoints (see API_ENDPOINTS.md for details)
app.post('/api/calculate-commission', verifyFirebaseToken, async (req, res) => {
  // Implementation here
});

app.post('/api/paystack-webhook', async (req, res) => {
  // Webhook verification and processing
});

// ... other endpoints

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Step 6: Configure Paystack Webhook

1. **Set Webhook URL in Paystack Dashboard**:

   - Go to https://dashboard.paystack.com
   - Navigate to Settings → API Keys & Webhooks
   - Add webhook URL: `https://kwuo.gobuyme.shop/api/paystack-webhook`
   - Enable events:
     - ✅ `charge.success`
     - ✅ `charge.failed`
     - ✅ `transfer.success`
     - ✅ `transfer.failed`
     - ✅ `transfer.reversed`
   - Click "Save"

2. **Test Webhook**:

```bash
curl -X POST https://kwuo.gobuyme.shop/api/paystack-webhook \
  -H "X-Paystack-Signature: test_signature" \
  -H "Content-Type: application/json" \
  -d '{"event":"charge.success","data":{...}}'
```

---

## Step 7: Set Up Cron Job for Batch Processing

Set up a cron job on your VPS to trigger daily batch payout processing:

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 12:00 AM UTC
0 0 * * * curl -X POST https://kwuo.gobuyme.shop/api/process-batch-payouts \
  -H "Authorization: Bearer $(cat /path/to/service-account-token)" \
  -H "Content-Type: application/json" \
  -d '{"type":"all"}' >> /var/log/batch-payouts.log 2>&1
```

**Alternative**: Use a service account token or API key for authentication instead of Firebase user token.

**Note**: Ensure the cron job has proper error handling and logging.

---

## Step 8: Test the System

### Test Commission Calculation

1. Create a test order in Firestore:

```javascript
await db.collection('orders').add({
	total: 10000, // ₦100.00 in kobo
	deliveryFee: 500, // ₦5.00
	vendorId: 'test_vendor_id',
	status: 'pending',
	paymentStatus: 'pending',
	createdAt: new Date(),
});
```

2. Call VPS API to calculate commission:

```javascript
// In your React Native app or backend
const response = await fetch('https://kwuo.gobuyme.shop/api/calculate-commission', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseAuthToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'ORDER_ID',
    orderValue: 10000,
    deliveryFee: 500,
    vendorId: 'test_vendor_id'
  })
});

const result = await response.json();
console.log(result);
```

3. Check transaction_ledger in Firestore:

```javascript
const ledger = await db.collection('transaction_ledger').doc('ORDER_ID').get();
console.log(ledger.data());
```

Expected (Tier 1 vendor):

- Vendor commission: ₦750 (7.5%)
- Vendor share: ₦9,250
- Agent commission: ₦75 (15% of delivery fee)
- Platform revenue: ₦1,175

Expected (Tier 2 vendor):

- Vendor commission: ₦300 (3%)
- Vendor share: ₦9,700
- Agent commission: ₦75 (15% of delivery fee)
- Platform revenue: ₦725

### Test Vendor Payout Initiation

1. Confirm the order in Firestore:

```javascript
await db.collection('orders').doc('ORDER_ID').update({
	status: 'confirmed',
	confirmedAt: new Date(),
	paymentStatus: 'paid'
});
```

2. Call VPS API to initiate vendor payout:

```javascript
const response = await fetch('https://kwuo.gobuyme.shop/api/initiate-vendor-payout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseAuthToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'ORDER_ID',
    transactionLedgerId: 'LEDGER_ID'
  })
});

const result = await response.json();
console.log(result);
```

3. Check pending_payouts collection:

```javascript
const payouts = await db
	.collection('pending_payouts')
	.where('recipientType', '==', 'vendor')
	.get();
```

### Test Batch Payout Processing

1. Manually trigger batch processor via VPS API:

```bash
curl -X POST https://kwuo.gobuyme.shop/api/process-batch-payouts \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"all"}'
```

Or call from your application:

```javascript
const response = await fetch('https://kwuo.gobuyme.shop/api/process-batch-payouts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseAuthToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ type: 'all' })
});
```

---

## Step 9: Monitor and Verify

1. **Check VPS API Logs**:

   - Review application logs on VPS
   - Check error logs for any issues
   - Monitor API response times

2. **Check Firestore**:

   - Verify transaction_ledger entries
   - Check pending_payouts queue
   - Review batch_payouts history

3. **Check Paystack Dashboard**:
   - Verify transfers created
   - Check transfer statuses
   - Review webhook deliveries

---

## Step 10: Production Checklist

- [ ] All VPS API endpoints implemented and deployed
- [ ] Firestore indexes created
- [ ] Environment variables configured on VPS
- [ ] Paystack webhook configured to point to VPS
- [ ] Cron job for batch processing configured
- [ ] Monitoring and alerts configured
- [ ] SSL/TLS certificates valid and configured
- [ ] Test transactions verified
- [ ] Vendor and agent payout details verified
- [ ] Error handling tested
- [ ] Logging verified
- [ ] Backup and disaster recovery plan documented
- [ ] API rate limiting configured
- [ ] Firebase Admin SDK properly initialized

---

## Troubleshooting

### Commission Not Calculated

**Symptom**: Transaction ledger not created after order creation

**Solution**:

1. Check VPS API logs for errors
2. Verify API endpoint `/api/calculate-commission` is being called
3. Verify order has `total` or `orderValue` field
4. Ensure `vendorId` is present in order
5. Check Firebase Admin SDK is properly initialized
6. Verify authentication token is valid

### Payout Not Initiated

**Symptom**: No payout task created when order confirmed

**Solution**:

1. Verify API endpoint `/api/initiate-vendor-payout` is being called
2. Check if `paymentStatus` is "paid"
3. Verify vendor has `payoutEnabled: true`
4. Check vendor `payoutDetails` are complete
5. Review VPS API logs for errors
6. Verify authentication token is valid

### Batch Payout Failed

**Symptom**: Payouts remain in "pending" status

**Solution**:

1. Check VPS API logs for errors
2. Verify cron job is running correctly
3. Check Paystack API errors in logs
4. Verify Paystack balance is sufficient
5. Check recipient bank details are valid
6. Review `failed_payouts` collection
7. Manually trigger batch processor to test

### Webhook Not Processing

**Symptom**: Payment confirmed but ledger not updated

**Solution**:

1. Verify webhook URL is correct: `https://kwuo.gobuyme.shop/api/paystack-webhook`
2. Check webhook signature verification in VPS API
3. Review webhook delivery logs in Paystack dashboard
4. Check VPS API logs for errors
5. Verify endpoint is accessible from Paystack servers
6. Test webhook manually with curl

---

## Security Best Practices

1. **Never expose secret keys** in client code
2. **Always verify webhook signatures** before processing
3. **Use Firebase Authentication** for manual endpoints
4. **Implement rate limiting** for webhook handler
5. **Enable audit logging** for all financial operations
6. **Regular security audits** of payment flows
7. **Keep dependencies updated** to patch vulnerabilities

---

## Performance Optimization

1. **Batch Firestore writes** where possible
2. **Use composite indexes** for efficient queries
3. **Implement pagination** for large result sets
4. **Cache Paystack recipient codes** in vendor/agent documents
5. **Use job queues** (Redis/Bull) for heavy batch operations if needed
6. **Implement API response caching** where appropriate
7. **Optimize database queries** to reduce Firestore reads
8. **Monitor API response times** and optimize slow endpoints

---

## Cost Optimization

1. **Archive old transaction logs** to separate storage
2. **Set Firestore read/write quotas** to prevent cost overruns
3. **Monitor VPS API usage** and optimize
4. **Use efficient query patterns** to reduce Firestore reads
5. **Set up billing alerts** in Firebase/GCP
6. **Optimize server resources** based on actual usage
7. **Implement request rate limiting** to prevent abuse

---

## Support & Maintenance

### Regular Tasks

1. **Daily**: Review failed payouts and resolve issues
2. **Weekly**: Review financial reconciliation reports
3. **Monthly**: Audit transaction ledger for discrepancies
4. **Quarterly**: Security audit and dependency updates

### Emergency Contacts

- **Paystack Support**: support@paystack.com
- **Firebase Support**: firebase-support@google.com
- **On-Call Engineer**: [Configure in PagerDuty]

---

## Additional Resources

- [Paystack API Documentation](https://paystack.com/docs/api)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Express.js Documentation](https://expressjs.com/)
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Complete API endpoint specifications
