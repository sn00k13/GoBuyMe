# Firestore Data Models

## Transaction Ledger & Payout System Schemas

---

## 1. Transaction Ledger (`transaction_ledger`)

**Purpose**: Single source of truth for every financial event in the system.

### Document Structure

```javascript
{
  // Document ID: auto-generated or order_id (if 1:1 with orders)
  orderId: string,                    // Reference to orders collection
  orderValue: number,                 // Total order amount (in kobo/smallest currency unit)
  deliveryFee: number,                // Delivery fee amount
  paymentStatus: string,              // "payment_received" | "payment_failed" | "refunded"
  vendorId: string,                   // Reference to restaurants collection
  vendorTier: number,                 // Restaurant subscription tier (1 or 2)
  agentId: string | null,             // Reference to agents collection (null if not assigned)

  // Commission Breakdown
  vendorCommission: {
    tier: number,                     // Vendor subscription tier (1 or 2)
    commissionRate: number,           // 0.075 for Tier 1, 0.03 for Tier 2
    totalCommission: number,          // Commission based on tier
    vendorShare: number               // orderValue - totalCommission
  },

  agentCommission: {
    agentShare: number,               // 15% of deliveryFee
    commissionRate: number            // 0.15 (for reference)
  },

  platformRevenue: {
    vendorCommission: number,         // From vendor commission
    deliveryFeeRemainder: number,     // deliveryFee - agentShare
    totalRevenue: number              // Sum of vendorCommission + deliveryFeeRemainder
  },

  // Payout Status Tracking
  payoutStatus: {
    vendor: {
      status: string,                 // "pending" | "processing" | "paid" | "failed"
      payoutTaskId: string | null,    // Reference to pending_payouts
      transferId: string | null,      // Paystack transfer reference
      transferCode: string | null,    // Paystack transfer code
      paidAt: timestamp | null,       // When payout was completed
      failureReason: string | null    // If failed, reason for failure
    },
    agent: {
      status: string,                 // "pending" | "processing" | "paid" | "failed"
      payoutTaskId: string | null,
      transferId: string | null,
      transferCode: string | null,
      paidAt: timestamp | null,
      failureReason: string | null
    }
  },

  // Metadata
  paymentProvider: string,            // "paystack"
  paymentReference: string,           // Paystack payment reference
  currency: string,                   // "NGN" (or other supported currencies)
  createdAt: timestamp,               // When transaction was created
  updatedAt: timestamp,               // Last update timestamp
  calculatedAt: timestamp,            // When commission was calculated

  // Webhook Tracking
  webhookEvents: array,               // Array of webhook events received
  /*
    [
      {
        eventType: string,            // "payment.success" | "transfer.success" | "transfer.failed"
        receivedAt: timestamp,
        paystackEventId: string,
        data: object                  // Paystack event data
      }
    ]
  */
}
```

### Collection Indexes Required

```json
{
	"indexes": [
		{
			"collectionGroup": "transaction_ledger",
			"queryScope": "COLLECTION",
			"fields": [
				{ "fieldPath": "paymentStatus", "order": "ASCENDING" },
				{ "fieldPath": "createdAt", "order": "DESCENDING" }
			]
		},
		{
			"collectionGroup": "transaction_ledger",
			"queryScope": "COLLECTION",
			"fields": [
				{ "fieldPath": "vendorId", "order": "ASCENDING" },
				{ "fieldPath": "payoutStatus.vendor.status", "order": "ASCENDING" },
				{ "fieldPath": "createdAt", "order": "DESCENDING" }
			]
		},
		{
			"collectionGroup": "transaction_ledger",
			"queryScope": "COLLECTION",
			"fields": [
				{ "fieldPath": "agentId", "order": "ASCENDING" },
				{ "fieldPath": "payoutStatus.agent.status", "order": "ASCENDING" },
				{ "fieldPath": "createdAt", "order": "DESCENDING" }
			]
		}
	]
}
```

---

## 2. Pending Payouts (`pending_payouts`)

**Purpose**: Queue of payout tasks awaiting batch processing.

### Document Structure

```javascript
{
  // Document ID: auto-generated
  transactionId: string,              // Reference to transaction_ledger
  orderId: string,                    // Reference to orders collection
  recipientType: string,              // "vendor" | "agent"
  recipientId: string,                // vendorId or agentId

  // Payout Details
  amount: number,                     // Amount to pay out (in kobo/smallest currency unit)
  currency: string,                   // "NGN"

  // Status Tracking
  status: string,                     // "pending" | "processing" | "completed" | "failed"
  priority: number,                   // 1 (normal) | 2 (high) | 3 (urgent)

  // Batch Processing
  batchId: string | null,             // Reference to batch_payouts collection
  batchDate: timestamp | null,        // Date of batch processing
  processingAttempts: number,         // Number of processing attempts (max 3)

  // Paystack Transfer Details
  transferId: string | null,          // Paystack transfer reference
  transferCode: string | null,        // Paystack transfer code
  idempotencyKey: string,             // Unique key for idempotency: "{recipientId}_{date}_{batchNumber}"

  // Recipient Bank Details (from vendor/agent profile)
  recipientDetails: {
    accountNumber: string,
    bankCode: string,
    accountName: string,
    bankName: string | null           // Resolved from bank code
  },

  // Timestamps
  createdAt: timestamp,               // When payout task was created
  processedAt: timestamp | null,      // When payout was processed
  completedAt: timestamp | null,      // When payout was confirmed complete
  failedAt: timestamp | null,         // When payout permanently failed

  // Error Handling
  errorMessage: string | null,        // Last error message
  errorCode: string | null,           // Error code from Paystack
  retryAfter: timestamp | null,       // When to retry if failed

  // Metadata
  reason: string,                     // "order_confirmed" | "order_delivered"
  sourceEvent: string                 // Original event that triggered this payout
}
```

### Collection Indexes Required

```json
{
	"indexes": [
		{
			"collectionGroup": "pending_payouts",
			"queryScope": "COLLECTION",
			"fields": [
				{ "fieldPath": "status", "order": "ASCENDING" },
				{ "fieldPath": "recipientType", "order": "ASCENDING" },
				{ "fieldPath": "createdAt", "order": "ASCENDING" }
			]
		},
		{
			"collectionGroup": "pending_payouts",
			"queryScope": "COLLECTION",
			"fields": [
				{ "fieldPath": "recipientId", "order": "ASCENDING" },
				{ "fieldPath": "status", "order": "ASCENDING" },
				{ "fieldPath": "createdAt", "order": "DESCENDING" }
			]
		},
		{
			"collectionGroup": "pending_payouts",
			"queryScope": "COLLECTION",
			"fields": [
				{ "fieldPath": "batchId", "order": "ASCENDING" },
				{ "fieldPath": "status", "order": "ASCENDING" }
			]
		}
	]
}
```

---

## 3. Batch Payouts (`batch_payouts`)

**Purpose**: Track daily batch processing runs and their results.

### Document Structure

```javascript
{
  // Document ID: batch_{YYYYMMDD}_{type} (e.g., batch_20240115_vendor)
  batchDate: timestamp,               // Date of batch (normalized to UTC midnight)
  batchType: string,                  // "vendor" | "agent" | "combined"
  batchNumber: number,                // Sequential batch number for the day

  // Processing Status
  status: string,                     // "pending" | "processing" | "completed" | "partial" | "failed"
  startedAt: timestamp,               // When batch processing started
  completedAt: timestamp | null,      // When batch processing completed
  duration: number | null,            // Processing duration in seconds

  // Aggregation Summary
  totalPayouts: number,               // Total number of payout tasks in batch
  totalAmount: number,                // Total amount to pay out
  uniqueRecipients: number,           // Number of unique vendors/agents

  // Aggregated Payouts (grouped by recipient)
  aggregatedPayouts: array,           // Pre-aggregated payouts ready for transfer
  /*
    [
      {
        recipientId: string,
        recipientType: string,
        totalAmount: number,
        payoutTaskIds: array,         // IDs of pending_payouts docs
        recipientDetails: {
          accountNumber: string,
          bankCode: string,
          accountName: string,
          bankName: string
        }
      }
    ]
  */

  // Processing Results
  results: {
    successful: number,               // Number of successful transfers
    failed: number,                   // Number of failed transfers
    totalProcessed: number            // successful + failed
  },

  // Paystack Transfer References
  transferReferences: array,          // Array of Paystack transfer codes/references
  /*
    [
      {
        recipientId: string,
        transferCode: string,
        amount: number,
        status: string,
        paystackResponse: object
      }
    ]
  */

  // Error Handling
  errors: array,                      // Array of errors encountered
  /*
    [
      {
        recipientId: string,
        errorMessage: string,
        errorCode: string,
        retryable: boolean
      }
    ]
  */

  // Metadata
  functionExecutionId: string,        // Cloud Function execution ID
  logsUrl: string | null,             // Link to Cloud Logging for this batch
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 4. Failed Payouts (`failed_payouts`)

**Purpose**: Dead-letter queue for permanently failed payouts requiring manual review.

### Document Structure

```javascript
{
  // Document ID: auto-generated
  payoutTaskId: string,               // Reference to pending_payouts
  transactionId: string,              // Reference to transaction_ledger
  orderId: string,
  recipientType: string,              // "vendor" | "agent"
  recipientId: string,
  amount: number,

  // Failure Details
  failureReason: string,              // Human-readable reason
  errorCode: string,                  // Paystack error code
  errorMessage: string,               // Full error message
  failureCount: number,               // Number of times this payout failed
  lastAttemptedAt: timestamp,         // Last processing attempt timestamp

  // Manual Review
  reviewStatus: string,               // "pending" | "in_review" | "resolved" | "escalated"
  reviewedBy: string | null,          // Admin user ID who reviewed
  reviewedAt: timestamp | null,
  resolution: string | null,          // How it was resolved
  notes: string | null,               // Admin notes

  // Original Data (for reconciliation)
  originalPayoutData: object,         // Snapshot of pending_payouts document
  transactionSnapshot: object,        // Snapshot of transaction_ledger at time of failure

  createdAt: timestamp,               // When moved to failed_payouts
  updatedAt: timestamp
}
```

---

## 5. Order Collection Updates

**Note**: The existing `orders` collection should include these fields for payment orchestration:

```javascript
{
  // ... existing order fields ...

  // Payment Status
  paymentStatus: string,              // "pending" | "paid" | "failed" | "refunded"
  paymentReference: string | null,    // Paystack payment reference

  // Transaction Reference
  transactionLedgerId: string | null, // Reference to transaction_ledger

  // Order Status (for payout triggers)
  status: string,                     // "pending" | "confirmed" | "preparing" | "ready" | "in_transit" | "delivered" | "cancelled"

  // Vendor/Restaurant Reference
  vendorId: string,                   // Reference to restaurants collection (or restaurantId)
  restaurantId: string,               // Alternative field name

  // Agent Reference
  agentId: string | null,             // Reference to agents collection

  // Timestamps
  confirmedAt: timestamp | null,      // When order was confirmed (triggers restaurant payout)
  deliveredAt: timestamp | null,      // When order was delivered (triggers agent payout)

  // ... other existing fields ...
}
```

---

## 6. Restaurant Collection Extensions

Restaurants (vendors) should have bank account details stored:

```javascript
{
  // ... existing restaurant fields ...

  tier: number,                       // Subscription tier: 1 (7.5%) or 2 (3%)
  subscriptionTier: number,           // Alternative field name (same as tier)

  payoutDetails: {
    accountNumber: string,
    bankCode: string,
    accountName: string,              // Verified account name
    bankName: string | null,          // Resolved bank name
    verified: boolean,                // Whether account has been verified
    verifiedAt: timestamp | null,
    recipientCode: string | null      // Paystack recipient code (if created)
  },

  payoutEnabled: boolean,             // Whether payouts are enabled for this vendor
  payoutSchedule: string,             // "daily" | "weekly" | "monthly" (default: daily)

  // ... other existing fields ...
}
```

---

## 7. Agents Collection Extensions

Agents should have bank account details stored:

```javascript
{
  // ... existing agent fields ...

  payoutDetails: {
    accountNumber: string,
    bankCode: string,
    accountName: string,              // Verified account name
    bankName: string | null,
    verified: boolean,
    verifiedAt: timestamp | null,
    recipientCode: string | null      // Paystack recipient code (if created)
  },

  payoutEnabled: boolean,             // Whether payouts are enabled for this agent
  payoutSchedule: string,             // "daily" | "weekly" | "monthly" (default: daily)

  // ... other existing fields ...
}
```

---

## Data Model Relationships

```
orders (1) ──────── (1) transaction_ledger
  │                    │
  │                    ├── (1) pending_payouts (vendor)
  │                    └── (1) pending_payouts (agent)
  │
  ├── (N) batch_payouts (aggregated)
  └── (N) failed_payouts (if failed)

restaurants (1) ──────── (N) pending_payouts
agents (1) ─── (N) pending_payouts
```

---

## Best Practices

1. **Always store amounts in smallest currency unit** (kobo for NGN) to avoid floating-point errors
2. **Use Firestore timestamps** for all date/time fields
3. **Maintain referential integrity** - use transaction batches where possible
4. **Index frequently queried fields** to optimize performance
5. **Archive old transaction_ledger entries** to a separate collection after 1 year for cost optimization
6. **Validate recipient bank details** before creating payout tasks
7. **Use composite indexes** for multi-field queries to reduce read costs
