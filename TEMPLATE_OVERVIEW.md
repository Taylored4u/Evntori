# Marketplace Platform Template

**Version:** 1.0.0
**Last Updated:** October 2025
**Status:** Production-Ready

## Overview

This is a complete, production-ready two-sided marketplace platform template. Originally built as a luxury wedding rental marketplace (KnotAgain), it's designed to be easily adapted for any peer-to-peer or B2C marketplace model including:

- Equipment rental marketplaces
- Service provider platforms
- Small business CRM marketplaces
- Freelance/gig economy platforms
- Product rental/sharing platforms
- Event/venue booking platforms

## What's Included

### ✅ Complete Feature Set

**User Management:**
- Full authentication system (email/password, password reset)
- User profiles with customizable fields
- Role-based access (buyers, sellers, admins)
- Email preferences and notification settings

**Marketplace Core:**
- Product/service listings with unlimited images
- Advanced search with filters (category, price, location, dates)
- Availability calendar system
- Variants and add-ons support
- Favorites/wishlist functionality
- Review and rating system (two-sided)

**Booking/Transaction Flow:**
- Multi-step booking process
- Dynamic pricing calculations
- Security deposit handling
- Stripe payment processing
- Stripe Connect for seller payouts
- Automated booking lifecycle management

**Communication:**
- Real-time messaging between users
- Conversation threading per listing
- Unread message tracking
- Message notifications

**Notifications:**
- In-app notification system
- Real-time updates via WebSocket
- Database triggers for automatic notifications
- Notification preferences per user
- Email notification infrastructure (ready to extend)

**Seller Dashboard:**
- Stripe Connect onboarding
- Listing management (CRUD operations)
- Booking management
- Analytics and revenue tracking
- Availability management
- Payout tracking

**Admin Panel:**
- User management
- Listing moderation
- Booking oversight
- Analytics and reporting
- Dispute resolution system
- Audit logging

### 🏗️ Technical Architecture

**Frontend:**
- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui components
- React Hook Form + Zod validation
- Client and server components optimized

**Backend:**
- Supabase PostgreSQL database
- Row Level Security (RLS) on all tables
- Database triggers for automation
- Supabase Edge Functions for serverless logic
- Real-time subscriptions

**Payments:**
- Stripe Checkout
- Stripe Connect Express (for sellers)
- Webhook handling
- Refund processing
- Deposit authorization/capture

**Storage:**
- Supabase Storage for images
- Optimized image upload/serving

### 📊 Database Schema

**30+ Tables Including:**
- Users & Profiles
- Listings & Variants
- Categories & Tags
- Bookings & Payments
- Messages & Conversations
- Reviews & Ratings
- Notifications
- Admin & Audit Logs
- Favorites & Saved Searches

All tables have:
- Proper indexes for performance
- Foreign key relationships
- Full RLS policies
- Soft delete support where needed

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 13.5.1 |
| Language | TypeScript | 5.2.2 |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | Latest |
| Payments | Stripe | Latest |
| Styling | Tailwind CSS | 3.3.3 |
| UI Components | shadcn/ui | Latest |
| Forms | React Hook Form | 7.53.0 |
| Validation | Zod | 3.23.8 |
| Icons | Lucide React | 0.446.0 |

## File Structure

```
project/
├── app/                          # Next.js pages
│   ├── (auth)/                  # Authentication pages
│   ├── (marketplace)/           # Public marketplace pages
│   ├── (seller)/                # Seller dashboard pages
│   ├── (admin)/                 # Admin panel pages
│   └── api/                     # API routes
├── components/                   # React components
│   ├── ui/                      # Base UI components (shadcn)
│   ├── layout/                  # Layout components (navbar, footer)
│   ├── listing/                 # Listing-related components
│   ├── messages/                # Messaging components
│   ├── notifications/           # Notification components
│   ├── payments/                # Payment components
│   ├── reviews/                 # Review components
│   └── analytics/               # Analytics components
├── lib/                         # Utility functions and configs
│   ├── supabase/               # Supabase client configs
│   ├── stripe/                 # Stripe configurations
│   ├── auth/                   # Auth context and actions
│   ├── validations/            # Zod schemas
│   └── utils/                  # Helper functions
├── supabase/                    # Supabase configurations
│   ├── migrations/             # Database migrations (10 files)
│   └── functions/              # Edge functions
├── types/                       # TypeScript type definitions
└── public/                      # Static assets
```

## Key Features Breakdown

### 1. Authentication System
- Email/password authentication via Supabase Auth
- Password reset flow with secure tokens
- Protected routes with middleware
- Session management
- Auth context provider for easy access

### 2. Listing Management
- Rich listing creation form
- Multiple image upload with drag-and-drop
- Image reordering and cover selection
- Variant management (sizes, colors, etc.)
- Add-on services
- Dynamic pricing rules
- Availability blocking
- Status management (active, paused, draft)

### 3. Search & Discovery
- Full-text search
- Multi-criteria filtering
- Category browsing
- Date availability filtering
- Location-based search
- Sort options (price, popularity, newest)
- Saved searches

### 4. Booking Flow
- Date selection with blocked dates
- Quantity selection
- Variant/add-on selection
- Real-time price calculation
- Duration enforcement (min/max)
- Booking summary
- Secure checkout

### 5. Payment Processing
- Stripe Checkout integration
- Split payments (platform fee + seller payout)
- Security deposit authorization
- Deposit release on completion
- Refund processing
- Payment status tracking
- Webhook event handling

### 6. Messaging System
- Real-time messaging
- Conversation threading
- Unread indicators
- Message persistence
- Auto-scroll to latest
- Desktop and mobile responsive

### 7. Notification System
- Database-driven notifications
- Real-time updates
- Multiple notification types
- Read/unread tracking
- Deep linking to relevant pages
- User preferences
- Email notification ready

### 8. Review System
- Two-sided reviews (buyer and seller)
- Star ratings (1-5)
- Written feedback
- Review prompts after booking
- Average rating calculation
- Review moderation

### 9. Admin Dashboard
- User management
- Listing oversight
- Booking monitoring
- Revenue analytics
- Dispute resolution
- System health monitoring

## Adaptation Guide

### To Adapt for Your Use Case:

#### 1. Rename Core Concepts
Current → Your Use Case:
- `listings` → `products` / `services` / `properties`
- `bookings` → `orders` / `appointments` / `reservations`
- `lender` → `seller` / `provider` / `vendor`
- `renter` → `buyer` / `customer` / `client`

#### 2. Modify Database Schema
- Review `supabase/migrations/` files
- Add/remove fields specific to your domain
- Update RLS policies as needed
- Keep core relationships intact

#### 3. Update UI Copy
- Search and replace domain-specific terms
- Update page titles and descriptions
- Modify email templates
- Update help text

#### 4. Customize Data Models
- Edit `types/database.ts` for TypeScript types
- Update `lib/validations/` schemas
- Modify form fields in components

#### 5. Adjust Business Logic
- Pricing calculations
- Fee structures
- Booking rules
- Cancellation policies

#### 6. Brand Customization
- Update colors in `tailwind.config.ts`
- Replace logo and favicon
- Modify fonts if desired
- Update footer links

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional (for production)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Setup Instructions

### 1. Initial Setup
```bash
# Clone/copy template
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### 2. Database Setup
```bash
# Supabase migrations are already created
# They will be auto-applied when you connect to Supabase

# Or manually run migrations in Supabase Dashboard
# SQL Editor → Run each migration file in order
```

### 3. Stripe Setup
1. Create Stripe account
2. Enable Stripe Connect
3. Get API keys (test mode)
4. Set up webhooks pointing to `/api/webhooks/stripe`
5. Add webhook secret to environment

### 4. Development
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Production Build
```bash
npm run build
npm start
```

## Deployment

### Recommended: Vercel
1. Connect GitHub repository
2. Add environment variables
3. Deploy

### Alternative: Any Node.js Host
1. Build: `npm run build`
2. Start: `npm start`
3. Ensure environment variables are set

## Security Features

✅ Row Level Security on all database tables
✅ Server-side validation for all mutations
✅ Stripe webhook signature verification
✅ XSS protection via React
✅ CSRF tokens for sensitive operations
✅ Secure session management
✅ SQL injection prevention (parameterized queries)
✅ API rate limiting ready
✅ Audit logging for admin actions

## Performance Optimizations

✅ Server Components for static content
✅ Client Components only where needed
✅ Image optimization with Next.js Image
✅ Database query optimization with indexes
✅ Real-time subscriptions for live updates
✅ Pagination for large datasets
✅ Lazy loading for images
✅ Code splitting

## Testing Recommendations

### Manual Testing Checklist:
- [ ] User registration and login
- [ ] Create listing (with images, variants)
- [ ] Search and filter
- [ ] Complete booking flow
- [ ] Payment processing
- [ ] Send messages
- [ ] Leave reviews
- [ ] Seller onboarding
- [ ] Admin functions

### Test Accounts Needed:
1. Regular user (buyer)
2. Seller with verified Stripe
3. Admin user

## Customization Examples

### Example 1: Small Business CRM Marketplace

**Changes Needed:**
- Rename "listing" to "business service"
- Add CRM-specific fields (industry, service type, team size)
- Modify booking to "engagement" or "project"
- Add milestone/task tracking
- Invoice generation features
- Client management dashboard

**Estimated Time:** 2-3 days

### Example 2: Freelance Platform

**Changes Needed:**
- Rename "listing" to "service offering"
- Add hourly/project-based pricing
- Portfolio/work samples upload
- Skill tags and certifications
- Proposal system instead of instant booking
- Time tracking integration

**Estimated Time:** 3-4 days

### Example 3: Equipment Rental

**Changes Needed:**
- Minimal! This template already works
- Add equipment-specific fields (serial number, maintenance)
- Insurance options
- Damage reporting workflow

**Estimated Time:** 1-2 days

## Support & Maintenance

### Regular Maintenance:
- Update dependencies monthly
- Monitor Stripe webhook delivery
- Review error logs
- Database backups (Supabase handles this)
- Security patches

### Scaling Considerations:
- Supabase can handle 100k+ users
- Add caching layer (Redis) for high traffic
- CDN for static assets
- Consider read replicas for analytics
- Database connection pooling included

## Known Limitations

1. No multi-currency support (can be added)
2. Single language (i18n ready to add)
3. No mobile app (web-responsive)
4. Basic analytics (can integrate advanced tools)

## License

Proprietary - Template for internal/client use

## Credits

Built with:
- Next.js
- Supabase
- Stripe
- shadcn/ui
- Tailwind CSS

---

## Quick Start Checklist

- [ ] Copy template files
- [ ] Run `npm install`
- [ ] Set up Supabase project
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Set up Stripe account
- [ ] Test authentication
- [ ] Create test listing
- [ ] Test booking flow
- [ ] Configure domain
- [ ] Deploy to production

---

**For questions or issues, review the inline code comments and type definitions.**
