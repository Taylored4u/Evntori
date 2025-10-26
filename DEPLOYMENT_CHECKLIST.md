# Evntori Deployment Checklist

## Pre-Deployment Setup

### 1. Prepare Git Repository

- [ ] Initialize git repository (if not done)
  ```bash
  git init
  ```

- [ ] Add all files
  ```bash
  git add .
  ```

- [ ] Create initial commit
  ```bash
  git commit -m "Initial commit - Evntori marketplace"
  ```

- [ ] Create GitHub repository at https://github.com/new

- [ ] Add remote and push
  ```bash
  git remote add origin <your-github-repo-url>
  git push -u origin main
  ```

### 2. Verify Environment Variables

Ensure your `.env` file has all required values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hgrciuecuokxgqczriab.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=<get-from-supabase-dashboard>

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

# Resend Email
RESEND_API_KEY=re_BKP5yTit_FHGoG2YCvtyPwNTrAQ32cxZN
FROM_EMAIL=onboarding@resend.dev

# App Configuration
NEXT_PUBLIC_APP_URL=<will-be-your-vercel-url>
NEXT_PUBLIC_APP_NAME=Evntori
```

---

## Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

#### Step 1: Import Project

- [ ] Go to https://vercel.com/new
- [ ] Click **"Import Git Repository"**
- [ ] Select your GitHub repository
- [ ] Vercel will auto-detect Next.js configuration

#### Step 2: Configure Environment Variables

Add these in the Vercel dashboard under **"Environment Variables"**:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://hgrciuecuokxgqczriab.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `<get-from-supabase>`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_51SJhL1BN...`
- [ ] `STRIPE_SECRET_KEY` = `sk_test_51SJhL1BN...`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_rlxHko4AhRH...`
- [ ] `RESEND_API_KEY` = `re_BKP5yTit_FHGoG2YCv...`
- [ ] `FROM_EMAIL` = `onboarding@resend.dev`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://your-project.vercel.app` (temp, update after)
- [ ] `NEXT_PUBLIC_APP_NAME` = `Evntori`

#### Step 3: Deploy

- [ ] Click **"Deploy"**
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Copy your deployment URL

#### Step 4: Update App URL

- [ ] Go to Vercel project settings → Environment Variables
- [ ] Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
- [ ] Redeploy from Vercel dashboard

### Option B: Via Vercel CLI

- [ ] Install Vercel CLI (already installed)
  ```bash
  npm install -g vercel
  ```

- [ ] Login to Vercel
  ```bash
  vercel login
  ```

- [ ] Deploy
  ```bash
  vercel
  ```

- [ ] Follow prompts:
  - Set up and deploy? **Y**
  - Which scope? Select your account
  - Link to existing project? **N**
  - Project name? **evntori** (or your choice)
  - Directory? **./**: **./** (press Enter)
  - Override settings? **N**

- [ ] Add environment variables via CLI or dashboard

- [ ] Deploy to production
  ```bash
  vercel --prod
  ```

---

## Post-Deployment Configuration

### 1. Get Supabase Service Role Key

- [ ] Go to https://supabase.com/dashboard/project/hgrciuecuokxgqczriab/settings/api
- [ ] Copy the **service_role** key (under "Project API keys")
- [ ] Add to Vercel environment variables
- [ ] Redeploy

### 2. Configure Supabase Secrets for Edge Function

- [ ] Go to https://supabase.com/dashboard/project/hgrciuecuokxgqczriab/settings/functions
- [ ] Add secret: `RESEND_API_KEY` = `re_BKP5yTit_FHGoG2YCvtyPwNTrAQ32cxZN`
- [ ] Add secret: `FROM_EMAIL` = `onboarding@resend.dev`

### 3. Configure Stripe Webhooks

#### Development Webhook (for testing)
- [ ] Go to https://dashboard.stripe.com/test/webhooks
- [ ] Click **"Add endpoint"**
- [ ] Endpoint URL: `https://your-project.vercel.app/api/webhooks/stripe`
- [ ] Select events to listen to:
  - [x] `checkout.session.completed`
  - [x] `checkout.session.expired`
  - [x] `payment_intent.succeeded`
  - [x] `payment_intent.payment_failed`
  - [x] `payment_intent.canceled`
  - [x] `charge.refunded`
  - [x] `account.updated`
  - [x] `account.application.deauthorized`
  - [x] `capability.updated`
  - [x] `payout.paid`
  - [x] `payout.failed`
- [ ] Click **"Add endpoint"**
- [ ] Copy the **signing secret** (starts with `whsec_`)
- [ ] Update `STRIPE_WEBHOOK_SECRET` in Vercel
- [ ] Redeploy

### 4. Enable Stripe Connect

- [ ] Go to https://dashboard.stripe.com/connect/accounts/overview
- [ ] Click **"Get started"**
- [ ] Select **"Standard"** account type
- [ ] Complete the platform profile
- [ ] Set redirect URLs:
  - Success: `https://your-project.vercel.app/sell/onboarding/success`
  - Refresh: `https://your-project.vercel.app/sell/onboarding/refresh`

### 5. Update Allowed URLs in Supabase

- [ ] Go to https://supabase.com/dashboard/project/hgrciuecuokxgqczriab/auth/url-configuration
- [ ] Add your Vercel URL to **"Site URL"**
- [ ] Add to **"Redirect URLs"**:
  - `https://your-project.vercel.app/*`
  - `https://your-project.vercel.app/auth/callback`

### 6. Test Email Service

Test that emails work:

```bash
curl -X POST https://hgrciuecuokxgqczriab.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<h1>Test from Evntori</h1>",
    "type": "booking"
  }'
```

- [ ] Check your email inbox
- [ ] Verify email received

---

## Testing Checklist

### Authentication Flow
- [ ] Visit your Vercel URL
- [ ] Click **"Sign Up"**
- [ ] Create new account
- [ ] Verify login works
- [ ] Test password reset flow
- [ ] Test profile updates

### Lender Flow
- [ ] Login as test user
- [ ] Go to `/sell/onboarding`
- [ ] Complete Stripe Connect onboarding
- [ ] Create a test listing
- [ ] Upload images
- [ ] Set availability
- [ ] Publish listing

### Renter Flow
- [ ] Open incognito window
- [ ] Create different test account
- [ ] Search for listings
- [ ] View listing details
- [ ] Add to favorites
- [ ] Create booking
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete checkout
- [ ] Verify booking confirmation

### Payment Testing
- [ ] Test successful payment
- [ ] Test declined card: `4000 0000 0000 0002`
- [ ] Test payment requiring authentication: `4000 0025 0000 3155`
- [ ] Check Stripe dashboard for transactions
- [ ] Test refund process

### Messaging
- [ ] Send message between lender/renter
- [ ] Verify real-time updates
- [ ] Test file attachments

### Reviews
- [ ] Complete a booking
- [ ] Leave a review
- [ ] Verify review appears on listing

---

## Production Deployment (Going Live)

### 1. Switch to Stripe Live Mode

- [ ] Go to Stripe Dashboard
- [ ] Toggle to **"Live mode"** (top right)
- [ ] Get new live API keys from https://dashboard.stripe.com/apikeys
- [ ] Update Vercel environment variables:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
  - `STRIPE_SECRET_KEY` → `sk_live_...`
- [ ] Create new webhook for live mode
- [ ] Update `STRIPE_WEBHOOK_SECRET` → new live webhook secret
- [ ] Redeploy

### 2. Custom Domain (Optional)

- [ ] Purchase domain (Namecheap, Google Domains, etc.)
- [ ] Add domain in Vercel project settings
- [ ] Update DNS records as instructed by Vercel
- [ ] Wait for DNS propagation (can take 24-48 hours)
- [ ] Update `NEXT_PUBLIC_APP_URL` to your custom domain
- [ ] Update Stripe webhook URL to custom domain
- [ ] Update Supabase allowed URLs to custom domain
- [ ] Redeploy

### 3. Configure Production Email

- [ ] Update `FROM_EMAIL` to your domain (e.g., `hello@yourdomain.com`)
- [ ] Verify domain in Resend dashboard
- [ ] Add DNS records for email authentication (SPF, DKIM)
- [ ] Update Supabase secret `FROM_EMAIL`
- [ ] Test email sending with new domain

### 4. Security Hardening

- [ ] Enable HTTPS only (Vercel does this by default)
- [ ] Review CORS settings
- [ ] Set up rate limiting (Vercel Pro feature)
- [ ] Enable DDoS protection
- [ ] Review Supabase RLS policies
- [ ] Set up monitoring/alerts

### 5. Performance Optimization

- [ ] Enable Vercel Analytics
- [ ] Set up error tracking (Sentry)
- [ ] Configure caching headers
- [ ] Optimize images (use Vercel Image Optimization)
- [ ] Review and optimize database queries
- [ ] Set up CDN for static assets

### 6. Legal & Compliance

- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Add Cookie Policy (if using cookies)
- [ ] GDPR compliance (if serving EU)
- [ ] Display Stripe merchant terms
- [ ] Add contact information
- [ ] Set up support email

### 7. Monitoring & Analytics

- [ ] Set up Google Analytics or alternative
- [ ] Configure Supabase monitoring
- [ ] Set up Stripe revenue tracking
- [ ] Create alerting for critical errors
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure log retention

---

## Rollback Plan

If something goes wrong:

### Quick Rollback via Vercel
- [ ] Go to Vercel project → Deployments
- [ ] Find last working deployment
- [ ] Click three dots → "Promote to Production"

### Emergency Contacts
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Stripe Support: https://support.stripe.com

---

## Launch Day Checklist

### Pre-Launch (T-24 hours)
- [ ] Complete all testing above
- [ ] Verify all environment variables
- [ ] Test all critical user paths
- [ ] Check error logs are clean
- [ ] Verify email sending works
- [ ] Test payment processing end-to-end
- [ ] Backup database
- [ ] Prepare rollback plan

### Launch (T-0)
- [ ] Switch to Stripe live mode
- [ ] Update all API keys
- [ ] Verify custom domain works (if using)
- [ ] Test homepage loads
- [ ] Test user registration
- [ ] Test listing creation
- [ ] Test booking flow
- [ ] Monitor error logs

### Post-Launch (T+1 hour)
- [ ] Check error rates in logs
- [ ] Verify payments processing
- [ ] Check email delivery
- [ ] Monitor server performance
- [ ] Review user feedback

### Post-Launch (T+24 hours)
- [ ] Review analytics
- [ ] Check payment dashboard
- [ ] Monitor support requests
- [ ] Analyze user behavior
- [ ] Plan improvements

---

## Useful Commands

### Check deployment status
```bash
vercel ls
```

### View deployment logs
```bash
vercel logs <deployment-url>
```

### Redeploy production
```bash
vercel --prod
```

### Pull environment variables
```bash
vercel env pull
```

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Stripe Connect**: https://stripe.com/docs/connect
- **Resend Docs**: https://resend.com/docs

---

## Troubleshooting

### Build fails on Vercel
- Check build logs in Vercel dashboard
- Verify all dependencies in package.json
- Ensure TypeScript compiles locally: `npm run build`
- Check environment variables are set

### Stripe webhooks not working
- Verify webhook URL is correct
- Check webhook signing secret matches
- View webhook logs in Stripe dashboard
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Emails not sending
- Verify Resend API key is correct
- Check Supabase function logs
- Verify FROM_EMAIL is valid
- Test with curl command above

### Database connection issues
- Verify Supabase URL and keys
- Check RLS policies aren't blocking queries
- Review Supabase logs
- Ensure service role key is set for server operations

### Users can't upload images
- Verify storage buckets exist
- Check storage policies
- Verify file size limits
- Check browser console for errors

---

## Next Steps After Deployment

1. Monitor application health for first 24-48 hours
2. Collect user feedback
3. Plan feature improvements based on usage
4. Set up regular database backups
5. Create maintenance schedule
6. Document common issues and solutions
7. Plan marketing/launch strategy
8. Set up customer support workflow

---

## Deployment Complete!

Once all checkboxes are complete, your Evntori marketplace is live and ready for users.

Remember to:
- Monitor closely during first week
- Respond to user feedback quickly
- Keep Stripe dashboard handy for payment issues
- Check error logs daily
- Celebrate your launch!
