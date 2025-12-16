# Quick Reference Guide
## Payment Orchestration System - Developer Cheat Sheet

---

## 📁 File Structure

```
payment-orchestration/
├── README.md                  # System overview & quick start
├── ARCHITECTURE.md            # Detailed architecture & design
├── DATA_MODELS.md             # Firestore schema documentation
├── IMPLEMENTATION_GUIDE.md    # Step-by-step deployment guide
├── MONITORING.md              # Monitoring & alerting setup
├── PAYSTACK_API_REFERENCE.md  # Paystack API endpoints
├── SYSTEM_FLOW.md             # Visual flow diagrams
├── DEPLOYMENT_CHECKLIST.md    # Pre-deployment checklist
├── EXECUTIVE_SUMMARY.md       # High-level business summary
└── QUICK_REFERENCE.md         # This file

functions/
├── index.js                   # Main entry point
├── src/
│   ├── payment/
│   │   ├── commissionCalculator.js    # Commission calculation
│   │   ├── payoutInitiator.js         # Event-driven payout tasks
│   │   ├── batchPayoutProcessor.js    # Daily batch processing
│   │   └── webhookHandler.js          # Paystack webhook handler
│   └── utils/
│       ├── paystack.js                # Paystack API client
│       ├── commission.js              # Commission math
│       └── idempotency.js             # Idempotency utilities
```

---

## 🔧 Cloud Functions

| Function | Type | Trigger | Purpose |
|----------|------|---------|---------|
| `calculateCommission` | Firestore | `orders` onCreate | Calculate commissions |
| `updateCommissionOnPayment` | Firestore | `orders` onUpdate | Update on payment |
| `initiateVendorPayout` | Firestore | `orders` onUpdate | Create vendor payout task |
| `initiateAgentPayout` | Firestore | `orders` onUpdate | Create agent payout task |
| `dailyBatchPayoutProcessor` | Pub/Sub | Daily 12:00 AM UTC | Process pending payouts |
| `manualBatchPayoutProcessor` | HTTP | Manual trigger | Test/emergency batch run |
| `paystackWebhookHandler` | HTTP | Paystack webhooks | Process payment events |

---

## 📊 Firestore Collections

### Core Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `transaction_ledger` | Financial transactions | `orderId`, `paymentStatus`, `vendorCommission`, `payoutStatus` |
| `pending_payouts` | Payout queue | `recipientType`, `status`, `amount`, `createdAt` |
| `batch_payouts` | Batch processing history | `batchType`, `status`, `totalAmount`, `results` |
| `failed_payouts` | Failed payout queue | `failureReason`, `reviewStatus` |
| `idempotency_keys` | Prevent duplicates | `idempotencyKey`, `result`, `expiresAt` |

### Related Collections

| Collection | Fields Added |
|------------|--------------|
| `orders` | `paymentStatus`, `status`, `confirmedAt`, `deliveredAt` |
| `restaurants` | `tier`, `payoutDetails`, `payoutEnabled` |
| `agents` | `payoutDetails`, `payoutEnabled` |

---

## 💰 Commission Calculation

### Vendor Commission (Tiered)
```javascript
// Tier 1: 7.5%, Tier 2: 3%
commissionRate = (vendorTier === 1) ? 0.075 : 0.03
totalCommission = orderValue * commissionRate
vendorShare = orderValue - totalCommission
```

### Agent Commission
```javascript
agentShare = deliveryFee * 0.15  // 15%
```

### Platform Revenue
```javascript
platformRevenue = vendorCommission + (deliveryFee - agentShare)
```

### Example
```javascript
Order Value: ₦10,000
Delivery Fee: ₦500

Vendor Commission (Tier 1): ₦750 (7.5%)
Vendor Commission (Tier 2): ₦300 (3%)
Vendor Share: ₦8,950

Agent Share: ₦75 (15% of fee)

Platform Revenue: ₦1,475
```

---

## 🔄 Common Workflows

### 1. Order Payment Flow
```
1. Order created → calculateCommission()
2. Payment received → paystackWebhookHandler()
3. Order confirmed → initiateVendorPayout()
4. Daily batch → process vendor payout
```

### 2. Delivery Payout Flow
```
1. Order delivered → initiateAgentPayout()
2. Daily batch → process agent payout
```

### 3. Manual Payout Processing
```bash
# Trigger manual batch
curl -X POST https://REGION-PROJECT.cloudfunctions.net/manualBatchPayoutProcessor \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔍 Useful Queries

### Firestore Queries

```javascript
// Pending vendor payouts
db.collection("pending_payouts")
  .where("recipientType", "==", "vendor")
  .where("status", "==", "pending")
  .orderBy("createdAt", "asc")

// Transaction ledger by order
db.collection("transaction_ledger")
  .doc(orderId)
  .get()

// Failed payouts needing review
db.collection("failed_payouts")
  .where("reviewStatus", "==", "pending")
  .orderBy("createdAt", "desc")

// Today's batch payouts
db.collection("batch_payouts")
  .where("batchDate", ">=", todayStart)
  .orderBy("batchDate", "desc")
```

---

## 🚨 Error Codes

### Paystack Errors
- `INSUFFICIENT_BALANCE` - Add funds to Paystack account
- `INVALID_RECIPIENT` - Verify recipient code exists
- `INVALID_ACCOUNT` - Check account number and bank code
- `TRANSFER_LIMIT_EXCEEDED` - Review transfer limits

### System Errors
- Commission calculation failed → Check order data
- Payout not initiated → Verify order status and vendor/agent payout details
- Webhook signature invalid → Check webhook configuration

---

## 📝 Environment Variables

```bash
# Required
PAYSTACK_SECRET_KEY=sk_live_...

# Optional
PAYSTACK_PUBLIC_KEY=pk_live_...
GCP_PROJECT_ID=your-project-id
```

Set via:
```bash
firebase functions:config:set paystack.secret_key="sk_..."
# OR
firebase functions:secrets:set PAYSTACK_SECRET_KEY
```

---

## 🔐 Security Checklist

- [ ] Webhook signature verification enabled
- [ ] Firebase Auth required for manual endpoints
- [ ] Secret keys stored in Secret Manager
- [ ] CORS configured appropriately
- [ ] Firestore security rules set

---

## 📈 Monitoring Queries

### Cloud Logging

```bash
# Failed payouts
resource.type="cloud_function"
jsonPayload.component="payout-processor"
jsonPayload.severity="ERROR"

# Payment webhooks
resource.type="cloud_function"
jsonPayload.component="webhook-handler"
jsonPayload.event="charge.success"

# Commission errors
resource.type="cloud_function"
jsonPayload.component="commission-calculator"
jsonPayload.severity="ERROR"
```

---

## 🛠️ Troubleshooting

### Commission Not Calculated
1. Check Cloud Functions logs
2. Verify order has `total` field
3. Ensure `vendorId` exists

### Payout Not Created
1. Verify order status changed to "confirmed" or "delivered"
2. Check vendor/agent has `payoutEnabled: true`
3. Verify payout details are complete

### Batch Processing Failed
1. Check Paystack balance
2. Verify recipient codes
3. Review `failed_payouts` collection
4. Check Cloud Functions logs

### Webhook Not Processing
1. Verify webhook URL is correct
2. Check webhook signature verification
3. Review Paystack webhook delivery logs
4. Check Cloud Functions logs

---

## 📞 Support Contacts

- **Paystack**: support@paystack.com
- **Firebase**: firebase-support@google.com
- **Internal**: [Your team contact]

---

## 🔗 Quick Links

- [Paystack Dashboard](https://dashboard.paystack.com)
- [Firebase Console](https://console.firebase.google.com)
- [Cloud Functions Logs](https://console.cloud.google.com/functions)
- [Firestore Console](https://console.firebase.google.com/project/_/firestore)

---

## 📅 Important Times

- **Daily Batch**: 12:00 AM UTC (Midnight UTC)
- **Batch Duration**: Typically 2-5 minutes
- **Transfer Completion**: 1-2 minutes after batch start

---

## 💡 Tips

1. **Always test in development first** - Use Paystack test keys
2. **Monitor first batch closely** - Verify aggregation and transfers
3. **Set up alerts early** - Catch issues before they escalate
4. **Review failed_payouts daily** - Resolve issues promptly
5. **Keep logs archived** - For audit and debugging

---

**Last Updated**: 2024-01-15  
**Version**: 1.0

