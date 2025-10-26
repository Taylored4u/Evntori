# KnotAgain Marketplace - Deployment Guide

## 🚀 Quick Start for Demo/Production

This guide will walk you through deploying KnotAgain with all features working.

## ✅ Current Status

Your app is **production-ready** with all features built and tested. The build passes successfully.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Required

Create a `.env.local` file (or configure in your hosting platform) with these variables:

```bash
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://yzlmccsjpvgvgqzbfsib.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe (Required for payments)
STRIPE_SECRET_KEY=sk_test_... (get from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (get from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_... (get after setting up webhook)

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com (or http://localhost:3000 for local)
```

### 2. Stripe Setup (Required for Full Demo)

#### A. Create Stripe Account
1. Go to https://stripe.com and sign up
2. Complete business verification (can use test mode for demo)

#### B. Get API Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** → Add to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy **Secret key** → Add to `STRIPE_SECRET_KEY`

#### C. Enable Stripe Connect
1. Go to https://dashboard.stripe.com/settings/connect
2. Enable **Express accounts** (for lender payouts)
3. Configure branding and settings
4. Add redirect URLs:
   - Success: `https://your-domain.com/sell/onboarding/success`
   - Refresh: `https://your-domain.com/sell/onboarding/refresh`

#### D. Set Up Webhooks
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `account.updated`
   - `payout.paid`
   - `payout.failed`
   - `charge.dispute.created`
5. Copy **Signing secret** → Add to `STRIPE_WEBHOOK_SECRET`

### 3. Supabase Configuration

Your Supabase instance is already set up with:
- ✅ Database schema with 25+ tables
- ✅ Row Level Security policies
- ✅ Storage buckets for images
- ✅ Authentication enabled

**Additional Steps:**
1. Get Service Role Key:
   - Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
   - Copy **service_role key** → Add to `SUPABASE_SERVICE_ROLE_KEY`

2. Configure Storage:
   - Storage buckets (`listing-images`, `profile-images`) are already created
   - Ensure public access is enabled for image buckets

3. Email Settings (Optional but recommended):
   - Go to Authentication > Email Templates
   - Customize email templates
   - Configure SMTP for production emails

## 🎯 Deployment Options

### Option 1: Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repo
   - Add all environment variables
   - Deploy

3. **Update URLs:**
   - Get your Vercel URL (e.g., `your-app.vercel.app`)
   - Update `NEXT_PUBLIC_APP_URL` in environment variables
   - Update Stripe webhook URL
   - Update Stripe Connect redirect URLs

### Option 2: Netlify

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Add all environment variables
4. Update webhook and redirect URLs

### Option 3: Local Demo

For a quick local demo:

```bash
# Install dependencies
npm install

# Create .env.local with all variables
# (copy from example above)

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🧪 Testing the Demo

### Without Stripe (Limited Demo)
You can demo these features without Stripe:
- ✅ Browse listings
- ✅ Search & filtering
- ✅ User authentication
- ✅ Create lender account (onboarding will fail at Stripe step)
- ✅ Create listings
- ✅ View listing details
- ✅ Messaging
- ✅ Reviews
- ✅ Admin dashboard
- ❌ Cannot complete bookings/payments

### With Stripe Test Mode (Full Demo)
With Stripe configured in test mode:
- ✅ Complete full booking flow
- ✅ Test payments with Stripe test cards
- ✅ Lender onboarding with payouts
- ✅ Refunds
- ✅ All payment features

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Any future expiry date, any 3-digit CVC

## 📊 Database Migrations

All migrations are already applied. If you need to reset:

```bash
# View migrations
ls supabase/migrations/

# Migrations are auto-applied in Supabase dashboard
# Or use Supabase CLI to reset
```

## 🔒 Security Checklist

Before going live:
- ✅ All RLS policies are enabled
- ✅ Service role key is not exposed to client
- ✅ Stripe webhook signature verification is enabled
- ✅ Authentication is required for protected routes
- ✅ File uploads are validated
- ⚠️ Review and update CORS settings if needed
- ⚠️ Enable rate limiting for production
- ⚠️ Set up monitoring and error tracking (Sentry, etc.)

## 🎨 Customization

Before demo/launch:
1. **Branding:**
   - Update logo in navbar/footer
   - Update site name (currently "KnotAgain")
   - Update hero images (currently using Unsplash)

2. **Content:**
   - Update homepage copy
   - Add real categories with images
   - Seed initial listings

3. **Settings:**
   - Configure platform fee (currently 10%)
   - Update cancellation policies
   - Set minimum/maximum rental durations

## 🚦 Stripe Best Practices Compliance

Your implementation follows Stripe best practices:

✅ **Security:**
- Webhook signature verification
- Server-side payment processing
- No sensitive keys exposed to client
- PCI compliance (using Stripe Checkout)

✅ **Connect:**
- Express accounts for simplified onboarding
- Platform fee collection (10%)
- Direct charges to connected accounts
- Account status monitoring

✅ **Webhooks:**
- Comprehensive event handling
- Idempotency checks
- Error logging
- Audit trail

✅ **User Experience:**
- Hosted Checkout for payments
- Clear payment status updates
- Automatic email notifications
- Refund support

## 📈 Post-Launch

After deployment:
1. Monitor webhook logs
2. Test full user journeys
3. Check email delivery
4. Monitor Supabase usage
5. Set up backups
6. Configure domain and SSL

## ❓ Common Issues

**Stripe webhooks not working:**
- Ensure webhook URL is correct
- Verify webhook secret is set
- Check webhook signature verification
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

**Images not uploading:**
- Check Supabase storage policies
- Verify bucket names match code
- Ensure file size limits

**Authentication issues:**
- Verify Supabase URL and anon key
- Check RLS policies
- Ensure email confirmation is disabled (for demo)

## 🎉 Ready to Demo!

Once you have:
1. ✅ Supabase service role key added
2. ✅ Stripe keys configured
3. ✅ Webhooks set up
4. ✅ App deployed

Your marketplace will have:
- Full booking and payment flow
- Lender payouts via Stripe Connect
- Real-time messaging
- Review system
- Admin dashboard
- And all other features!

## 📞 Need Help?

Check these resources:
- Stripe Docs: https://stripe.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**Next Steps:**
1. Get Stripe API keys
2. Add all environment variables
3. Deploy to Vercel
4. Test the full flow
5. Demo away! 🚀
