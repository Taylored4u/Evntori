# KnotAgain - Luxury Wedding Rental Marketplace

A production-grade wedding rental marketplace similar to Turo, featuring Stripe Connect payments, secure bookings, messaging, reviews, and admin capabilities.

## Project Status

### ✅ Completed Foundation
- **Database Schema**: Complete Supabase/PostgreSQL schema with 30+ tables
  - Users, profiles, lender profiles
  - Listings with variants, add-ons, bundles
  - Bookings with full lifecycle tracking
  - Payments, deposits, refunds, disputes
  - Messaging, reviews, notifications
  - Admin features (CMS, featured collections, audit logs)
- **Authentication**: Supabase Auth context and client setup
- **Design System**: Luxury brand styling with Libre Baskerville serif + Inter sans
- **Base Layout**: Homepage with navigation and footer
- **TypeScript**: Full type definitions for database schema

### 🚧 Requires Implementation

This is an extensive multi-week project. The following major features need to be built:

#### 1. Authentication Pages (`/app/auth/*`)
- Sign up / Sign in forms with email/password
- Email verification flow
- Password reset
- Profile creation and onboarding

#### 2. Lender Onboarding (`/app/sell/onboarding/*`)
- Stripe Connect Express account creation
- KYC verification status polling
- Business information collection
- Payout account setup

#### 3. Listing Management (`/app/sell/listings/*`)
- Create/edit listing forms with:
  - Image upload (multi-upload, drag-drop, reorder)
  - Variants (size, color, quantity)
  - Add-ons (delivery, setup, cleaning)
  - Pricing rules (hourly/daily/peak/weekend)
  - Availability calendar
  - Security deposit configuration
- Listing dashboard with analytics
- Inventory management

#### 4. Search & Discovery (`/app/search`, `/app/listing/[id]`)
- Search interface with filters:
  - Category, price range, location
  - Date availability
  - Ratings, features
- Listing detail pages with:
  - Image gallery
  - Calendar date picker
  - Variant selector
  - Add-on options
  - Pricing breakdown
  - Reviews
  - Similar items

#### 5. Booking Flow (`/app/checkout`, `/app/bookings`)
- Date selection with availability checks
- Price calculation with:
  - Base rental price
  - Add-ons
  - Fees (platform, service)
  - Taxes by region
  - Security deposit
- Stripe Checkout integration:
  - Payment Intent creation
  - Deposit pre-authorization hold
  - Capture on successful return
- Booking confirmation
- Booking management dashboard (renter + lender views)

#### 6. Messaging System (`/app/inbox`)
- Real-time messaging between renters/lenders
- Conversation threads
- File attachments
- Read receipts
- Push notifications

#### 7. Reviews & Ratings (`/app/bookings/[id]/review`)
- Two-sided review system
- Rating categories (accuracy, communication, condition)
- Private feedback to platform
- Review moderation

#### 8. Admin Console (`/app/admin/*`)
- Dashboard with metrics (GMV, bookings, users)
- KYC approval queue
- Dispute resolution center:
  - Evidence upload
  - Partial refund processing
  - Outcome recording
- Content management (CMS pages, blog posts)
- Featured collections curation
- Promotional codes
- User/listing moderation

#### 9. Stripe Integration
- **Connect**: Express account onboarding
- **Payments**: Payment Intents with deposit holds
- **Webhooks** (`/api/webhooks/stripe`):
  - `account.updated` - Update lender KYC status
  - `payment_intent.succeeded` - Confirm booking
  - `charge.dispute.created` - Create dispute record
  - `payout.paid` - Record payout to lender
- **Transfers**: Platform fees + lender payouts

#### 10. Policies & Legal
- Cancellation policies (flexible/moderate/strict)
- Rental agreements (e-signature)
- Damage/loss claims
- Insurance options

#### 11. Notifications & Automation
- Email notifications (booking confirmed, reminder, review request)
- SMS alerts (optional, via Twilio)
- Scheduled jobs:
  - Booking reminders (24h before)
  - Late return alerts
  - Review prompts (post-return)

#### 12. Additional Features
- Favorites/wishlists
- Coupon/promo codes
- Blog for SEO
- Help center
- Mobile responsiveness
- Accessibility (WCAG AA)

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Stripe Connect Express
- **UI**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod
- **Fonts**: Libre Baskerville (serif) + Inter (sans)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - The database schema is already migrated
   - Supabase credentials are in `.env`

3. **Configure Stripe:**
   - Get your API keys from https://dashboard.stripe.com/apikeys
   - Update `.env`:
     ```env
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```
   - Set `USE_MOCK_STRIPE=false` when ready for real payments

4. **Additional Configuration (Optional):**
   - Copy `.env.local.example` to `.env.local`
   - Add SendGrid, Twilio, Typesense, Redis credentials as needed

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
knotagain/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   ├── (marketplace)/
│   │   ├── search/
│   │   ├── listing/[id]/
│   │   ├── checkout/
│   │   └── bookings/
│   ├── (lender)/
│   │   └── sell/
│   │       ├── onboarding/
│   │       ├── listings/
│   │       └── analytics/
│   ├── (messaging)/
│   │   └── inbox/
│   ├── (admin)/
│   │   └── admin/
│   ├── api/
│   │   ├── webhooks/stripe/
│   │   ├── stripe/
│   │   └── ...
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/ (shadcn components)
│   ├── listings/
│   ├── bookings/
│   ├── messaging/
│   └── admin/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── stripe/
│   ├── auth/
│   │   └── context.tsx
│   ├── utils/
│   └── validations/
├── types/
│   └── database.ts
└── README.md
```

## Database Schema

The complete schema includes:

- **User Management**: `profiles`, `lender_profiles`, `addresses`
- **Inventory**: `categories`, `listings`, `listing_images`, `variants`, `add_ons`, `bundles`
- **Availability**: `availability_blocks`, `pricing_rules`, `deposits`
- **Bookings**: `bookings`, `booking_items`, `booking_add_ons`, `delivery_options`
- **Payments**: `payouts`, `refunds`, `disputes`, `fees`, `tax_rates`
- **Communication**: `conversations`, `messages`, `notifications`
- **Reviews**: `reviews`
- **Marketing**: `favorites`, `coupons`, `featured_collections`, `cms_pages`, `blog_posts`
- **System**: `audit_logs`, `webhook_events`

All tables have Row Level Security (RLS) enabled with appropriate policies.

## API Routes to Implement

### Stripe
- `POST /api/stripe/connect/account` - Create Connect account
- `POST /api/stripe/connect/account-link` - Get onboarding link
- `GET /api/stripe/connect/account-status` - Check KYC status
- `POST /api/stripe/payment-intent` - Create payment for booking
- `POST /api/stripe/capture` - Capture deposit hold
- `POST /api/stripe/refund` - Process refund
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Bookings
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/[id]` - Update booking status
- `GET /api/bookings/[id]/pricing` - Calculate pricing
- `POST /api/bookings/[id]/cancel` - Cancel booking

### Listings
- `GET /api/listings` - Search listings
- `GET /api/listings/[id]` - Get listing details
- `POST /api/listings` - Create listing
- `PATCH /api/listings/[id]` - Update listing
- `GET /api/listings/[id]/availability` - Check availability

### Messaging
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Start conversation
- `POST /api/messages` - Send message

### Admin
- `GET /api/admin/metrics` - Platform metrics
- `GET /api/admin/disputes` - Get disputes
- `PATCH /api/admin/disputes/[id]` - Resolve dispute

## Stripe Connect Flow

1. **Lender Onboarding:**
   - User creates lender profile
   - Backend creates Stripe Connect Express account
   - User redirected to Stripe onboarding
   - Webhook updates account status
   - Lender can list items when `charges_enabled=true`

2. **Booking Payment:**
   - Calculate total (rental + fees + tax + deposit)
   - Create Payment Intent with `capture_method: manual` for deposit
   - Separate authorization for deposit hold
   - Capture payment on confirmed booking
   - Transfer funds to lender (minus platform fee)

3. **Deposit Release:**
   - On successful return: release deposit hold
   - On damage: capture partial/full deposit
   - Dispute process if contested

## Feature Flags

Use environment variables to toggle features:

- `USE_MOCK_STRIPE=true` - Mock Stripe for development
- `USE_MOCK_EMAIL=true` - Log emails instead of sending
- `ENABLE_SMS=false` - Toggle SMS notifications

## Testing

### Manual Testing Flow

1. **Lender Journey:**
   - Sign up → Create lender profile
   - Connect Stripe account (use test mode)
   - Create listing with images, variants, pricing
   - Set availability calendar

2. **Renter Journey:**
   - Browse/search listings
   - Select dates and add-ons
   - Proceed to checkout
   - Complete payment (use test card: 4242 4242 4242 4242)
   - Receive confirmation

3. **Booking Lifecycle:**
   - Lender confirms booking
   - Mark as in-progress (picked up)
   - Mark as completed (returned)
   - Release deposit

4. **Dispute:**
   - Renter/lender raises dispute
   - Admin reviews and resolves
   - Partial refund processed

### Test Cards (Stripe)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## Deployment

### Vercel (Recommended)

```bash
vercel
```

### Environment Variables

Ensure all environment variables from `.env.local.example` are set in your deployment platform.

## Security Considerations

- All sensitive operations server-side only
- RLS policies enforce data access control
- Stripe webhook signature verification
- Input validation with Zod
- Rate limiting on API routes
- CSRF protection
- XSS prevention (sanitize user content)
- Audit logging for admin actions

## Performance

- Server Components for initial render
- Image optimization with Next/Image
- ISR for listings pages
- Edge caching where appropriate
- Database indexes on common queries
- Pagination for large datasets

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management
- Color contrast (WCAG AA)
- Screen reader testing

## Contributing

This is a complex project. To contribute:

1. Pick a feature from the "Requires Implementation" section
2. Follow existing patterns and conventions
3. Test thoroughly with real Stripe test mode
4. Ensure RLS policies are correct

## License

Proprietary - All rights reserved

## Support

For questions or issues, contact: support@knotagain.com

---

**Current Status**: Foundation complete with database schema, auth setup, and homepage. Ready for feature development.

**Estimated Completion**: This is a 6-12 week project for a full team. Prioritize core flows:
1. Auth + Lender onboarding (Week 1-2)
2. Listing management (Week 2-3)
3. Search + Booking flow (Week 3-5)
4. Payments integration (Week 5-6)
5. Messaging + Reviews (Week 7-8)
6. Admin console (Week 9-10)
7. Polish + Testing (Week 11-12)
