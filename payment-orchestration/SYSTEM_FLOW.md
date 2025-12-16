# System Flow Diagrams
## Payment Orchestration & Automated Payouts

---

## 1. Customer Payment Flow

```
┌─────────────────┐
│  React Native   │
│   Customer App  │
└────────┬────────┘
         │
         │ 1. Customer initiates payment
         │    (Order Total: ₦100.00)
         ▼
┌─────────────────┐
│  Paystack API   │
│  Payment Page   │
└────────┬────────┘
         │
         │ 2. Customer completes payment
         │    Payment Reference: PAY_12345
         ▼
┌─────────────────────────────────────────┐
│  VPS API: POST /api/paystack-webhook    │
│                                         │
│  - Verifies webhook signature           │
│  - Processes charge.success event       │
│  - Updates transaction_ledger           │
└────────┬────────────────────────────────┘
         │
         │ 3. Create/Update transaction_ledger
         │    Status: payment_received
         ▼
┌─────────────────────────────────────────┐
│  Transaction Ledger                     │
│  (transaction_ledger collection)        │
│                                         │
│  orderId: ORDER_123                     │
│  orderValue: 10000 (kobo)               │
│  deliveryFee: 500 (kobo)                │
│  paymentStatus: payment_received        │
│  paymentReference: PAY_12345            │
│  vendorCommission: { ... }              │
│  agentCommission: { ... }               │
│  platformRevenue: { ... }               │
└────────┬────────────────────────────────┘
         │
         │ 4. Update order status
         ▼
┌─────────────────────────────────────────┐
│  Orders Collection                      │
│  (orders collection)                    │
│                                         │
│  status: confirmed                      │
│  paymentStatus: paid                    │
│  paymentReference: PAY_12345            │
│  confirmedAt: 2024-01-15T10:00:00Z     │
└─────────────────────────────────────────┘
```

---

## 2. Vendor Payout Flow

```
┌─────────────────────────────────────────┐
│  Orders Collection                      │
│  status: "confirmed"                    │
│  paymentStatus: "paid"                  │
└────────┬────────────────────────────────┘
         │
         │ Frontend/Backend calls VPS API
         │ POST /api/initiate-vendor-payout
         │ (when status changes to "confirmed")
         ▼
┌─────────────────────────────────────────┐
│  VPS API: Initiate Vendor Payout         │
│                                         │
│  - Reads transaction_ledger             │
│  - Gets vendor payout details           │
│  - Calculates vendor share              │
│  - Creates payout task                  │
└────────┬────────────────────────────────┘
         │
         │ Create payout task
         ▼
┌─────────────────────────────────────────┐
│  Pending Payouts                        │
│  (pending_payouts collection)           │
│                                         │
│  recipientType: "vendor"                │
│  recipientId: "vendor_123"              │
│  amount: 8950 (₦89.50)                  │
│  status: "pending"                      │
│  recipientDetails: {                    │
│    accountNumber: "0123456789"          │
│    bankCode: "044"                      │
│    accountName: "Vendor Name"           │
│  }                                      │
└─────────────────────────────────────────┘
         │
         │ Wait for daily batch (12:00 AM UTC)
         ▼
┌─────────────────────────────────────────┐
│  VPS Cron Job → POST /api/process-      │
│  batch-payouts                          │
│                                         │
│  Scheduled: Every day at 12:00 AM UTC   │
└────────┬────────────────────────────────┘
         │
         │ 1. Query pending payouts (last 24h)
         │ 2. Aggregate by recipient
         │ 3. Create Paystack transfers
         ▼
┌─────────────────────────────────────────┐
│  Payout Aggregation                     │
│                                         │
│  vendor_123:                            │
│    - Order 1: ₦89.50                    │
│    - Order 2: ₦150.00                   │
│    - Order 3: ₦75.25                    │
│    Total: ₦314.75                       │
└────────┬────────────────────────────────┘
         │
         │ Execute aggregated transfer
         ▼
┌─────────────────────────────────────────┐
│  Paystack Transfer API                  │
│                                         │
│  POST /transfer                         │
│  - recipient: RCP_xxxxx                 │
│  - amount: 31475 (kobo)                 │
│  - reference: payout_vendor_123_...     │
│  - reason: "Daily vendor payout"        │
└────────┬────────────────────────────────┘
         │
         │ Transfer queued
         │ Transfer Code: TRF_yyyyy
         ▼
┌─────────────────────────────────────────┐
│  Update Pending Payouts                 │
│                                         │
│  status: "processing"                   │
│  transferCode: "TRF_yyyyy"              │
│  batchId: "batch_20240115_vendor_..."   │
│  processedAt: 2024-01-15T00:00:00Z     │
└────────┬────────────────────────────────┘
         │
         │ Wait for Paystack webhook
         │ (Transfer completes ~ 1-2 minutes)
         ▼
┌─────────────────────────────────────────┐
│  Paystack Transfer Webhook              │
│  Event: transfer.success                │
└────────┬────────────────────────────────┘
         │
         │ Process webhook
         ▼
┌─────────────────────────────────────────┐
│  Paystack Webhook Handler               │
│  (paystackWebhookHandler)               │
│                                         │
│  - Verifies webhook signature           │
│  - Updates pending_payouts              │
│  - Updates transaction_ledger           │
└────────┬────────────────────────────────┘
         │
         │ Final status update
         ▼
┌─────────────────────────────────────────┐
│  Final Status                           │
│                                         │
│  pending_payouts:                       │
│    status: "completed"                  │
│    completedAt: 2024-01-15T00:02:00Z   │
│                                         │
│  transaction_ledger:                    │
│    payoutStatus.vendor.status: "paid"   │
│    payoutStatus.vendor.transferCode:    │
│      "TRF_yyyyy"                        │
│    payoutStatus.vendor.paidAt:          │
│      2024-01-15T00:02:00Z              │
└─────────────────────────────────────────┘
```

---

## 3. Delivery Agent Payout Flow

```
┌─────────────────────────────────────────┐
│  Orders Collection                      │
│  status: "delivered"                    │
│  agentId: "agent_456"                   │
└────────┬────────────────────────────────┘
         │
         │ Frontend/Backend calls VPS API
         │ POST /api/initiate-agent-payout
         │ (when status changes to "delivered")
         ▼
┌─────────────────────────────────────────┐
│  VPS API: Initiate Agent Payout         │
│                                         │
│  - Reads transaction_ledger             │
│  - Gets agent payout details            │
│  - Calculates agent share (15% fee)     │
│  - Creates payout task                  │
└────────┬────────────────────────────────┘
         │
         │ Create payout task
         ▼
┌─────────────────────────────────────────┐
│  Pending Payouts                        │
│  (pending_payouts collection)           │
│                                         │
│  recipientType: "agent"                 │
│  recipientId: "agent_456"               │
│  amount: 75 (₦0.75)                     │
│  status: "pending"                      │
│  reason: "order_delivered"              │
└─────────────────────────────────────────┘
         │
         │ Same batch processing flow as vendor
         │ (Daily at 12:00 AM UTC)
         ▼
[Continues with same batch processor flow as vendor]
```

---

## 4. Commission Calculation Flow

```
┌─────────────────────────────────────────┐
│  Orders Collection                      │
│  onCreate Event                         │
│                                         │
│  orderId: ORDER_123                     │
│  total: 10000 (kobo)                    │
│  deliveryFee: 500 (kobo)                │
│  vendorId: "vendor_123"                 │
└────────┬────────────────────────────────┘
         │
         │ Frontend/Backend calls VPS API
         │ POST /api/calculate-commission
         │ (when order is created)
         ▼
┌─────────────────────────────────────────┐
│  VPS API: Commission Calculator          │
│                                         │
│  1. Extract order details               │
│  2. Fetch vendor tier from vendor doc   │
│  3. Calculate vendor commission:        │
│     - Tier 1: 7.5% = ₦7.50              │
│     - Tier 2: 3% = ₦3.00                │
│     - Vendor Share: ₦92.50 (Tier 1)     │
│                    or ₦97.00 (Tier 2)   │
│                                         │
│  3. Calculate agent commission:         │
│     - 15% of delivery fee = ₦0.75       │
│                                         │
│  4. Calculate platform revenue:         │
│     - Vendor commission: ₦7.50 (Tier 1) │
│                    or ₦3.00 (Tier 2)    │
│     - Fee remainder: ₦4.25              │
│     - Total: ₦11.75 (Tier 1)           │
│              or ₦7.25 (Tier 2)         │
└────────┬────────────────────────────────┘
         │
         │ Create/Update transaction_ledger
         ▼
┌─────────────────────────────────────────┐
│  Transaction Ledger                     │
│  (transaction_ledger collection)        │
│                                         │
│  vendorCommission: {                    │
│    tier: 1                              │
│    commissionRate: 0.075                │
│    totalCommission: 750                 │
│    vendorShare: 9250                    │
│  }                                      │
│                                         │
│  agentCommission: {                     │
│    agentShare: 75                       │
│    commissionRate: 0.15                 │
│  }                                      │
│                                         │
│  platformRevenue: {                     │
│    vendorCommission: 750                │
│    deliveryFeeRemainder: 425            │
│    totalRevenue: 1175                   │
│  }                                      │
│                                         │
│  calculatedAt: 2024-01-15T10:00:00Z    │
└─────────────────────────────────────────┘
```

---

## 5. Batch Processing Flow

```
┌─────────────────────────────────────────┐
│  VPS Cron Scheduler                     │
│  Daily at 12:00 AM UTC                  │
└────────┬────────────────────────────────┘
         │
         │ HTTP POST Request
         ▼
┌─────────────────────────────────────────┐
│  VPS API: POST /api/process-batch-      │
│  payouts                                │
└────────┬────────────────────────────────┘
         │
         │ Step 1: Query pending payouts
         │ (Last 24 hours)
         ▼
┌─────────────────────────────────────────┐
│  Query: pending_payouts                 │
│  WHERE status = "pending"               │
│    AND createdAt >= yesterday           │
│  ORDER BY createdAt ASC                 │
└────────┬────────────────────────────────┘
         │
         │ Step 2: Aggregate by recipient
         ▼
┌─────────────────────────────────────────┐
│  Aggregation Result                     │
│                                         │
│  vendor_123: 3 payouts = ₦314.75        │
│  vendor_456: 5 payouts = ₦550.00        │
│  agent_789: 10 payouts = ₦7.50          │
│  agent_012: 8 payouts = ₦6.00           │
│  ...                                    │
└────────┬────────────────────────────────┘
         │
         │ Step 3: Create batch document
         ▼
┌─────────────────────────────────────────┐
│  Batch Payouts                          │
│  (batch_payouts collection)             │
│                                         │
│  batchId: batch_20240115_vendor_123     │
│  batchType: "vendor"                    │
│  status: "processing"                   │
│  totalPayouts: 8                        │
│  totalAmount: 86475 (kobo)              │
│  uniqueRecipients: 2                    │
└────────┬────────────────────────────────┘
         │
         │ Step 4: Process each recipient
         │ (In batches of 10)
         ▼
┌─────────────────────────────────────────┐
│  For each aggregated payout:            │
│                                         │
│  1. Ensure Paystack recipient exists    │
│  2. Generate idempotency key            │
│  3. Check idempotency (prevent dups)    │
│  4. Create Paystack transfer            │
│  5. Update pending_payouts              │
│  6. Update transaction_ledger           │
└────────┬────────────────────────────────┘
         │
         │ Step 5: Update batch status
         ▼
┌─────────────────────────────────────────┐
│  Batch Payouts Update                   │
│                                         │
│  status: "completed" | "partial" |      │
│           "failed"                       │
│  results: {                             │
│    successful: 2                        │
│    failed: 0                            │
│  }                                      │
│  transferReferences: [ ... ]            │
│  errors: []                             │
│  completedAt: 2024-01-15T00:05:00Z     │
└─────────────────────────────────────────┘
```

---

## 6. Error Handling Flow

```
┌─────────────────────────────────────────┐
│  Payout Processing Attempt              │
└────────┬────────────────────────────────┘
         │
         │ Try Paystack Transfer
         ▼
    ┌────────┐
    │ Success│
    └────┬───┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────────────────┐
│Update  │ │    Failed Transfer       │
│Status  │ │                          │
│to      │ │  errorCode: INSUFFICIENT │
│"paid"  │ │           _BALANCE       │
└────────┘ └────────┬─────────────────┘
                    │
                    │ Check retry count
                    ▼
              ┌──────────┐
              │ < 3 tries│
              └────┬─────┘
                   │
              ┌────┴────┐
              │         │
              ▼         ▼
        ┌─────────┐ ┌──────────────────┐
        │ Retry   │ │  Mark as failed  │
        │ with    │ │  Update:         │
        │ backoff │ │  - status: failed│
        │         │ │  - failedAt      │
        └────┬────┘ │  - errorMessage  │
             │      └────────┬─────────┘
             │               │
             │               │ Max retries?
             │               │ (3 attempts)
             │               │
             │          ┌────┴────┐
             │          │         │
             │          ▼         ▼
             │    ┌─────────┐ ┌────────────────┐
             │    │ Move to │ │  Wait for next │
             │    │ failed_ │ │  batch run     │
             │    │ payouts │ │                │
             │    │ (DLQ)   │ │  Retry in 24h  │
             │    └─────────┘ └────────────────┘
             │
             │ Continue processing
             ▼
      [Process next payout]
```

---

## 7. Webhook Processing Flow

```
┌─────────────────────────────────────────┐
│  Paystack Webhook Event                 │
│                                         │
│  Event: charge.success |                │
│         transfer.success |              │
│         transfer.failed                 │
└────────┬────────────────────────────────┘
         │
         │ POST to webhook handler
         ▼
┌─────────────────────────────────────────┐
│  VPS API: POST /api/paystack-webhook    │
│                                         │
│  1. Verify webhook signature            │
│     (X-Paystack-Signature header)       │
│                                         │
│  2. Extract event type                  │
└────────┬────────────────────────────────┘
         │
         │ Route by event type
         ▼
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────────────────┐
│Payment │ │   Transfer Events        │
│Events  │ │                          │
│        │ │  - transfer.success      │
│- charge│ │  - transfer.failed       │
│  .     │ │  - transfer.reversed     │
│  success│ │                          │
│- charge│ │                          │
│  .     │ │                          │
│  failed│ │                          │
└────┬───┘ └────────┬─────────────────┘
     │              │
     │              │
     ▼              ▼
┌─────────────────────────────┐
│  Update Transaction Ledger  │
│                             │
│  - paymentStatus            │
│  - payoutStatus.vendor      │
│  - payoutStatus.agent       │
│  - webhookEvents[]          │
└─────────────────────────────┘
     │              │
     │              │
     ▼              ▼
┌─────────────────────────────┐
│  Update Pending Payouts     │
│                             │
│  - status: completed        │
│  - transferCode             │
│  - completedAt              │
└─────────────────────────────┘
     │              │
     │              │
     ▼              ▼
┌─────────────────────────────┐
│  Update Orders (if needed)  │
│                             │
│  - paymentStatus            │
└─────────────────────────────┘
     │              │
     │              │
     ▼              ▼
┌─────────────────────────────┐
│  Return 200 OK              │
│  (Acknowledge webhook)      │
└─────────────────────────────┘
```

---

## Key Timestamps & Scheduling

### Daily Schedule

```
00:00 UTC - Daily batch payout processor runs
  ├─ Process vendor payouts (last 24h)
  └─ Process agent payouts (last 24h)

00:02 UTC - Batch processing completes (typical)
  ├─ Paystack transfers queued
  └─ Status: "processing"

00:03 UTC - Paystack transfers complete
  ├─ Webhooks received
  └─ Status: "completed"
```

### Order Lifecycle

```
T+0:00 - Order created
  └─ Commission calculated

T+0:05 - Payment received
  └─ Transaction ledger updated

T+0:10 - Order confirmed
  └─ Vendor payout task created

T+24:00 - Daily batch processes vendor payout

T+60:00 - Order delivered
  └─ Agent payout task created

T+84:00 - Daily batch processes agent payout
```

---

**Note**: These diagrams represent the ideal flow. In practice, webhooks may arrive asynchronously, and batch processing times may vary based on volume.

