# 🚀 Quick Start Guide - KnotAgain Marketplace

## TL;DR - Get Demo Running in 10 Minutes

### Prerequisites
- Node.js 16+ installed
- A Stripe account (free, takes 2 min)

### Steps

1. **Clone & Install**
```bash
npm install
```

2. **Get Stripe Keys** (2 minutes)
   - Go to https://dashboard.stripe.com/register
   - Sign up / Log in
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy both keys

3. **Create `.env.local`**
```bash
# Copy these (already in .env)
NEXT_PUBLIC_SUPABASE_URL=https://yzlmccsjpvgvgqzbfsib.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bG1jY3NqcHZndmdxemJmc2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTM4OTUsImV4cCI6MjA3NTEyOTg5NX0.nrdfE6hc7o03rYvnzTBVrNjQjsmWSZfHsz3gIyhR2EI

# Get from Supabase (ask if you need help)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Add your Stripe keys here
STRIPE_SECRET_KEY=sk_test_PASTE_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_KEY_HERE

# For webhook (we'll set this up later)
STRIPE_WEBHOOK_SECRET=whsec_PASTE_HERE_AFTER_SETUP

# Local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Run the app**
```bash
npm run dev
```

5. **Open browser**
```
http://localhost:3000
```

## 🎯 What Works Right Now (Without Stripe)

### ✅ Fully Functional:
- Browse listings
- Search & filter
- User registration/login
- Create lender profile (partially - Stripe Connect step will fail)
- Create & manage listings
- View listing details
- Messaging between users
- Reviews & ratings
- Admin dashboard
- User profiles

### ❌ Requires Stripe Keys:
- Complete bookings
- Process payments
- Lender onboarding (Stripe Connect)
- Refunds
- Payouts

## 🎮 Demo Scenarios

### Scenario 1: Browse & Explore (No Keys Needed)
```
1. Open http://localhost:3000
2. Click "Browse Collection"
3. View available listings
4. Use search & filters
5. Click a listing to see details
```

### Scenario 2: User Registration (No Keys Needed)
```
1. Click "Sign In" → "Create Account"
2. Enter email & password
3. Complete profile
4. You're logged in!
```

### Scenario 3: Full Booking Flow (Requires Stripe)
```
1. Sign up as a customer
2. Find a listing
3. Click "Check Availability & Book"
4. Select dates and options
5. Click "Proceed to Checkout"
6. Use test card: 4242 4242 4242 4242
7. Complete payment
8. View confirmed booking
9. Check email confirmations
```

### Scenario 4: Become a Lender (Requires Stripe)
```
1. Sign up/login
2. Click "Become a Lender"
3. Complete lender profile
4. Connect Stripe account
5. Create your first listing
6. Start receiving bookings!
```

## 🔧 Setup Stripe (5 minutes)

### Step 1: Get API Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (`pk_test_...`)
3. Copy **Secret key** (`sk_test_...`)
4. Add both to `.env.local`

### Step 2: Enable Stripe Connect
1. Go to https://dashboard.stripe.com/settings/connect
2. Click **Get Started**
3. Choose **Express** account type
4. Complete setup

### Step 3: Set Up Webhooks (Optional for local, required for production)

**For Local Testing with Stripe CLI:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # Mac
# or
scoop install stripe  # Windows

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the signing secret shown (whsec_...)
# Add to .env.local as STRIPE_WEBHOOK_SECRET
```

**For Production:**
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events (see STRIPE_CHECKLIST.md)
4. Copy signing secret

### Step 4: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

## ✅ Verification Checklist

After setup, verify these work:

**Without Stripe:**
- [ ] App loads at localhost:3000
- [ ] Can create account
- [ ] Can view listings
- [ ] Can search & filter

**With Stripe Keys:**
- [ ] Can complete Stripe Connect onboarding
- [ ] Can create listings as lender
- [ ] Can make a booking as renter
- [ ] Payment goes through with test card
- [ ] Booking marked as "confirmed"
- [ ] Both parties receive emails

## 🚨 Troubleshooting

### Issue: "Missing Stripe Keys"
**Solution:** Make sure `.env.local` exists and has both:
- `STRIPE_SECRET_KEY=sk_test_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`

### Issue: "Webhook signature verification failed"
**Solution:**
1. For local dev: Use Stripe CLI forwarding
2. Or temporarily disable verification (not recommended)
3. Or skip webhooks for initial demo (bookings won't auto-confirm)

### Issue: "Booking not confirming"
**Solution:**
- Check webhooks are set up
- Use Stripe CLI for local testing
- Or manually update booking status in database

### Issue: Build fails
**Solution:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

## 📚 Next Steps

Once basic demo works:

1. **Read DEPLOYMENT_GUIDE.md** - Deploy to production
2. **Read STRIPE_CHECKLIST.md** - Understand Stripe integration
3. **Customize branding** - Update logo, colors, copy
4. **Add test data** - Create sample listings
5. **Test all flows** - Go through each user journey
6. **Deploy to Vercel** - Go live!

## 🎓 Learning Resources

- **App Overview:** See README.md
- **Architecture:** See ARCHITECTURE.md
- **Database Schema:** See DATABASE_SCHEMA.md
- **Stripe Setup:** See STRIPE_CHECKLIST.md
- **Deployment:** See DEPLOYMENT_GUIDE.md

## 💡 Tips for Demo

**To impress during demo:**
1. **Prepare test accounts:** Create both renter & lender accounts
2. **Add sample listings:** Create 5-10 beautiful listings with images
3. **Show full flow:** Demonstrate complete booking process
4. **Highlight features:** Search, messaging, reviews, admin dashboard
5. **Use real-looking data:** Actual wedding decor items, realistic prices

**Demo Script:**
```
1. Show homepage - elegant design
2. Browse & search - powerful filtering
3. View listing details - rich information
4. Sign in as renter - smooth auth
5. Complete booking - Stripe checkout
6. Show messaging - real-time chat
7. Leave review - 5-star rating system
8. Switch to lender view - manage bookings
9. Show admin panel - platform oversight
```

## 🎉 You're Ready!

With Stripe keys added, you have a **fully functional marketplace** ready to demo or deploy.

### What You Built:
- ✅ Complete rental marketplace
- ✅ Multi-party payment system
- ✅ Real-time messaging
- ✅ Review & rating system
- ✅ Admin dashboard
- ✅ Search & filtering
- ✅ Email notifications
- ✅ Mobile responsive
- ✅ Production-ready code

### Time to Launch:
```bash
# Test locally
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel deploy --prod
```

---

**Questions?** Check the other guides or the code - everything is documented!

**Ready to launch?** Follow DEPLOYMENT_GUIDE.md

**Need help with Stripe?** See STRIPE_CHECKLIST.md

🚀 Happy demoing!
