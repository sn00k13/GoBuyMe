# Next Steps After VPS Setup
## Integration & Deployment Checklist

Your VPS API is now set up! Follow these steps to complete the integration.

---

## ✅ Completed

- [x] VPS API endpoints implemented
- [x] All endpoints tested and working
- [x] Firebase Admin SDK configured
- [x] Paystack integration working
- [x] Environment variables configured

---

## 🔄 Immediate Next Steps

### 1. React Native App Integration (Priority 1)

**Time Estimate**: 2-4 hours

Follow the [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) to:

1. **Create API Service Module**
   - Create `services/paymentOrchestrationAPI.js`
   - Implement API call functions
   - Add authentication handling

2. **Update Order Creation Flow**
   - Call `/api/calculate-commission` after order creation
   - Store `transactionLedgerId` in order document
   - Add error handling

3. **Update Order Confirmation Flow**
   - Call `/api/initiate-vendor-payout` when order confirmed
   - Update order status appropriately

4. **Update Order Delivery Flow**
   - Call `/api/initiate-agent-payout` when order delivered
   - Ensure agentId is set

**Files to Update**:
- `screens/restaurant/RestaurantPaymentScreen.js`
- `screens/store/PaymentScreen.js`
- Any admin/vendor panels that confirm orders
- Any delivery agent apps that mark orders delivered

---

### 2. Configure Paystack Webhook (Priority 1)

**Time Estimate**: 15 minutes

1. **Go to Paystack Dashboard**
   - Navigate to Settings → API Keys & Webhooks
   - Add webhook URL: `https://kwuo.gobuyme.shop/api/paystack-webhook`

2. **Enable Events**:
   - ✅ `charge.success`
   - ✅ `charge.failed`
   - ✅ `transfer.success`
   - ✅ `transfer.failed`
   - ✅ `transfer.reversed`

3. **Test Webhook**:
   - Paystack will send a test event
   - Check VPS API logs to verify receipt
   - Verify signature verification works

---

### 3. Set Up Cron Job for Batch Processing (Priority 1)

**Time Estimate**: 15 minutes

1. **Create Cron Job**:
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 12:00 AM UTC)
0 0 * * * curl -X POST https://kwuo.gobuyme.shop/api/process-batch-payouts \
  -H "Authorization: Bearer $(cat /path/to/service-account-token)" \
  -H "Content-Type: application/json" \
  -d '{"type":"all"}' >> /var/log/batch-payouts.log 2>&1
```

2. **Alternative**: Use a service account token or API key for authentication

3. **Test Manually**:
```bash
curl -X POST https://kwuo.gobuyme.shop/api/process-batch-payouts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"all"}'
```

---

### 4. Verify Firestore Data Structure (Priority 2)

**Time Estimate**: 30 minutes

Ensure your Firestore collections have the required fields:

#### Orders Collection
- [ ] `paymentStatus` field exists
- [ ] `paymentReference` field exists
- [ ] `status` field exists
- [ ] `confirmedAt` timestamp field
- [ ] `deliveredAt` timestamp field
- [ ] `transactionLedgerId` field (will be added by API)
- [ ] `vendorId` or `restaurantId` field exists
- [ ] `agentId` field (optional, set when agent assigned)

#### Restaurants Collection
- [ ] `tier` field (1 or 2) exists
- [ ] `payoutDetails` object with:
  - `accountNumber`
  - `bankCode`
  - `accountName`
  - `verified: true`
- [ ] `payoutEnabled: true` for active restaurants

#### Agents Collection
- [ ] `payoutDetails` object with:
  - `accountNumber`
  - `bankCode`
  - `accountName`
  - `verified: true`
- [ ] `payoutEnabled: true` for active agents

---

### 5. Deploy Firestore Indexes (Priority 2)

**Time Estimate**: 15 minutes

```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Or create manually in Firebase Console
# Go to Firestore → Indexes → Create Index
```

**Required Indexes**:
- `pending_payouts`: `status + recipientType + createdAt`
- `pending_payouts`: `recipientId + status + createdAt`
- `transaction_ledger`: `paymentStatus + createdAt`
- `transaction_ledger`: `vendorId + payoutStatus.vendor.status + createdAt`

---

### 6. Test End-to-End Flow (Priority 2)

**Time Estimate**: 1-2 hours

#### Test Scenario 1: Complete Order Flow

1. **Create Test Order**
   - Place order through app
   - Verify commission API is called
   - Check `transaction_ledger` collection
   - Verify commission amounts (Tier 1: 7.5%, Tier 2: 3%)

2. **Confirm Order**
   - Mark order as "confirmed"
   - Verify vendor payout API is called
   - Check `pending_payouts` collection
   - Verify payout amount = vendor share

3. **Deliver Order**
   - Mark order as "delivered"
   - Verify agent payout API is called
   - Check `pending_payouts` collection
   - Verify payout amount = 15% of delivery fee

4. **Process Batch Payout**
   - Manually trigger batch processor
   - Verify Paystack transfers created
   - Check `batch_payouts` collection
   - Verify payout statuses updated

#### Test Scenario 2: Webhook Processing

1. **Payment Webhook**
   - Make a test payment
   - Verify webhook received by VPS API
   - Check `transaction_ledger` updated
   - Verify order `paymentStatus` updated

2. **Transfer Webhook**
   - After batch processing
   - Verify transfer webhook received
   - Check `pending_payouts` status updated
   - Verify `transaction_ledger` updated

---

### 7. Set Up Monitoring & Logging (Priority 3)

**Time Estimate**: 1 hour

1. **VPS API Logging**
   - Ensure logs are being written
   - Set up log rotation
   - Configure log levels

2. **Error Tracking**
   - Set up error tracking (Sentry, LogRocket, etc.)
   - Configure alerts for critical errors

3. **Monitoring Dashboard**
   - Monitor API response times
   - Track payout success rates
   - Monitor server resources

---

### 8. Security Review (Priority 3)

**Time Estimate**: 30 minutes

- [ ] Verify SSL/TLS certificates are valid
- [ ] Check API rate limiting is configured
- [ ] Verify webhook signature verification
- [ ] Review environment variable security
- [ ] Check Firebase Admin SDK credentials are secure
- [ ] Verify CORS settings are appropriate

---

### 9. Documentation Updates (Priority 3)

**Time Estimate**: 30 minutes

- [ ] Update team documentation
- [ ] Create runbook for common issues
- [ ] Document API endpoints for team
- [ ] Create troubleshooting guide

---

## 🧪 Testing Checklist

### Commission Calculation
- [ ] Test with Tier 1 vendor (7.5% commission)
- [ ] Test with Tier 2 vendor (3% commission)
- [ ] Verify agent commission (15% of delivery fee)
- [ ] Check platform revenue calculation
- [ ] Test with missing vendor data (error handling)

### Payout Initiation
- [ ] Test vendor payout initiation
- [ ] Test agent payout initiation
- [ ] Verify payout tasks created correctly
- [ ] Test with missing payout details (error handling)

### Batch Processing
- [ ] Test manual batch processing
- [ ] Verify aggregation logic
- [ ] Check Paystack transfers created
- [ ] Verify batch document created
- [ ] Test with insufficient balance (error handling)

### Webhook Processing
- [ ] Test payment webhook
- [ ] Test transfer webhook
- [ ] Verify signature verification
- [ ] Test with invalid signature (error handling)

---

## 🚀 Production Deployment

### Pre-Launch Checklist

- [ ] All integration code tested
- [ ] Webhook configured in Paystack
- [ ] Cron job configured and tested
- [ ] Firestore indexes deployed
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Security review completed
- [ ] Team trained on new system

### Launch Day

1. **Deploy React Native App Updates**
   - Deploy app with API integration
   - Monitor for errors

2. **Monitor First Orders**
   - Watch first few orders closely
   - Verify commission calculations
   - Check payout initiation

3. **Verify Batch Processing**
   - Wait for or trigger first batch
   - Verify payouts processed
   - Check Paystack dashboard

### Post-Launch (First Week)

- [ ] Daily review of failed payouts
- [ ] Monitor payout success rate
- [ ] Review error logs
- [ ] Verify financial reconciliation
- [ ] Collect team feedback

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Commission not calculated
- Check API endpoint is being called
- Verify order data is correct
- Review VPS API logs

**Issue**: Payout not initiated
- Verify order status changed correctly
- Check vendor/agent payout details
- Review API logs

**Issue**: Webhook not processing
- Verify webhook URL is correct
- Check signature verification
- Review Paystack webhook logs

### Resources

- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - API specifications
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Integration steps
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Setup guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues (if exists)

---

## ✅ Success Criteria

You're ready for production when:

- [ ] All API endpoints tested and working
- [ ] React Native app integrated
- [ ] Webhook configured and tested
- [ ] Cron job configured
- [ ] End-to-end flow tested successfully
- [ ] Monitoring set up
- [ ] Team trained
- [ ] Documentation complete

---

**Estimated Total Time**: 6-10 hours for complete integration and testing

**Next Action**: Start with Step 1 - React Native App Integration

Good luck! 🚀

