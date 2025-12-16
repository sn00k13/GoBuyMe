# Payment Orchestration & Automated Payouts System

A complete, secure, and scalable payment orchestration system designed for a React Native on-demand delivery app. This system handles payment processing from customers and automated payouts to vendors and delivery agents, built on GCP/Firebase with Paystack integration.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Key Components](#key-components)
- [Business Logic](#business-logic)
- [Scaling Considerations](#scaling-considerations)
- [Security](#security)

---

## Overview

This payment orchestration system provides:

- ✅ **Automated Commission Calculation** - Tiered vendor commissions and fixed agent commissions
- ✅ **Event-Driven Payout Initiation** - Automatic payout task creation when orders are confirmed/delivered
- ✅ **Daily Batch Payout Processing** - Aggregated payouts to minimize API calls and transaction fees
- ✅ **Real-Time Webhook Processing** - Synchronized ledger updates from Paystack events
- ✅ **Idempotency & Error Handling** - Resilient to failures with retry mechanisms
- ✅ **Scalable Architecture** - Designed to handle 1M+ orders per day

---

## Architecture

### High-Level Flow

```
Customer Payment → Paystack → Webhook → Transaction Ledger
                                           ↓
Order Confirmed → Firestore Trigger → Vendor Payout Task
                                           ↓
Daily Batch Processor → Aggregated Payouts → Paystack Transfers
                                           ↓
Transfer Webhook → Update Ledger → Mark as Paid
```

### System Components

1. **Transaction Ledger** (Firestore) - Single source of truth for all financial events
2. **Commission Calculator** (VPS API) - Calculates splits when orders are created
3. **Payout Initiators** (VPS API) - Create payout tasks on order state changes
4. **Batch Processor** (VPS API + Cron) - Daily aggregation and payout execution
5. **Webhook Handler** (VPS API) - Processes Paystack payment/transfer events

For detailed architecture diagrams, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Features

### Commission Structure

- **Vendor Commission**: Tiered subscription
  - **Tier 1**: **7.5%** of order value
  - **Tier 2**: **3%** of order value
- **Delivery Agent Commission**: **15%** of delivery fee
- **Platform Revenue**: Vendor commission (based on tier) + (Delivery fee - Agent share)

### Payout Timing

- **Vendor Payouts**: Initiated when order is confirmed, processed in daily batches
- **Agent Payouts**: Initiated when order is delivered, processed in daily batches
- **Batch Processing**: Runs daily at 12:00 AM UTC

### Scalability Features

- **Efficient Querying**: Composite Firestore indexes for fast lookups
- **Aggregation**: Payouts grouped by recipient to minimize API calls
- **Idempotency**: Prevents duplicate payouts on retries
- **Error Recovery**: Failed payouts automatically retried or moved to dead-letter queue

---

## Quick Start

### Prerequisites

- Firebase project with Firestore enabled
- Private VPS server with Node.js 18+ installed
- Paystack account with API keys
- SSL/TLS certificates for HTTPS

### Installation

1. **Set up VPS API server** (see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md))

2. **Configure environment variables on VPS**:
```bash
PAYSTACK_SECRET_KEY=sk_test_...
FIREBASE_PROJECT_ID=your-project-id
```

3. **Deploy Firestore indexes**:
```bash
firebase deploy --only firestore:indexes
```

4. **Implement and deploy VPS API endpoints** (see [API_ENDPOINTS.md](./API_ENDPOINTS.md))

5. **Configure Paystack webhook**:
   - URL: `https://kwuo.gobuyme.shop/api/paystack-webhook`
   - Events: `charge.success`, `transfer.success`, `transfer.failed`

For detailed setup instructions, see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md).

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, data flow diagrams, and design decisions |
| [DATA_MODELS.md](./DATA_MODELS.md) | Complete Firestore schema and data model specifications |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | Step-by-step implementation and deployment guide |
| [MONITORING.md](./MONITORING.md) | Monitoring, logging, and alerting configuration |
| [PAYSTACK_API_REFERENCE.md](./PAYSTACK_API_REFERENCE.md) | Paystack API endpoints and best practices |

---

## Key Components

### 1. Transaction Ledger

Single source of truth tracking every financial event:
- Payment status
- Commission breakdown
- Payout status for vendors and agents
- Webhook event history

**Collection**: `transaction_ledger`

### 2. Commission Calculator

Automatically calculates commissions when orders are created:
- Vendor commission (7.5% for Tier 1, 3% for Tier 2)
- Agent commission (15% of delivery fee)
- Platform revenue

**API Endpoint**: `POST /api/calculate-commission` (called when order is created)

### 3. Payout Initiators

API endpoints that create payout tasks:
- **Vendor Payout**: Called when order status = "confirmed"
- **Agent Payout**: Called when order status = "delivered"

**API Endpoints**: `POST /api/initiate-vendor-payout`, `POST /api/initiate-agent-payout`

### 4. Batch Payout Processor

Scheduled daily to process pending payouts:
- Aggregates payouts by recipient
- Executes bulk transfers via Paystack
- Updates transaction ledger
- Handles failures and retries

**API Endpoint**: `POST /api/process-batch-payouts` (triggered by VPS cron job daily at 12:00 AM UTC)

### 5. Webhook Handler

Processes Paystack webhooks:
- Payment success/failure events
- Transfer success/failure events
- Updates transaction ledger in real-time

**API Endpoint**: `POST /api/paystack-webhook` (receives Paystack webhook events)

---

## Business Logic

### Commission Calculation Example

**Order Details**:
- Order Value: ₦10,000
- Delivery Fee: ₦500
- Vendor Tier: 1 (Tier 1)

**Calculations (Tier 1 Vendor)**:
- Vendor Commission (7.5%): ₦750
- **Vendor Share**: ₦10,000 - ₦750 = ₦9,250

- **Agent Share** (15% of delivery fee): ₦75

- **Platform Revenue**:
  - Vendor Commission: ₦750
  - Delivery Fee Remainder: ₦500 - ₦75 = ₦425
  - **Total Platform Revenue**: ₦1,175

**Example (Tier 2 Vendor)**:
- Vendor Commission (3%): ₦300
- **Vendor Share**: ₦10,000 - ₦300 = ₦9,700
- **Platform Revenue**: ₦300 + ₦425 = ₦725

---

## Scaling Considerations

### Performance Optimizations

1. **Composite Indexes**: Efficient querying for batch processing
2. **Payout Aggregation**: Minimize Paystack API calls
3. **Batch Processing**: Process in chunks of 100 payouts
4. **Caching**: Store Paystack recipient codes in vendor/agent profiles

### Cost Optimization

1. **Batch Writes**: Minimize Firestore write operations
2. **Efficient Queries**: Use indexes to reduce read costs
3. **Log Archival**: Move old logs to Cloud Storage
4. **Resource Limits**: Set appropriate function memory/timeout

### Handling 1M+ Orders/Day

- **Horizontal Scaling**: Scale VPS API with load balancer and multiple instances
- **Queue Processing**: Use job queues (Redis/Bull) for heavy operations
- **Database Sharding**: Consider sharding transaction_ledger if needed
- **Caching Layer**: Use Redis for frequently accessed data
- **API Rate Limiting**: Implement rate limiting to prevent abuse

---

## Security

### Authentication & Authorization

- All VPS API endpoints require Firebase Auth tokens (except webhooks)
- Webhook signature verification prevents unauthorized access
- Environment variables for sensitive keys stored securely on VPS
- API rate limiting to prevent abuse

### Data Protection

- Firestore encryption at rest (default)
- HTTPS for all API communications
- Secure storage of Paystack secret keys

### Audit Trail

- Complete transaction history in `transaction_ledger`
- Webhook event log for reconciliation
- Failed payout tracking for manual review

---

## Monitoring & Alerts

Key metrics to monitor:

- **Financial**: Total payouts, commission collected, pending amounts
- **Performance**: Payout processing duration, function execution time
- **Reliability**: Payout success rate, webhook processing rate
- **Errors**: Failed payouts, commission calculation errors

See [MONITORING.md](./MONITORING.md) for detailed alerting configuration.

---

## Error Handling

### Retry Strategy

- **Transient Errors**: Exponential backoff with max 3 retries
- **Permanent Errors**: Moved to `failed_payouts` collection for manual review
- **Idempotency**: Prevents duplicate payouts on retries

### Failure Scenarios

1. **Paystack API Failure**: Retry in next batch run, alert if persists
2. **Webhook Delivery Failure**: Manual reconciliation process available
3. **Partial Batch Failure**: Track individual transfer status, retry failed ones

---

## Testing

### Test Scenarios

1. **Commission Calculation**: Verify correct split on order creation
2. **Payout Initiation**: Verify payout tasks created on order state changes
3. **Batch Processing**: Test aggregation and transfer execution
4. **Webhook Processing**: Verify ledger updates from Paystack events

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for testing procedures.

---

## Support & Troubleshooting

### Common Issues

- **Commission not calculated**: Check VPS API logs, verify API endpoint is being called, verify order fields
- **Payout not initiated**: Verify payment status and vendor/agent payout details
- **Batch payout failed**: Check Paystack balance, verify recipient codes
- **Webhook not processing**: Verify webhook URL and signature verification

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md#troubleshooting) for detailed troubleshooting steps.

---

## License

This system is designed for internal use. Ensure compliance with:
- Payment processing regulations
- Data protection laws (GDPR, etc.)
- Financial audit requirements

---

## Contributing

When making changes:

1. Update relevant documentation
2. Add tests for new functionality
3. Update Firestore indexes if schema changes
4. Review security implications
5. Test with Paystack test environment first

---

## Contact & Support

- **Paystack Support**: support@paystack.com
- **Firebase Support**: firebase-support@google.com
- **Internal Team**: [Your team contact]

---

## Version History

- **v1.0.0** - Initial implementation
  - Commission calculation engine
  - Event-driven payout initiation
  - Daily batch payout processor
  - Webhook handler
  - Complete documentation

---

**Built with ❤️ for scalable payment orchestration**

