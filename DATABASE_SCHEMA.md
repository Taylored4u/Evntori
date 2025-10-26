# Database Schema Documentation

## Overview

This document provides a complete reference for all database tables, relationships, and business rules in the marketplace platform.

**Database:** PostgreSQL 15+ (via Supabase)
**Total Tables:** 30+
**Migrations:** 10 files
**Security:** Row Level Security (RLS) enabled on all tables

---

## Table of Contents

1. [User Management](#user-management)
2. [Marketplace Core](#marketplace-core)
3. [Booking & Transactions](#booking--transactions)
4. [Communication](#communication)
5. [Reviews & Ratings](#reviews--ratings)
6. [Marketing & Discovery](#marketing--discovery)
7. [Admin & System](#admin--system)
8. [Indexes & Performance](#indexes--performance)
9. [RLS Policies](#rls-policies)

---

## User Management

### profiles
Core user account information linked to Supabase Auth.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Matches auth.users.id |
| email | text | NOT NULL, UNIQUE | User email |
| full_name | text | | Display name |
| avatar_url | text | | Profile picture URL |
| phone | text | | Contact number |
| bio | text | | User description |
| is_email_verified | boolean | DEFAULT false | Email verification status |
| is_suspended | boolean | DEFAULT false | Account suspension flag |
| suspension_reason | text | | Admin note for suspension |
| created_at | timestamptz | DEFAULT now() | Account creation |
| updated_at | timestamptz | DEFAULT now() | Last profile update |

**Relationships:**
- 1:1 with auth.users (Supabase Auth)
- 1:1 with lender_profiles (optional)
- 1:N with addresses

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (email)

**RLS:**
- Users can read own profile
- Users can update own profile
- Public can read basic info (name, avatar) for listings

---

### lender_profiles
Extended information for users who list items/services.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, FK(profiles) | References profile |
| business_name | text | NOT NULL | Public business name |
| business_type | text | | 'individual', 'business' |
| tax_id | text | | EIN/SSN for tax reporting |
| website | text | | Business website |
| description | text | | Business description |
| city | text | | Business location |
| state | text | | State/province |
| country | text | DEFAULT 'US' | Country code |
| stripe_account_id | text | UNIQUE | Stripe Connect account |
| stripe_onboarding_complete | boolean | DEFAULT false | Connect status |
| stripe_charges_enabled | boolean | DEFAULT false | Can receive payments |
| stripe_payouts_enabled | boolean | DEFAULT false | Can receive payouts |
| verification_status | text | DEFAULT 'pending' | 'pending', 'verified', 'rejected' |
| rating_avg | numeric(3,2) | DEFAULT 0 | Average star rating |
| rating_count | integer | DEFAULT 0 | Number of ratings |
| total_bookings | integer | DEFAULT 0 | Completed bookings |
| response_time_hours | integer | | Avg response time |
| response_rate | numeric(5,2) | | % of messages answered |
| is_featured | boolean | DEFAULT false | Featured seller flag |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**Relationships:**
- 1:1 with profiles
- 1:N with listings

**Business Rules:**
- Must complete Stripe onboarding before receiving payments
- Rating updates via trigger on reviews insert
- Suspension propagates to all listings

---

### addresses
Multiple addresses per user (billing, shipping, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| user_id | uuid | NOT NULL, FK(profiles) | Owner |
| type | text | NOT NULL | 'billing', 'shipping', 'business' |
| street_address | text | NOT NULL | |
| street_address_2 | text | | Apt/Suite |
| city | text | NOT NULL | |
| state | text | NOT NULL | |
| postal_code | text | NOT NULL | |
| country | text | NOT NULL, DEFAULT 'US' | |
| is_default | boolean | DEFAULT false | Default address |
| created_at | timestamptz | DEFAULT now() | |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (user_id)

---

## Marketplace Core

### categories
Top-level categorization for listings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| name | text | NOT NULL, UNIQUE | Display name |
| slug | text | NOT NULL, UNIQUE | URL-friendly |
| description | text | | SEO description |
| icon | text | | Icon identifier |
| parent_id | uuid | FK(categories) | For subcategories |
| display_order | integer | DEFAULT 0 | Sort order |
| is_active | boolean | DEFAULT true | Visible flag |
| created_at | timestamptz | DEFAULT now() | |

**Business Rules:**
- Max 2 levels deep (category → subcategory)
- Slug used in URLs
- Inactive categories hidden from search

---

### listings
Main marketplace items/services.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| lender_id | uuid | NOT NULL, FK(lender_profiles) | Owner |
| category_id | uuid | FK(categories) | Category |
| title | text | NOT NULL | Listing title |
| description | text | NOT NULL | Full description |
| base_price | numeric(10,2) | NOT NULL | Base price |
| pricing_type | text | NOT NULL | 'daily', 'hourly', 'weekly' |
| currency | text | DEFAULT 'usd' | Currency code |
| quantity_available | integer | NOT NULL, DEFAULT 1 | Stock quantity |
| min_rental_duration | integer | NOT NULL, DEFAULT 1 | Min rental period |
| max_rental_duration | integer | | Max rental period |
| location_city | text | | Item location |
| location_state | text | | |
| location_country | text | DEFAULT 'US' | |
| condition | text | | 'new', 'like-new', 'good', 'fair' |
| year_manufactured | integer | | Manufacturing year |
| brand | text | | Brand name |
| model | text | | Model number |
| dimensions | jsonb | | {length, width, height, weight} |
| features | text[] | | Array of features |
| whats_included | text[] | | What's in rental |
| requirements | text[] | | Requirements to rent |
| cancellation_policy | text | DEFAULT 'moderate' | 'flexible', 'moderate', 'strict' |
| status | text | NOT NULL, DEFAULT 'draft' | 'draft', 'active', 'paused', 'archived' |
| is_featured | boolean | DEFAULT false | Featured listing |
| view_count | integer | DEFAULT 0 | Page views |
| booking_count | integer | DEFAULT 0 | Total bookings |
| deleted_at | timestamptz | | Soft delete |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**Relationships:**
- N:1 with lender_profiles
- N:1 with categories
- 1:N with listing_images
- 1:N with listing_variants
- 1:N with listing_add_ons
- 1:N with bookings

**Indexes:**
- PRIMARY KEY (id)
- INDEX (lender_id)
- INDEX (category_id)
- INDEX (status) WHERE deleted_at IS NULL
- FULL TEXT INDEX (title, description)

**Business Rules:**
- Only lenders with verified Stripe can activate
- Soft delete preserves booking history
- view_count incremented on page view
- booking_count updated via trigger

---

### listing_images
Multiple images per listing with ordering.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| listing_id | uuid | NOT NULL, FK(listings) | Parent listing |
| url | text | NOT NULL | Image URL |
| alt_text | text | | Accessibility text |
| display_order | integer | NOT NULL, DEFAULT 0 | Sort position |
| is_cover | boolean | DEFAULT false | Cover image flag |
| created_at | timestamptz | DEFAULT now() | |

**Business Rules:**
- Only one is_cover per listing (enforced in app)
- URLs point to Supabase Storage
- Display order determines gallery sequence

---

### listing_variants
Options like sizes, colors, or service tiers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| listing_id | uuid | NOT NULL, FK(listings) | Parent listing |
| name | text | NOT NULL | Variant name |
| sku | text | | Stock keeping unit |
| price_adjustment | numeric(10,2) | NOT NULL, DEFAULT 0 | +/- from base price |
| quantity_available | integer | DEFAULT 0 | Stock for variant |
| display_order | integer | DEFAULT 0 | Sort order |
| created_at | timestamptz | DEFAULT now() | |

**Example:**
- Listing: "Vintage Chair"
- Variants: "Velvet Blue" (+$10), "Leather Brown" (+$25)

---

### listing_add_ons
Optional services or add-ons.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| listing_id | uuid | NOT NULL, FK(listings) | Parent listing |
| name | text | NOT NULL | Add-on name |
| description | text | | Details |
| price | numeric(10,2) | NOT NULL | Additional cost |
| is_required | boolean | DEFAULT false | Required flag |
| display_order | integer | DEFAULT 0 | Sort order |
| created_at | timestamptz | DEFAULT now() | |

**Example:**
- "Delivery Service" ($50, optional)
- "Insurance Coverage" ($25, required)

---

### deposits
Security deposit configurations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| listing_id | uuid | NOT NULL, FK(listings) | Parent listing |
| amount | numeric(10,2) | NOT NULL | Deposit amount |
| type | text | NOT NULL | 'fixed', 'percentage' |
| refundable | boolean | DEFAULT true | Refundable flag |
| refund_conditions | text | | Terms for refund |
| created_at | timestamptz | DEFAULT now() | |

---

### availability_blocks
Dates when listing is unavailable.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| listing_id | uuid | NOT NULL, FK(listings) | Parent listing |
| start_date | date | NOT NULL | Block start |
| end_date | date | NOT NULL | Block end |
| reason | text | | 'booked', 'maintenance', 'personal' |
| created_at | timestamptz | DEFAULT now() | |

**Business Rules:**
- Prevents double-booking
- Auto-created when booking confirmed
- Can be manually added by lender

---

## Booking & Transactions

### bookings
Core transaction/rental records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| listing_id | uuid | NOT NULL, FK(listings) | What's booked |
| renter_id | uuid | NOT NULL, FK(profiles) | Who's renting |
| lender_id | uuid | NOT NULL, FK(lender_profiles) | Who's lending |
| variant_id | uuid | FK(listing_variants) | Selected variant |
| start_date | date | NOT NULL | Rental start |
| end_date | date | NOT NULL | Rental end |
| quantity | integer | NOT NULL, DEFAULT 1 | Quantity rented |
| status | text | NOT NULL, DEFAULT 'pending' | Booking status |
| base_price | numeric(10,2) | NOT NULL | Subtotal |
| total_price | numeric(10,2) | NOT NULL | Final total |
| stripe_payment_intent_id | text | UNIQUE | Stripe payment ID |
| stripe_checkout_session_id | text | UNIQUE | Checkout session |
| payment_status | text | DEFAULT 'pending' | Payment state |
| paid_at | timestamptz | | Payment timestamp |
| cancellation_reason | text | | If cancelled |
| cancelled_at | timestamptz | | Cancellation time |
| cancelled_by | uuid | FK(profiles) | Who cancelled |
| refund_amount | numeric(10,2) | | Refund issued |
| refunded_at | timestamptz | | Refund timestamp |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**Status Flow:**
```
pending → confirmed → active → completed
   ↓         ↓          ↓
cancelled cancelled cancelled
```

**Relationships:**
- N:1 with listings
- N:1 with profiles (renter)
- N:1 with lender_profiles
- 1:N with booking_add_ons
- 1:1 with booking_deposits

**Indexes:**
- PRIMARY KEY (id)
- INDEX (listing_id)
- INDEX (renter_id)
- INDEX (lender_id)
- INDEX (status)
- UNIQUE (stripe_payment_intent_id)

---

### booking_add_ons
Selected add-ons for a booking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| booking_id | uuid | NOT NULL, FK(bookings) | Parent booking |
| add_on_id | uuid | NOT NULL, FK(listing_add_ons) | Selected add-on |
| quantity | integer | NOT NULL, DEFAULT 1 | Quantity |
| price | numeric(10,2) | NOT NULL | Price at booking |
| created_at | timestamptz | DEFAULT now() | |

**Business Rules:**
- Price snapshot prevents changes after booking
- Quantity allows multiple of same add-on

---

### booking_deposits
Deposit authorization and release.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| booking_id | uuid | NOT NULL, FK(bookings) | Parent booking |
| deposit_id | uuid | NOT NULL, FK(deposits) | Deposit config |
| amount | numeric(10,2) | NOT NULL | Held amount |
| status | text | NOT NULL, DEFAULT 'pending' | 'pending', 'held', 'released', 'charged' |
| stripe_payment_intent_id | text | | Authorization ID |
| held_at | timestamptz | | When authorized |
| released_at | timestamptz | | When released |
| charged_at | timestamptz | | If charged |
| charge_reason | text | | Why charged |
| created_at | timestamptz | DEFAULT now() | |

**Deposit Flow:**
```
pending → held → released (normal)
             ↓
           charged (damage/loss)
```

---

### payouts
Payments to lenders via Stripe Connect.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| lender_id | uuid | NOT NULL, FK(lender_profiles) | Recipient |
| booking_id | uuid | FK(bookings) | Source booking |
| amount | numeric(10,2) | NOT NULL | Payout amount |
| currency | text | DEFAULT 'usd' | Currency |
| platform_fee | numeric(10,2) | NOT NULL | Fee taken |
| status | text | NOT NULL, DEFAULT 'pending' | Payout status |
| stripe_transfer_id | text | UNIQUE | Stripe transfer ID |
| stripe_payout_id | text | | Stripe payout ID |
| paid_at | timestamptz | | Transfer time |
| failed_reason | text | | If failed |
| created_at | timestamptz | DEFAULT now() | |

**Business Rules:**
- Triggered after booking completion
- Platform fee calculated at payout time
- Failed payouts retried automatically

---

### refunds
Refund processing records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| booking_id | uuid | NOT NULL, FK(bookings) | Refunded booking |
| amount | numeric(10,2) | NOT NULL | Refund amount |
| reason | text | NOT NULL | Refund reason |
| status | text | NOT NULL, DEFAULT 'pending' | 'pending', 'processed', 'failed' |
| stripe_refund_id | text | UNIQUE | Stripe refund ID |
| initiated_by | uuid | NOT NULL, FK(profiles) | Who requested |
| approved_by | uuid | FK(profiles) | Admin approval |
| processed_at | timestamptz | | When issued |
| created_at | timestamptz | DEFAULT now() | |

---

## Communication

### conversations
Chat threads between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| participant_1_id | uuid | NOT NULL, FK(profiles) | First user |
| participant_2_id | uuid | NOT NULL, FK(profiles) | Second user |
| listing_id | uuid | FK(listings) | Related listing |
| booking_id | uuid | FK(bookings) | Related booking |
| last_message_at | timestamptz | DEFAULT now() | Latest activity |
| last_message_content | text | | Preview text |
| created_at | timestamptz | DEFAULT now() | |

**Business Rules:**
- One conversation per user pair per listing
- last_message_* updated via trigger

**Indexes:**
- PRIMARY KEY (id)
- INDEX (participant_1_id)
- INDEX (participant_2_id)
- UNIQUE (participant_1_id, participant_2_id, listing_id)

---

### messages
Individual messages in conversations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| conversation_id | uuid | NOT NULL, FK(conversations) | Parent thread |
| sender_id | uuid | NOT NULL, FK(profiles) | Message author |
| content | text | NOT NULL | Message text |
| read_at | timestamptz | | When read |
| created_at | timestamptz | DEFAULT now() | |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (conversation_id)
- INDEX (sender_id)
- INDEX (read_at) WHERE read_at IS NULL

---

### notifications
In-app notification system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| user_id | uuid | NOT NULL, FK(profiles) | Recipient |
| type | text | NOT NULL | Notification type |
| title | text | NOT NULL | Short title |
| message | text | NOT NULL | Full message |
| link | text | | Deep link URL |
| is_read | boolean | DEFAULT false | Read status |
| read_at | timestamptz | | When read |
| data | jsonb | | Additional data |
| created_at | timestamptz | DEFAULT now() | |

**Types:**
- booking_confirmed
- booking_updated
- message_received
- review_received
- payment_received

**Indexes:**
- PRIMARY KEY (id)
- INDEX (user_id, is_read)
- INDEX (created_at DESC)

---

### notification_preferences
User notification settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | uuid | PK, FK(profiles) | User |
| email_booking_confirmed | boolean | DEFAULT true | Email on booking |
| email_booking_updated | boolean | DEFAULT true | Email on updates |
| email_message_received | boolean | DEFAULT true | Email on messages |
| email_review_reminder | boolean | DEFAULT true | Review reminders |
| email_payment_received | boolean | DEFAULT true | Payment emails |
| email_marketing | boolean | DEFAULT false | Marketing emails |
| push_enabled | boolean | DEFAULT true | Push notifications |
| updated_at | timestamptz | DEFAULT now() | |

---

## Reviews & Ratings

### reviews
Two-sided review system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| booking_id | uuid | NOT NULL, FK(bookings) | Reviewed booking |
| listing_id | uuid | NOT NULL, FK(listings) | Reviewed listing |
| reviewer_id | uuid | NOT NULL, FK(profiles) | Who's reviewing |
| reviewee_id | uuid | NOT NULL, FK(profiles) | Who's reviewed |
| rating | integer | NOT NULL, CHECK 1-5 | Star rating |
| comment | text | | Written feedback |
| is_public | boolean | DEFAULT true | Visible publicly |
| response | text | | Owner response |
| responded_at | timestamptz | | Response time |
| created_at | timestamptz | DEFAULT now() | |

**Business Rules:**
- Can only review completed bookings
- Both renter and lender can review
- Rating updates average via trigger

---

## Marketing & Discovery

### favorites
User wishlist/favorites.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| user_id | uuid | NOT NULL, FK(profiles) | User |
| listing_id | uuid | NOT NULL, FK(listings) | Favorited listing |
| created_at | timestamptz | DEFAULT now() | |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (user_id, listing_id)

---

### saved_searches
Saved search criteria.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| user_id | uuid | NOT NULL, FK(profiles) | User |
| name | text | NOT NULL | Search name |
| criteria | jsonb | NOT NULL | Search filters |
| notify_on_new | boolean | DEFAULT false | Email on new match |
| last_checked | timestamptz | | Last notification |
| created_at | timestamptz | DEFAULT now() | |

---

## Admin & System

### audit_logs
Track sensitive actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| user_id | uuid | FK(profiles) | Actor |
| action | text | NOT NULL | Action taken |
| resource_type | text | NOT NULL | Table affected |
| resource_id | uuid | | Record ID |
| old_values | jsonb | | Before state |
| new_values | jsonb | | After state |
| ip_address | inet | | User IP |
| user_agent | text | | Browser info |
| created_at | timestamptz | DEFAULT now() | |

**Logged Actions:**
- User suspensions
- Listing moderations
- Refund approvals
- Payout adjustments

---

### webhook_events
External webhook delivery log.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| source | text | NOT NULL | 'stripe', 'sendgrid' |
| event_type | text | NOT NULL | Event name |
| payload | jsonb | NOT NULL | Event data |
| processed | boolean | DEFAULT false | Handled flag |
| processed_at | timestamptz | | When handled |
| error | text | | If failed |
| created_at | timestamptz | DEFAULT now() | |

---

## Indexes & Performance

### Critical Indexes

**Full-Text Search:**
```sql
CREATE INDEX idx_listings_search
  ON listings USING gin(to_tsvector('english', title || ' ' || description));
```

**Common Queries:**
```sql
CREATE INDEX idx_bookings_status ON bookings(status) WHERE status IN ('pending', 'confirmed');
CREATE INDEX idx_listings_active ON listings(category_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_unread ON messages(conversation_id) WHERE read_at IS NULL;
```

**Foreign Keys (All have indexes):**
- Every FK column has an index for join performance

---

## RLS Policies

### Standard Pattern

**Read (SELECT):**
```sql
-- Public: See active listings
CREATE POLICY "Public can view active listings"
  ON listings FOR SELECT
  TO public
  USING (status = 'active' AND deleted_at IS NULL);

-- Users: See own data
CREATE POLICY "Users view own data"
  ON table_name FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

**Write (INSERT/UPDATE/DELETE):**
```sql
-- Only modify own data
CREATE POLICY "Users modify own data"
  ON table_name FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Complex:**
```sql
-- Lenders see bookings for their listings
CREATE POLICY "Lenders view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    lender_id IN (
      SELECT id FROM lender_profiles WHERE id = auth.uid()
    )
  );
```

---

## Backup & Maintenance

**Automated:**
- Supabase daily backups (7-day retention)
- Point-in-time recovery (up to 7 days)

**Recommended:**
- Weekly manual backup before major changes
- Export critical data monthly
- Test restore procedures quarterly

---

## Schema Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-10-04 | Initial schema |
| 1.1 | 2025-10-04 | Add review enhancements |
| 1.2 | 2025-10-04 | Add payment tracking |
| 1.3 | 2025-10-04 | Enhanced messaging |
| 1.4 | 2025-10-04 | Favorites system |
| 1.5 | 2025-10-04 | Email preferences |
| 1.6 | 2025-10-04 | Admin system |
| 1.7 | 2025-10-04 | Suspension fields |
| 1.8 | 2025-10-04 | Saved searches |
| 1.9 | 2025-10-05 | Notifications system |

---

**For migration details, see `/supabase/migrations/` directory.**
