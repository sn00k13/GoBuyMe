# Payment Orchestration & Automated Payouts System

## Technical Architecture Blueprint

### Overview

This document outlines a complete, secure, and scalable payment orchestration system designed to handle payment processing from customers and automated payouts to vendors and delivery agents, scaling from startup to 1+ million orders per day.

---

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT NATIVE CLIENT                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Customer   │  │   Vendor     │  │   Delivery   │         │
│  │   App        │  │   Portal     │  │   Agent App  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FIREBASE / GCP BACKEND                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          FIRESTORE DATABASE                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │   orders    │  │ transactions│  │pending_     │     │  │
│  │  │             │  │   _ledger   │  │  payouts    │     │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTP API Calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVATE VPS API                              │
│                    (kwuo.gobuyme.shop)                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PAYMENT ORCHESTRATION API                    │  │
│  │                                                          │  │
│  │  1. POST /api/calculate-commission                       │  │
│  │     (called when order created)                          │  │
│  │                                                          │  │
│  │  2. POST /api/initiate-vendor-payout                     │  │
│  │     (called when order confirmed)                        │  │
│  │                                                          │  │
│  │  3. POST /api/initiate-agent-payout                     │  │
│  │     (called when order delivered)                       │  │
│  │                                                          │  │
│  │  4. POST /api/process-batch-payouts                     │  │
│  │     (scheduled daily at 12:00 AM UTC)                   │  │
│  │                                                          │  │
│  │  5. POST /api/paystack-webhook                          │  │
│  │     (receives Paystack webhook events)                  │  │
│  │                                                          │  │
│  │  6. POST /api/verify-account                             │  │
│  │     (verifies bank account details)                     │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           CRON SCHEDULER (VPS)                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Daily Batch Payout Job (12:00 AM UTC daily)      │  │  │
│  │  │  Calls: POST /api/process-batch-payouts            │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PAYSTACK API                                  │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  Payment API     │  │  Transfer API    │                   │
│  │  (Incoming)      │  │  (Outgoing)      │                   │
│  └──────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            MONITORING & LOGGING                                  │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ Cloud Logging    │  │  Error Reporting │                   │
│  │                  │  │  (Alerts)        │                   │
│  └──────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Payment Flow Sequence

### 2.1 Customer Payment Flow

```
1. Customer initiates order in React Native app
   ↓
2. Frontend calls Paystack payment API (direct or via VPS API)
   ↓
3. Customer completes payment on Paystack
   ↓
4. Paystack sends webhook to VPS API: POST /api/paystack-webhook
   ↓
5. VPS Webhook handler:
   - Verifies webhook signature
   - Creates transaction_ledger entry (status: payment_received)
   - Updates order status to "confirmed"
   - Calls POST /api/calculate-commission (if not already calculated)
   ↓
6. Frontend/Backend calls VPS API: POST /api/initiate-vendor-payout
   (when order status changes to "confirmed")
   ↓
7. Vendor payout task created in pending_payouts collection
```

### 2.2 Vendor Payout Flow

```
1. Order confirmed → Frontend/Backend calls VPS API: POST /api/initiate-vendor-payout
   ↓
2. VPS API commission calculation engine calculates vendor share
   ↓
3. Payout task created in pending_payouts (type: vendor, status: pending)
   ↓
4. VPS Cron job triggers at 12:00 AM UTC → POST /api/process-batch-payouts:
   - Queries pending vendor payouts from last 24 hours
   - Aggregates by vendor_id (sum of all vendor shares)
   - Creates bulk transfer via Paystack Transfer API
   - Updates transaction_ledger (status: vendor_paid)
   - Marks payout tasks as processed
   ↓
5. Paystack sends transfer webhook → POST /api/paystack-webhook
   ↓
6. VPS Webhook handler updates transaction_ledger with transfer status
```

### 2.3 Delivery Agent Payout Flow

```
1. Order marked "delivered" → Frontend/Backend calls VPS API: POST /api/initiate-agent-payout
   ↓
2. VPS API commission calculation engine calculates agent share (15% of delivery_fee)
   ↓
3. Payout task created in pending_payouts (type: agent, status: pending)
   ↓
4. VPS Cron job triggers at 12:00 AM UTC → POST /api/process-batch-payouts:
   - Queries pending agent payouts from last 24 hours
   - Aggregates by agent_id (sum of all agent shares)
   - Creates bulk transfer via Paystack Transfer API
   - Updates transaction_ledger (status: agent_paid)
   - Marks payout tasks as processed
   ↓
5. Paystack sends transfer webhook → POST /api/paystack-webhook
   ↓
6. VPS Webhook handler updates transaction_ledger with transfer status
```

---

## 3. Commission Calculation Logic

### Vendor Commission Structure (Tiered Subscription)

- **Tier 1 Vendors**: 7.5% commission of order value
- **Tier 2 Vendors**: 3% commission of order value
- **Vendor Share**: Order Value - Commission (based on tier)

### Delivery Agent Commission Structure

- **Agent Commission**: 15% of delivery fee
- **Agent Share**: 15% × delivery_fee

### Platform Revenue

- **Platform Commission**: Vendor Commission (7.5% for Tier 1, 3% for Tier 2) + (Delivery Fee - Agent Share)

### Example Calculation

```
Order Details:
- Order Value: ₦10,000
- Delivery Fee: ₦500

Vendor Commission (Tier 1 example):
- Commission Rate: 7.5%
- Total Vendor Commission: ₦750
- Vendor Share: ₦10,000 - ₦750 = ₦9,250

Vendor Commission (Tier 2 example):
- Commission Rate: 3%
- Total Vendor Commission: ₦300
- Vendor Share: ₦10,000 - ₦300 = ₦9,700

Agent Commission:
- Agent Share (15% of delivery fee): ₦75

Platform Revenue:
- Vendor Commission: ₦1,050
- Remaining Delivery Fee: ₦500 - ₦75 = ₦425
- Total Platform Revenue: ₦1,475
```

---

## 4. Scalability Considerations

### Firestore Performance Optimization

- Composite indexes on `pending_payouts` collection:

  - `status + type + createdAt` (for batch querying)
  - `vendorId + status + createdAt` (for vendor-specific queries)
  - `agentId + status + createdAt` (for agent-specific queries)

- Batch size limits:
  - Firestore read: 500 documents per batch
  - Paystack Transfer API: Individual transfers per recipient
  - Process in chunks of 100 payout tasks per execution

### VPS API Scaling

- Configure appropriate server resources (CPU, RAM) for batch processing
- Set timeout limits (540s for batch operations)
- Enable retries with exponential backoff
- Use job queues (Redis/Bull) for long-running batch operations
- Implement horizontal scaling with load balancer if needed
- Monitor API response times and server resources

### Rate Limiting & Quotas

- Paystack Transfer API: Monitor rate limits
- Implement queueing system using Cloud Tasks for high-volume periods
- Distribute batch processing across multiple function invocations

---

## 5. Security & Compliance

### Authentication & Authorization

- VPS API endpoints require Firebase Auth tokens (passed in Authorization header)
- Webhook handler verifies Paystack webhook signature
- Environment variables for sensitive keys (Paystack secret, Firebase Admin SDK)
- API rate limiting to prevent abuse
- IP whitelisting for webhook endpoints (optional)

### Idempotency

- Idempotency keys for all Paystack Transfer requests
- Based on: `{recipient_id}_{date}_{batch_number}`
- Prevents duplicate payouts on retries

### Audit Trail

- Complete transaction ledger maintains full audit history
- All financial events logged with timestamps
- Failed transactions logged in `failed_payouts` collection

### Data Encryption

- Firestore data encrypted at rest (default)
- HTTPS for all API communications (SSL/TLS certificates on VPS)
- Paystack secret key stored in secure environment variables on VPS
- Firebase Admin SDK credentials stored securely on VPS

---

## 6. Error Handling & Resilience

### Retry Strategy

- Exponential backoff for Paystack API failures
- Max 3 retries for transient errors
- Dead-letter queue for permanently failed payouts

### Failure Scenarios

1. **Paystack API Failure**:

   - Log error to VPS logs / monitoring system
   - Mark payout task as `failed`
   - Retry in next batch run
   - Alert if failure persists > 24 hours

2. **Webhook Delivery Failure**:

   - Implement webhook retry mechanism
   - Manual reconciliation process available

3. **Partial Batch Failure**:
   - Track individual transfer status
   - Retry only failed transfers
   - Maintain idempotency

### Monitoring & Alerts

- VPS logging system for all financial operations
- Error tracking and reporting (e.g., Sentry, LogRocket)
- Monitoring alerts for:
  - High payout failure rate (> 5%)
  - Unprocessed payouts > 48 hours
  - Financial discrepancies detected
  - API response times
  - Server resource usage

---

## 7. Cost Optimization

### Firestore Reads/Writes

- Batch writes minimize write operations
- Composite indexes reduce query costs
- Efficient pagination for large datasets

### VPS API Optimization

- Optimize API endpoint execution time
- Use job queues for deferrable operations
- Implement caching where appropriate
- Monitor and optimize database queries

### Paystack Fees

- Aggregate payouts to minimize transfer fees
- Daily batch processing reduces API calls

---

## Next Steps

1. Review and implement data models (see `DATA_MODELS.md`)
2. Set up VPS API endpoints (see `API_ENDPOINTS.md`)
3. Configure Firestore indexes (see `firestore.indexes.json`)
4. Set up Cron scheduler on VPS for daily batch processing
5. Configure monitoring and alerts (see `MONITORING.md`)
6. Configure Paystack webhook URL to point to VPS API
