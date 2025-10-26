# Pre-Launch Checklist - Evntori

## Critical Issues Found

### Database Setup ❌ BLOCKING
- **Status**: Database tables are NOT created
- **Issue**: All 12 migrations need to be applied to Supabase
- **Action Required**: Apply migrations manually or via Supabase CLI
- **Location**: `/supabase/migrations/*.sql`

### Environment Variables ⚠️ NEEDS ATTENTION

Current `.env` status:

```
✅ NEXT_PUBLIC_SUPABASE_URL - Configured
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY - Configured
❌ SUPABASE_SERVICE_ROLE_KEY - Placeholder value (needs real key)
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Configured
✅ STRIPE_SECRET_KEY - Configured
✅ STRIPE_WEBHOOK_SECRET - Configured
✅ NEXT_PUBLIC_APP_URL - Set to localhost
✅ NEXT_PUBLIC_APP_NAME - Set to KnotAgain (should be Evntori)
```

---

## 1. Database Setup (CRITICAL)

### Required Migrations (12 total)
Apply in this order:

1. `20251004162709_create_initial_schema.sql` - Core tables, enums, indexes, RLS
2. `20251004182849_enhance_reviews_table.sql` - Review enhancements
3. `20251004184345_add_payment_tracking_fields.sql` - Payment tracking
4. `20251004190134_enhance_messaging_tables.sql` - Messaging improvements
5. `20251004211345_create_favorites_system.sql` - Favorites functionality
6. `20251004211906_add_email_preferences.sql` - Email preferences
7. `20251004212407_create_admin_system.sql` - Admin capabilities
8. `20251004212638_add_suspension_fields.sql` - Suspension features
9. `20251004212941_create_saved_searches.sql` - Saved searches
10. `20251005000000_create_notifications_system.sql` - Notifications
11. `20251013212725_create_storage_buckets.sql` - Storage buckets
12. `20251013212801_create_storage_buckets.sql` - Storage buckets (duplicate?)

### Database Tables That Will Be Created (40+ tables)

**Core Tables:**
- profiles
- lender_profiles
- addresses
- categories

**Listings:**
- listings
- listing_images
- variants
- add_ons
- bundles
- bundle_items
- tags
- listing_tags

**Booking & Payments:**
- bookings
- booking_items
- booking_add_ons
- delivery_options
- payouts
- refunds
- deposits
- fees
- tax_rates

**Communication:**
- conversations
- messages
- notifications

**Reviews & Favorites:**
- reviews
- favorites

**Admin:**
- disputes
- audit_logs
- webhook_events

**Content:**
- coupons
- cms_pages
- blog_posts
- featured_collections
- featured_collection_items

**Other:**
- availability_blocks
- pricing_rules

---

## 2. Supabase Configuration

### Service Role Key ⚠️
- **Current Status**: Placeholder value
- **Required For**: Server-side operations, admin actions
- **How to Get**:
  1. Go to Supabase Dashboard
  2. Settings → API
  3. Copy "service_role" key (secret)
  4. Update `.env` file

### Storage Buckets 📦
Need to create:
- `listing-images` - For product photos
- `user-avatars` - For profile pictures
- `message-attachments` - For file uploads in messages
- `dispute-evidence` - For dispute documentation

**Storage Policies Needed:**
- Public read for listing images
- Authenticated read/write for user avatars
- Private for message attachments
- Restricted for dispute evidence

---

## 3. Stripe Integration

### Stripe Keys ✅
- Publishable Key: Configured
- Secret Key: Configured
- Webhook Secret: Configured

### Stripe Connect Setup ⚠️
**Requirements:**
1. Create Stripe Connect account
2. Enable "Standard" Connect type
3. Configure onboarding settings
4. Set up webhook endpoints

### Webhook Endpoints Needed
1. **Main Webhook**: `/api/webhooks/stripe`
   - Listen for: `payment_intent.*`, `checkout.session.*`, `account.*`, `payout.*`

2. **Connect Webhooks**:
   - `account.updated`
   - `account.application.deauthorized`
   - `capability.updated`

### Stripe Products to Configure
- Platform fees (percentage)
- Payment processing
- Payout schedules

---

## 4. Email Service (MISSING) ❌

### Current Status
- Supabase Edge Function created: `send-email`
- **NO EMAIL PROVIDER CONFIGURED**

### Options
1. **Resend** (Recommended)
   - Add to edge function
   - Get API key
   - Configure from domain

2. **SendGrid**
   - Alternative option
   - Configure API key

3. **Supabase Auth Emails**
   - Already configured for auth flows
   - Limited to auth only

### Required Email Templates
- Welcome email
- Booking confirmation
- Booking status updates
- Payment receipts
- Payout notifications
- Password reset
- Message notifications
- Review reminders

---

## 5. Authentication Setup

### Supabase Auth Configuration ✅
- Email/Password: Enabled by default
- Email confirmation: Disabled (as per design)

### Auth Flows Implemented
✅ Registration
✅ Login
✅ Password reset
✅ Update password
✅ Profile management

### Security Checklist
- [ ] Configure password strength requirements
- [ ] Set session timeout
- [ ] Configure MFA (optional)
- [ ] Set up auth rate limiting
- [ ] Configure allowed redirect URLs

---

## 6. API Routes Status

### Stripe API Routes ✅
- `/api/stripe/create-checkout-session` - Payment processing
- `/api/stripe/refund` - Refund handling
- `/api/stripe/connect/account` - Connect account creation
- `/api/stripe/connect/account-link` - Onboarding links
- `/api/stripe/connect/account-status` - Status checks
- `/api/webhooks/stripe` - Webhook handler

### Missing API Routes
- [ ] `/api/listings` - CRUD operations
- [ ] `/api/bookings` - Booking management
- [ ] `/api/reviews` - Review submission
- [ ] `/api/messages` - Messaging
- [ ] `/api/search` - Search functionality
- [ ] `/api/favorites` - Favorites management

---

## 7. Frontend Pages Status

### Public Pages ✅
- `/` - Homepage
- `/search` - Browse listings
- `/listing/[id]` - Listing details
- `/auth/*` - Auth flows

### User Pages ✅
- `/profile` - Profile management
- `/profile/settings` - User settings
- `/bookings` - Booking history
- `/bookings/[id]` - Booking details
- `/favorites` - Saved items
- `/messages` - Messaging

### Lender Pages ✅
- `/sell` - Lender dashboard
- `/sell/listings` - Manage listings
- `/sell/listings/new` - Create listing
- `/sell/listings/[id]/edit` - Edit listing
- `/sell/bookings` - Lender bookings
- `/sell/bookings/[id]` - Booking details
- `/sell/analytics` - Analytics dashboard
- `/sell/onboarding` - Stripe Connect onboarding

### Admin Pages ✅
- `/admin` - Admin dashboard
- `/admin/reports` - Reporting

---

## 8. Testing Requirements

### Database Testing
- [ ] Apply all migrations
- [ ] Test RLS policies
- [ ] Verify indexes work
- [ ] Test cascade deletes

### Authentication Testing
- [ ] Sign up new user
- [ ] Login existing user
- [ ] Password reset flow
- [ ] Profile updates
- [ ] Role-based access

### Booking Flow Testing
- [ ] Browse listings
- [ ] View listing details
- [ ] Create booking
- [ ] Process payment
- [ ] Confirm booking
- [ ] Complete booking
- [ ] Leave review

### Lender Flow Testing
- [ ] Connect Stripe account
- [ ] Create listing
- [ ] Upload images
- [ ] Set availability
- [ ] Receive booking
- [ ] Manage booking
- [ ] Receive payout

### Payment Testing
- [ ] Stripe test cards
- [ ] Payment success
- [ ] Payment failure
- [ ] Refund processing
- [ ] Payout processing

---

## 9. Production Deployment

### Environment Variables (Production)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (Production Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Evntori
```

### Pre-Deploy Checklist
- [ ] Update all environment variables to production values
- [ ] Switch Stripe to live mode
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure DNS records
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Configure error tracking
- [ ] Set up analytics (Google Analytics, Mixpanel, etc.)
- [ ] Configure backup strategy
- [ ] Set up CDN for images
- [ ] Test all critical flows in staging

### Stripe Production Setup
- [ ] Complete Stripe account verification
- [ ] Activate account
- [ ] Switch to live API keys
- [ ] Configure live webhook endpoints
- [ ] Set payout schedule
- [ ] Configure tax settings
- [ ] Set up Connect platform fees

---

## 10. Security & Compliance

### Security Checklist
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set security headers (CSP, etc.)
- [ ] Rate limiting on API routes
- [ ] Input validation on all forms
- [ ] XSS protection
- [ ] SQL injection protection (RLS)
- [ ] Secure file uploads
- [ ] API key rotation plan

### Legal Requirements
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie Policy
- [ ] GDPR compliance (if EU users)
- [ ] Data retention policy
- [ ] Right to deletion
- [ ] Data export capability

### PCI Compliance
✅ Handled by Stripe (no card data stored)

---

## 11. Performance Optimization

### Database
- [ ] Verify all indexes are created
- [ ] Set up connection pooling
- [ ] Monitor query performance
- [ ] Set up database backups

### Frontend
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Cache strategy
- [ ] CDN configuration

### API
- [ ] Response caching
- [ ] Rate limiting
- [ ] Pagination
- [ ] Query optimization

---

## 12. Monitoring & Logging

### Application Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] User analytics

### Business Metrics
- [ ] Booking conversion rate
- [ ] Revenue tracking
- [ ] User retention
- [ ] Lender activity

---

## 13. Launch Day Checklist

### Pre-Launch (T-24 hours)
- [ ] Final database backup
- [ ] Verify all migrations applied
- [ ] Test all critical paths
- [ ] Check all environment variables
- [ ] Verify Stripe webhooks
- [ ] Test email sending
- [ ] Verify storage buckets
- [ ] Check error tracking
- [ ] Review security settings

### Launch (T-0)
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Test homepage loads
- [ ] Test user registration
- [ ] Test listing creation
- [ ] Test booking flow
- [ ] Test payment processing
- [ ] Monitor error logs
- [ ] Check performance metrics

### Post-Launch (T+24 hours)
- [ ] Monitor error rates
- [ ] Check payment processing
- [ ] Verify emails sending
- [ ] Review user feedback
- [ ] Check database performance
- [ ] Monitor Stripe dashboard
- [ ] Review analytics

---

## Quick Start Commands

### Apply Database Migrations
```bash
# Using Supabase CLI (if installed)
supabase db push

# Or manually in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of each migration file
# 3. Run in order
```

### Update App Name
```bash
# Update .env file
NEXT_PUBLIC_APP_NAME=Evntori
```

### Build Project
```bash
npm run build
```

### Run Development Server
```bash
npm run dev
```

---

## Priority Order

### Immediate (Blocking Launch) 🔴
1. Apply all database migrations
2. Get Supabase service role key
3. Create storage buckets
4. Update app name in .env

### High Priority (Before Public Launch) 🟠
1. Set up email service
2. Configure Stripe Connect fully
3. Test complete booking flow
4. Set up error monitoring
5. Configure production Stripe keys

### Medium Priority (Post-Launch OK) 🟡
1. Set up analytics
2. Create missing API routes
3. Performance optimization
4. Advanced monitoring

### Low Priority (Nice to Have) 🟢
1. Admin dashboard enhancements
2. Analytics improvements
3. Additional features

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Connect Guide**: https://stripe.com/docs/connect

---

## Contact for Issues

If you encounter issues during setup:
1. Check Supabase logs
2. Check browser console
3. Check server logs
4. Verify all environment variables
5. Confirm migrations applied correctly
