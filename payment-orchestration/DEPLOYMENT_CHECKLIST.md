# Deployment Checklist

## Payment Orchestration System

Use this checklist to ensure all components are properly configured before deploying to production.

---

## Pre-Deployment

### 1. GCP/Firebase Setup

- [ ] Firebase project created
- [ ] Billing enabled on GCP project
- [ ] Firestore database initialized
- [ ] VPS API server configured
- [ ] Cloud Logging enabled
- [ ] Cloud Monitoring enabled
- [ ] Error Reporting enabled

### 2. Environment Configuration

- [ ] `PAYSTACK_SECRET_KEY` configured (production key)
- [ ] `PAYSTACK_PUBLIC_KEY` configured (for frontend)
- [ ] Firebase Config or Secret Manager configured
- [ ] Environment variables documented

### 3. Code Review

- [ ] All VPS API code reviewed
- [ ] Error handling implemented
- [ ] Logging statements added
- [ ] Security best practices followed
- [ ] Code tested in development environment

---

## Firestore Setup

### 4. Database Structure

- [ ] `transaction_ledger` collection ready
- [ ] `pending_payouts` collection ready
- [ ] `batch_payouts` collection ready
- [ ] `failed_payouts` collection ready
- [ ] `idempotency_keys` collection ready (optional)

### 5. Firestore Indexes

- [ ] Composite indexes deployed
- [ ] Indexes verified in Firebase Console
- [ ] Query performance tested

### 6. Firestore Security Rules

- [ ] Security rules configured (restrict write access)
- [ ] Rules tested
- [ ] Admin-only collections protected

---

## VPS API Deployment

### 7. Dependencies

- [ ] All npm packages installed on VPS
- [ ] No dependency vulnerabilities
- [ ] Package versions locked

### 8. API Endpoint Deployment

- [ ] `POST /api/calculate-commission` implemented and tested
- [ ] `POST /api/initiate-vendor-payout` implemented and tested
- [ ] `POST /api/initiate-agent-payout` implemented and tested
- [ ] `POST /api/process-batch-payouts` implemented and tested
- [ ] `POST /api/paystack-webhook` implemented and tested
- [ ] `GET /api/transaction-ledger/:orderId` implemented and tested
- [ ] `GET /api/pending-payouts` implemented and tested

### 9. VPS Configuration

- [ ] Server resources adequate (CPU, RAM)
- [ ] Timeout configured (540s for batch processor)
- [ ] Process manager configured (PM2/systemd)
- [ ] SSL/TLS certificates valid
- [ ] Environment variables configured
- [ ] Firebase Admin SDK initialized

---

## Paystack Configuration

### 10. Paystack Account

- [ ] Production API keys obtained
- [ ] Account verified
- [ ] Transfer recipients feature enabled
- [ ] Sufficient balance for initial payouts

### 11. Webhook Configuration

- [ ] Webhook URL configured in Paystack dashboard
- [ ] Webhook events enabled:
  - [ ] `charge.success`
  - [ ] `charge.failed`
  - [ ] `transfer.success`
  - [ ] `transfer.failed`
  - [ ] `transfer.reversed`
- [ ] Webhook signature verification tested

### 12. Paystack Settings

- [ ] Transfer limits reviewed
- [ ] Daily transfer limits understood
- [ ] Support contact information saved

---

## Scheduling & Automation

### 13. Cron Scheduler

- [ ] Daily batch job scheduled on VPS (12:00 AM UTC)
- [ ] Cron job configured and tested
- [ ] Authentication token/service account configured for cron

### 14. Monitoring Setup

- [ ] Cloud Monitoring dashboards created
- [ ] Alerting policies configured
- [ ] Notification channels set up:
  - [ ] Email notifications
  - [ ] PagerDuty (if applicable)
  - [ ] Slack (if applicable)

---

## Data Collection Setup

### 15. Restaurant Data

- [ ] Restaurants have payout details configured:
  - [ ] Account number
  - [ ] Bank code
  - [ ] Account name (verified)
  - [ ] `payoutEnabled: true`
- [ ] Restaurants have `tier` field (1 or 2)
- [ ] At least one test restaurant configured

### 16. Agent Data

- [ ] Agents have payout details configured:
  - [ ] Account number
  - [ ] Bank code
  - [ ] Account name (verified)
  - [ ] `payoutEnabled: true`
- [ ] At least one test agent configured

### 17. Order Schema

- [ ] Orders collection has required fields:
  - [ ] `paymentStatus`
  - [ ] `paymentReference`
  - [ ] `status`
  - [ ] `confirmedAt`
  - [ ] `deliveredAt`
  - [ ] `transactionLedgerId`

---

## Testing

### 18. Commission Calculation Testing

- [ ] Test order created
- [ ] Commission calculated correctly
- [ ] Transaction ledger entry created
- [ ] Calculations verified manually

### 19. Payout Initiation Testing

- [ ] Order confirmed → Vendor payout task created
- [ ] Order delivered → Agent payout task created
- [ ] Payout tasks have correct amounts
- [ ] Recipient details validated

### 20. Batch Processing Testing

- [ ] Manual batch processor tested
- [ ] Aggregation logic verified
- [ ] Paystack transfers created successfully
- [ ] Batch document created correctly

### 21. Webhook Testing

- [ ] Payment webhook received and processed
- [ ] Transfer webhook received and processed
- [ ] Transaction ledger updated correctly
- [ ] Webhook signature verification working

### 22. Error Handling Testing

- [ ] Insufficient balance error handled
- [ ] Invalid recipient error handled
- [ ] Failed transfers moved to failed_payouts
- [ ] Retry mechanism tested

---

## Security & Compliance

### 23. Security

- [ ] All secret keys stored securely (Secret Manager)
- [ ] Webhook signature verification enabled
- [ ] Firebase Auth required for manual endpoints
- [ ] Rate limiting considered
- [ ] CORS configured appropriately

### 24. Audit Trail

- [ ] Transaction ledger logging all events
- [ ] Webhook events logged
- [ ] Failed operations logged
- [ ] Audit log retention policy set

### 25. Compliance

- [ ] Financial audit requirements understood
- [ ] Data retention policies set
- [ ] GDPR compliance considered (if applicable)
- [ ] PCI DSS compliance reviewed (if applicable)

---

## Documentation

### 26. Documentation Complete

- [ ] Architecture documentation reviewed
- [ ] API documentation complete
- [ ] Deployment guide followed
- [ ] Troubleshooting guide available
- [ ] Runbooks created for common issues

### 27. Team Training

- [ ] Team trained on system operation
- [ ] Support contacts documented
- [ ] Escalation procedures defined
- [ ] On-call rotation configured

---

## Production Readiness

### 28. Backup & Recovery

- [ ] Backup strategy defined
- [ ] Recovery procedures documented
- [ ] Disaster recovery plan created
- [ ] Data export procedures tested

### 29. Performance Testing

- [ ] System tested with expected load
- [ ] Function timeouts appropriate
- [ ] Firestore query performance acceptable
- [ ] Paystack API rate limits understood

### 30. Cost Management

- [ ] Cost estimates calculated
- [ ] Budget alerts configured
- [ ] Cost optimization reviewed
- [ ] Billing monitoring set up

---

## Go-Live

### 31. Pre-Launch

- [ ] All checklist items completed
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Monitoring dashboards active

### 32. Launch

- [ ] System deployed to production
- [ ] Webhooks configured and active
- [ ] First test transaction processed
- [ ] Monitoring verified active

### 33. Post-Launch

- [ ] Monitor first 24 hours closely
- [ ] Review logs for errors
- [ ] Verify payouts processing correctly
- [ ] Collect team feedback

---

## Post-Deployment Monitoring

### Week 1

- [ ] Daily review of failed payouts
- [ ] Monitor payout success rate
- [ ] Review error logs
- [ ] Verify financial reconciliation

### Week 2-4

- [ ] Weekly financial reconciliation
- [ ] Review performance metrics
- [ ] Address any issues found
- [ ] Optimize based on usage patterns

### Ongoing

- [ ] Monthly financial audits
- [ ] Quarterly security reviews
- [ ] Regular dependency updates
- [ ] Performance optimization as needed

---

## Emergency Contacts

- **Paystack Support**: support@paystack.com
- **Firebase Support**: firebase-support@google.com
- **On-Call Engineer**: [Contact Info]
- **Engineering Lead**: [Contact Info]

---

## Rollback Plan

If critical issues are discovered:

1. **Immediate Actions**:

   - [ ] Disable webhook handler (if causing issues)
   - [ ] Pause batch processor (if needed)
   - [ ] Notify stakeholders

2. **Rollback Steps**:

   - [ ] Revert to previous VPS API version (if using version control)
   - [ ] Restore Firestore data from backup (if needed)
   - [ ] Verify system functionality

3. **Post-Rollback**:
   - [ ] Investigate root cause
   - [ ] Fix issues in development
   - [ ] Test thoroughly before redeploying

---

**Checklist Last Updated**: 2024-01-15

**Next Review Date**: After first production deployment
