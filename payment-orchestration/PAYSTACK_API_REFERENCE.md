# Paystack API Reference & Best Practices
## Payment Orchestration System Integration

---

## API Endpoints Used

### 1. Bank Account Verification

**Endpoint**: `GET /bank/resolve`

**Purpose**: Verify bank account details before creating payout recipients

**Request**:
```
GET https://api.paystack.co/bank/resolve?account_number={accountNumber}&bank_code={bankCode}
Headers:
  Authorization: Bearer {secret_key}
```

**Response**:
```json
{
  "status": true,
  "message": "Account number resolved",
  "data": {
    "account_number": "0123456789",
    "account_name": "John Doe",
    "bank_id": 1
  }
}
```

**Best Practices**:
- Always verify account before creating transfer recipient
- Cache verified account names in vendor/agent profiles
- Handle invalid account errors gracefully

---

### 2. List Banks

**Endpoint**: `GET /bank`

**Purpose**: Get list of supported banks for account selection

**Request**:
```
GET https://api.paystack.co/bank
Headers:
  Authorization: Bearer {secret_key}
```

**Response**:
```json
{
  "status": true,
  "message": "Banks retrieved",
  "data": [
    {
      "id": 1,
      "name": "Access Bank",
      "slug": "access-bank",
      "code": "044"
    }
  ]
}
```

---

### 3. Create Transfer Recipient

**Endpoint**: `POST /transferrecipient`

**Purpose**: Create a transfer recipient for automated payouts

**Request**:
```
POST https://api.paystack.co/transferrecipient
Headers:
  Authorization: Bearer {secret_key}
  Content-Type: application/json

Body:
{
  "type": "nuban",
  "name": "John Doe",
  "account_number": "0123456789",
  "bank_code": "044",
  "currency": "NGN"
}
```

**Response**:
```json
{
  "status": true,
  "message": "Recipient created",
  "data": {
    "active": true,
    "createdAt": "2019-01-01T00:00:00.000Z",
    "currency": "NGN",
    "domain": "test",
    "id": 1,
    "integration": 1,
    "name": "John Doe",
    "recipient_code": "RCP_xxxxxxxxxxxxx",
    "type": "nuban",
    "updatedAt": "2019-01-01T00:00:00.000Z",
    "is_deleted": false,
    "details": {
      "authorization_code": null,
      "account_number": "0123456789",
      "account_name": "John Doe",
      "bank_code": "044",
      "bank_name": "Access Bank"
    }
  }
}
```

**Best Practices**:
- Store `recipient_code` in vendor/agent profiles to avoid recreating
- Verify account before creating recipient
- Handle duplicate recipient errors (recipient may already exist)

**Error Handling**:
```javascript
if (error.response?.data?.message?.includes("Recipient already exists")) {
  // Fetch existing recipient_code from vendor/agent profile
  // Or query Paystack for existing recipients
}
```

---

### 4. Initiate Single Transfer

**Endpoint**: `POST /transfer`

**Purpose**: Transfer funds to a single recipient

**Request**:
```
POST https://api.paystack.co/transfer
Headers:
  Authorization: Bearer {secret_key}
  Content-Type: application/json

Body:
{
  "source": "balance",
  "amount": 10000,
  "recipient": "RCP_xxxxxxxxxxxxx",
  "reason": "Payment for services rendered",
  "reference": "unique_reference_id",
  "currency": "NGN"
}
```

**Response**:
```json
{
  "status": true,
  "message": "Transfer queued",
  "data": {
    "integration": 1,
    "domain": "test",
    "amount": 10000,
    "currency": "NGN",
    "source": "balance",
    "reason": "Payment for services rendered",
    "recipient": 1,
    "status": "pending",
    "transfer_code": "TRF_xxxxxxxxxxxxx",
    "id": 1,
    "createdAt": "2019-01-01T00:00:00.000Z",
    "updatedAt": "2019-01-01T00:00:00.000Z"
  }
}
```

**Best Practices**:
- Use unique `reference` for idempotency
- Always verify transfer status via webhook
- Handle insufficient balance errors
- Implement retry logic with exponential backoff

**Error Codes**:
- `INSUFFICIENT_BALANCE`: Add funds to Paystack balance
- `INVALID_RECIPIENT`: Verify recipient_code is valid
- `TRANSFER_LIMIT_EXCEEDED`: Check transfer limits

---

### 5. Initiate Bulk Transfer

**Endpoint**: `POST /transfer/bulk`

**Purpose**: Transfer funds to multiple recipients in one API call

**Request**:
```
POST https://api.paystack.co/transfer/bulk
Headers:
  Authorization: Bearer {secret_key}
  Content-Type: application/json

Body:
{
  "currency": "NGN",
  "source": "balance",
  "transfers": [
    {
      "amount": 10000,
      "recipient": "RCP_xxxxxxxxxxxxx",
      "reference": "unique_ref_1",
      "reason": "Payment for services rendered"
    },
    {
      "amount": 5000,
      "recipient": "RCP_yyyyyyyyyyyyy",
      "reference": "unique_ref_2",
      "reason": "Payment for services rendered"
    }
  ]
}
```

**Response**:
```json
{
  "status": true,
  "message": "2 transfers queued",
  "data": [
    {
      "transfer_code": "TRF_xxxxxxxxxxxxx",
      "amount": 10000,
      "status": "pending",
      "recipient": {
        "recipient_code": "RCP_xxxxxxxxxxxxx",
        "details": {
          "account_number": "0123456789",
          "account_name": "John Doe",
          "bank_code": "044",
          "bank_name": "Access Bank"
        }
      }
    }
  ]
}
```

**Best Practices**:
- Limit bulk transfers to 100 recipients per request
- Process in batches if exceeding limit
- Handle partial failures (some transfers succeed, others fail)
- Verify each transfer status individually

---

### 6. Verify Transfer

**Endpoint**: `GET /transfer/{id_or_code}`

**Purpose**: Check the status of a transfer

**Request**:
```
GET https://api.paystack.co/transfer/{transfer_code}
Headers:
  Authorization: Bearer {secret_key}
```

**Response**:
```json
{
  "status": true,
  "message": "Transfer retrieved",
  "data": {
    "integration": 1,
    "domain": "test",
    "amount": 10000,
    "currency": "NGN",
    "source": "balance",
    "reason": "Payment for services rendered",
    "recipient": 1,
    "status": "success",
    "transfer_code": "TRF_xxxxxxxxxxxxx",
    "id": 1,
    "createdAt": "2019-01-01T00:00:00.000Z",
    "updatedAt": "2019-01-01T00:00:00.000Z"
  }
}
```

**Transfer Statuses**:
- `pending`: Transfer queued, processing
- `success`: Transfer completed successfully
- `failed`: Transfer failed (check `reason` field)
- `reversed`: Transfer was reversed

---

### 7. Verify Payment

**Endpoint**: `GET /transaction/verify/{reference}`

**Purpose**: Verify the status of a customer payment

**Request**:
```
GET https://api.paystack.co/transaction/verify/{payment_reference}
Headers:
  Authorization: Bearer {secret_key}
```

**Response**:
```json
{
  "status": true,
  "message": "Verification successful",
  "data": {
    "amount": 10000,
    "currency": "NGN",
    "transaction_date": "2019-01-01T00:00:00.000Z",
    "status": "success",
    "reference": "unique_payment_reference",
    "domain": "test",
    "metadata": {},
    "gateway_response": "Successful",
    "message": null,
    "channel": "card",
    "ip_address": "127.0.0.1",
    "log": null,
    "fees": 0,
    "authorization": {},
    "customer": {},
    "plan": null
  }
}
```

---

## Webhook Events

### Payment Events

#### charge.success
Fired when a payment is successful.

```json
{
  "event": "charge.success",
  "data": {
    "id": 1,
    "domain": "test",
    "status": "success",
    "reference": "unique_payment_reference",
    "amount": 10000,
    "message": null,
    "gateway_response": "Successful",
    "paid_at": "2019-01-01T00:00:00.000Z",
    "created_at": "2019-01-01T00:00:00.000Z",
    "channel": "card",
    "currency": "NGN",
    "ip_address": "127.0.0.1",
    "metadata": {},
    "log": null,
    "fees": 0,
    "customer": {},
    "authorization": {},
    "plan": null
  }
}
```

#### charge.failed
Fired when a payment fails.

```json
{
  "event": "charge.failed",
  "data": {
    "id": 1,
    "domain": "test",
    "status": "failed",
    "reference": "unique_payment_reference",
    "amount": 10000,
    "message": "Insufficient funds",
    "gateway_response": "Declined",
    "created_at": "2019-01-01T00:00:00.000Z",
    "channel": "card",
    "currency": "NGN",
    "ip_address": "127.0.0.1",
    "metadata": {},
    "log": null,
    "fees": 0
  }
}
```

### Transfer Events

#### transfer.success
Fired when a transfer is successful.

```json
{
  "event": "transfer.success",
  "data": {
    "integration": 1,
    "domain": "test",
    "amount": 10000,
    "currency": "NGN",
    "source": "balance",
    "reason": "Payment for services rendered",
    "recipient": 1,
    "status": "success",
    "transfer_code": "TRF_xxxxxxxxxxxxx",
    "id": 1,
    "createdAt": "2019-01-01T00:00:00.000Z",
    "updatedAt": "2019-01-01T00:00:00.000Z"
  }
}
```

#### transfer.failed
Fired when a transfer fails.

```json
{
  "event": "transfer.failed",
  "data": {
    "integration": 1,
    "domain": "test",
    "amount": 10000,
    "currency": "NGN",
    "source": "balance",
    "reason": "Insufficient balance",
    "recipient": 1,
    "status": "failed",
    "transfer_code": "TRF_xxxxxxxxxxxxx",
    "id": 1,
    "createdAt": "2019-01-01T00:00:00.000Z",
    "updatedAt": "2019-01-01T00:00:00.000Z"
  }
}
```

---

## Webhook Security

### Signature Verification

Always verify webhook signatures to ensure requests are from Paystack:

```javascript
const crypto = require("crypto");

function verifyWebhookSignature(rawBody, signature, secretKey) {
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");
  
  return hash === signature;
}
```

### Best Practices

1. **Always verify signature** before processing
2. **Return 200 OK** even if processing fails (to prevent retries)
3. **Log all webhook events** for audit trail
4. **Handle duplicate events** using idempotency keys
5. **Process webhooks asynchronously** if operations are slow

---

## Rate Limits

Paystack API rate limits:
- **General API**: 50 requests per second per API key
- **Transfer API**: May have different limits, check with Paystack support

**Best Practices**:
- Implement exponential backoff for rate limit errors
- Batch operations where possible
- Cache frequently accessed data (bank lists, recipient codes)
- Use webhooks instead of polling for status updates

---

## Error Handling

### Common Errors

1. **Insufficient Balance** (HTTP 400)
   ```json
   {
     "status": false,
     "message": "Insufficient balance",
     "data": null
   }
   ```
   **Solution**: Add funds to Paystack balance

2. **Invalid Recipient** (HTTP 400)
   ```json
   {
     "status": false,
     "message": "Invalid recipient",
     "data": null
   }
   ```
   **Solution**: Verify recipient_code exists and is active

3. **Invalid Account** (HTTP 400)
   ```json
   {
     "status": false,
     "message": "Account resolution failed",
     "data": null
   }
   ```
   **Solution**: Verify account number and bank code are correct

4. **Rate Limit Exceeded** (HTTP 429)
   ```json
   {
     "status": false,
     "message": "Rate limit exceeded",
     "data": null
   }
   ```
   **Solution**: Implement exponential backoff and retry

### Retry Strategy

```javascript
async function retryWithBackoff(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Idempotency

Always use unique references for transfers to prevent duplicate payments:

```javascript
// Generate idempotency key
const idempotencyKey = `payout_${recipientId}_${date}_${batchNumber}`;

// Use as transfer reference
await initiateTransfer({
  recipientCode: recipientCode,
  amount: amount,
  reference: idempotencyKey,  // Unique reference
  reason: "Daily payout",
  currency: "NGN"
});
```

---

## Testing

### Test API Keys

Use Paystack test keys for development:
- Test Secret Key: `sk_test_...`
- Test Public Key: `pk_test_...`

### Test Bank Accounts

Paystack provides test bank accounts for testing:
- Account Number: `0123456789`
- Bank Code: `044` (Access Bank)

### Test Transfers

Test transfers will show as "test" in Paystack dashboard and won't process actual funds.

---

## Production Checklist

- [ ] Switch to production API keys
- [ ] Configure production webhook URL
- [ ] Verify webhook signature verification is enabled
- [ ] Test transfer with small amount first
- [ ] Monitor Paystack balance
- [ ] Set up alerts for low balance
- [ ] Review transfer limits with Paystack
- [ ] Document transfer procedures for team
- [ ] Set up reconciliation process

---

## Support

- **Paystack Support**: support@paystack.com
- **API Documentation**: https://paystack.com/docs/api
- **Status Page**: https://status.paystack.com

