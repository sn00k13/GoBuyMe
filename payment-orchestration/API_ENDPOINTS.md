# VPS API Endpoints Reference
## Payment Orchestration System

This document outlines all required API endpoints that must be implemented on your VPS at `https://kwuo.gobuyme.shop`.

---

## Base URL

```
https://kwuo.gobuyme.shop
```

---

## Authentication

All endpoints (except webhooks) require Firebase Authentication token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

---

## 1. Calculate Commission

**Endpoint**: `POST /api/calculate-commission`

**Description**: Calculates commission breakdown when an order is created.

**Request Body**:
```json
{
  "orderId": "order_123",
  "orderValue": 10000,        // in kobo
  "deliveryFee": 500,         // in kobo
  "vendorId": "vendor_456",  // null for store orders
  "storeId": null,            // set for store orders (no vendor payout)
  "agentId": "agent_789",     // optional, null if not assigned
  "isStoreOrder": false       // true for store orders (no vendor payout)
}
```

**Note**: 
- For **restaurant orders**: Set `vendorId` and `isStoreOrder: false`. Vendor commission will be calculated.
- For **store orders**: Set `storeId`, `vendorId: null`, and `isStoreOrder: true`. Only platform and agent commissions will be calculated (no vendor payout).

**Response** (200 OK):
```json
{
  "success": true,
  "transactionLedgerId": "ledger_123",
  "commission": {
    "vendorCommission": {
      "tier": 1,
      "commissionRate": 0.075,
      "totalCommission": 750,
      "vendorShare": 9250
    },
    "agentCommission": {
      "agentShare": 75,
      "commissionRate": 0.15
    },
    "platformRevenue": {
      "vendorCommission": 750,
      "deliveryFeeRemainder": 425,
      "totalRevenue": 1175
    }
  }
}
```

**Error Response** (400/500):
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 2. Initiate Vendor Payout

**Endpoint**: `POST /api/initiate-vendor-payout`

**Description**: Creates a payout task when an order is confirmed. **Only for restaurant orders** - store orders do not have vendor payouts.

**Request Body**:
```json
{
  "orderId": "order_123",
  "transactionLedgerId": "ledger_123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "payoutTaskId": "payout_123",
  "amount": 9250,
  "status": "pending"
}
```

**Error Response** (400/500):
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 3. Initiate Agent Payout

**Endpoint**: `POST /api/initiate-agent-payout`

**Description**: Creates a payout task when an order is delivered.

**Request Body**:
```json
{
  "orderId": "order_123",
  "transactionLedgerId": "ledger_123",
  "agentId": "agent_789"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "payoutTaskId": "payout_456",
  "amount": 75,
  "status": "pending"
}
```

**Error Response** (400/500):
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 4. Process Batch Payouts

**Endpoint**: `POST /api/process-batch-payouts`

**Description**: Processes all pending payouts in batches. Called by cron job daily at 12:00 AM UTC.

**Request Body** (optional):
```json
{
  "type": "vendor",           // "vendor" | "agent" | "all"
  "date": "2024-01-15"       // optional, defaults to today
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "batchId": "batch_20240115_vendor",
  "summary": {
    "totalPayouts": 10,
    "totalAmount": 92500,
    "uniqueRecipients": 3,
    "successful": 8,
    "failed": 2
  },
  "transfers": [
    {
      "recipientId": "vendor_123",
      "transferCode": "TRF_xxxxx",
      "amount": 31475,
      "status": "success"
    }
  ],
  "errors": [
    {
      "recipientId": "vendor_456",
      "error": "Insufficient balance",
      "code": "INSUFFICIENT_BALANCE"
    }
  ]
}
```

**Error Response** (500):
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 5. Paystack Webhook Handler

**Endpoint**: `POST /api/paystack-webhook`

**Description**: Receives and processes Paystack webhook events.

**Headers**:
```
X-Paystack-Signature: <webhook_signature>
Content-Type: application/json
```

**Request Body** (from Paystack):
```json
{
  "event": "charge.success",
  "data": {
    "reference": "PAY_12345",
    "amount": 10000,
    "status": "success",
    ...
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "processed": true
}
```

**Note**: This endpoint should:
- Verify webhook signature using Paystack secret key
- Process payment events (charge.success, charge.failed)
- Process transfer events (transfer.success, transfer.failed, transfer.reversed)
- Update transaction_ledger and pending_payouts accordingly

---

## 6. Verify Bank Account

**Endpoint**: `POST /api/verify-account`

**Description**: Verifies bank account details (already implemented on your VPS).

**Request Body**:
```json
{
  "accountNumber": "0123456789",
  "bankCode": "044"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "accountName": "John Doe",
  "bankName": "Access Bank",
  "verified": true
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "Invalid account details",
  "code": "INVALID_ACCOUNT"
}
```

---

## 7. Get Transaction Ledger

**Endpoint**: `GET /api/transaction-ledger/:orderId`

**Description**: Retrieves transaction ledger entry for an order.

**Response** (200 OK):
```json
{
  "success": true,
  "ledger": {
    "orderId": "order_123",
    "orderValue": 10000,
    "deliveryFee": 500,
    "paymentStatus": "payment_received",
    "vendorCommission": { ... },
    "agentCommission": { ... },
    "platformRevenue": { ... },
    "payoutStatus": { ... }
  }
}
```

---

## 8. Get Pending Payouts

**Endpoint**: `GET /api/pending-payouts`

**Description**: Retrieves pending payout tasks.

**Query Parameters**:
- `type`: "vendor" | "agent" | "all" (optional)
- `recipientId`: Filter by recipient ID (optional)
- `status`: "pending" | "processing" | "completed" | "failed" (optional)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "payouts": [
    {
      "payoutTaskId": "payout_123",
      "orderId": "order_123",
      "recipientType": "vendor",
      "recipientId": "vendor_456",
      "amount": 9250,
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Invalid request body or parameters |
| `ORDER_NOT_FOUND` | Order does not exist |
| `VENDOR_NOT_FOUND` | Vendor does not exist |
| `AGENT_NOT_FOUND` | Agent does not exist |
| `COMMISSION_ALREADY_CALCULATED` | Commission already calculated for this order |
| `PAYOUT_ALREADY_INITIATED` | Payout already initiated for this order |
| `INSUFFICIENT_BALANCE` | Paystack balance insufficient for transfer |
| `INVALID_BANK_DETAILS` | Bank account details invalid |
| `PAYSTACK_API_ERROR` | Error from Paystack API |
| `UNAUTHORIZED` | Missing or invalid authentication token |
| `INTERNAL_ERROR` | Internal server error |

---

## Rate Limiting

Recommended rate limits:
- **Calculate Commission**: 100 requests/minute per user
- **Initiate Payout**: 50 requests/minute per user
- **Process Batch Payouts**: 1 request/minute (cron only)
- **Webhook**: 1000 requests/minute (from Paystack IPs)
- **Verify Account**: 50 requests/minute per user

---

## Webhook Security

The Paystack webhook endpoint should:

1. **Verify Signature**: Validate `X-Paystack-Signature` header
   ```javascript
   const crypto = require('crypto');
   const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
     .update(JSON.stringify(req.body))
     .digest('hex');
   if (hash !== req.headers['x-paystack-signature']) {
     return res.status(400).send('Invalid signature');
   }
   ```

2. **Idempotency**: Check if webhook event already processed (using Paystack event ID)

3. **Response Time**: Respond within 5 seconds to avoid Paystack retries

---

## Implementation Notes

1. **Firebase Admin SDK**: All endpoints need Firebase Admin SDK to read/write Firestore
2. **Paystack Integration**: Use Paystack Node.js SDK or axios for API calls
3. **Error Handling**: Implement proper error handling and logging
4. **Idempotency**: Ensure idempotent operations for payout processing
5. **Cron Setup**: Set up cron job on VPS:
   ```bash
   # Run daily at 12:00 AM UTC
   0 0 * * * curl -X POST https://kwuo.gobuyme.shop/api/process-batch-payouts \
     -H "Authorization: Bearer <service_account_token>" \
     -H "Content-Type: application/json"
   ```

---

## Testing

Use the following tools to test endpoints:

1. **Postman/Insomnia**: For manual API testing
2. **curl**: For command-line testing
3. **Paystack Test Mode**: For webhook testing

Example test command:
```bash
curl -X POST https://kwuo.gobuyme.shop/api/calculate-commission \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_order_123",
    "orderValue": 10000,
    "deliveryFee": 500,
    "vendorId": "test_vendor_456"
  }'
```

---

## Support

For implementation questions or issues:
- Review `IMPLEMENTATION_GUIDE.md` for setup instructions
- Check `SYSTEM_FLOW.md` for flow diagrams
- Review Paystack API documentation for integration details

