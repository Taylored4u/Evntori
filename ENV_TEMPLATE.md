# Environment Variables Template

Copy this template to create your `.env.local` file.

## Required for Basic Demo

```bash
# ============================================
# SUPABASE (Database & Auth)
# ============================================
# These are already in .env - just copy them:
NEXT_PUBLIC_SUPABASE_URL=https://yzlmccsjpvgvgqzbfsib.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bG1jY3NqcHZndmdxemJmc2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTM4OTUsImV4cCI6MjA3NTEyOTg5NX0.nrdfE6hc7o03rYvnzTBVrNjQjsmWSZfHsz3gIyhR2EI

# Get this from: https://supabase.com/dashboard/project/yzlmccsjpvgvgqzbfsib/settings/api
# (Settings → API → service_role key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bG1jY3NqcHZndmdxemJmc2liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1Mzg5NSwiZXhwIjoyMDc1MTI5ODk1fQ.PASTE_YOUR_SERVICE_ROLE_KEY_HERE

# ============================================
# STRIPE (Payment Processing)
# ============================================
# Get these from: https://dashboard.stripe.com/test/apikeys

# Secret Key (starts with sk_test_)
STRIPE_SECRET_KEY=sk_test_PASTE_YOUR_SECRET_KEY_HERE

# Publishable Key (starts with pk_test_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_PUBLISHABLE_KEY_HERE

# Webhook Secret (starts with whsec_)
# Get this AFTER setting up webhook endpoint
# See STRIPE_CHECKLIST.md for instructions
STRIPE_WEBHOOK_SECRET=whsec_PASTE_AFTER_WEBHOOK_SETUP

# ============================================
# APP CONFIGURATION
# ============================================
# For local development:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production, change to:
# NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## How to Get Each Key

### 1. Supabase Service Role Key
**Where:** https://supabase.com/dashboard/project/yzlmccsjpvgvgqzbfsib/settings/api
**Steps:**
1. Log into Supabase
2. Open your project
3. Go to Settings → API
4. Find "service_role" key
5. Click "Reveal" and copy
6. Paste above

**⚠️ Important:** Keep this secret! Never expose in client code.

### 2. Stripe Secret Key
**Where:** https://dashboard.stripe.com/test/apikeys
**Steps:**
1. Log into Stripe (create account if needed)
2. Make sure you're in "Test mode" (toggle in top right)
3. Go to Developers → API keys
4. Find "Secret key"
5. Click "Reveal test key token"
6. Copy and paste above

**Format:** `sk_test_51A1B2C...`

### 3. Stripe Publishable Key
**Where:** Same page as secret key
**Steps:**
1. On the same API keys page
2. Find "Publishable key"
3. Copy (no need to reveal, it's public)
4. Paste above

**Format:** `pk_test_51A1B2C...`

### 4. Stripe Webhook Secret
**Where:** https://dashboard.stripe.com/test/webhooks
**Steps:**
1. Click "Add endpoint"
2. Endpoint URL: `http://localhost:3000/api/webhooks/stripe` (for local)
3. Or: `https://your-domain.com/api/webhooks/stripe` (for production)
4. Select events:
   - checkout.session.completed
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.refunded
   - account.updated
   - payout.paid
   - payout.failed
   - charge.dispute.created
5. Click "Add endpoint"
6. Copy "Signing secret"
7. Paste above

**Format:** `whsec_A1B2C3...`

**Note:** For local development, you can use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the signing secret it shows
```

## Quick Copy-Paste Template

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yzlmccsjpvgvgqzbfsib.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bG1jY3NqcHZndmdxemJmc2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTM4OTUsImV4cCI6MjA3NTEyOTg5NX0.nrdfE6hc7o03rYvnzTBVrNjQjsmWSZfHsz3gIyhR2EI
SUPABASE_SERVICE_ROLE_KEY=

# Stripe  
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Verification

After adding all keys, verify they work:

```bash
# Start the app
npm run dev

# Test these features:
1. User registration (tests Supabase auth)
2. View listings (tests Supabase database)
3. Upload image (tests Supabase storage)
4. Complete booking (tests Stripe)
5. Check email (tests webhook)
```

## Troubleshooting

**"Missing environment variable"**
- Make sure file is named `.env.local` (not `.env.local.txt`)
- Restart dev server after adding keys
- Check for typos in variable names

**"Invalid API key"**
- Make sure you copied the complete key
- Verify you're using test keys (not live)
- Check for extra spaces

**"Webhook signature verification failed"**
- Make sure webhook secret is correct
- Use Stripe CLI for local testing
- Check webhook endpoint URL is correct

## Security Notes

**✅ Safe to commit:**
- NEXT_PUBLIC_* variables (these are public)

**❌ NEVER commit:**
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

**Your .gitignore already excludes:**
- `.env.local`
- `.env*.local`
- All .env files except .env

**Keep your keys secure!**
