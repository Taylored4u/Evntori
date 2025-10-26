/*
  # KnotAgain Initial Database Schema

  ## Overview
  Complete database schema for a luxury wedding-rental marketplace with Stripe Connect integration,
  secure bookings, messaging, reviews, and admin capabilities.

  ## Tables Created

  ### Users & Profiles
  - `users` - Core user authentication (managed by Supabase Auth)
  - `profiles` - Extended user profile information
  - `lender_profiles` - Lender-specific data including Stripe Connect details
  - `addresses` - Physical addresses for users and delivery

  ### Listings & Inventory
  - `categories` - Item categories (e.g., decor, furniture, lighting)
  - `listings` - Rental items with descriptions and pricing
  - `listing_images` - Photos for listings
  - `variants` - Size/color/quantity options for listings
  - `add_ons` - Additional services (delivery, setup, cleaning)
  - `bundles` - Curated item collections
  - `bundle_items` - Items within bundles
  - `tags` - Searchable tags for listings

  ### Availability & Pricing
  - `availability_blocks` - Date ranges when items are available/unavailable
  - `pricing_rules` - Dynamic pricing (hourly/daily/peak/weekend rates)
  - `deposits` - Security deposit configurations
  - `fees` - Platform and service fees
  - `tax_rates` - Tax configuration by region

  ### Bookings & Transactions
  - `bookings` - Rental reservations
  - `booking_items` - Individual items in a booking
  - `booking_add_ons` - Add-on services for bookings
  - `delivery_options` - Pickup/delivery/setup choices
  - `payouts` - Lender payment records
  - `refunds` - Refund transactions
  - `disputes` - Dispute cases with evidence
  - `audit_logs` - System activity tracking
  - `webhook_events` - Stripe webhook processing

  ### Communication & Reviews
  - `conversations` - Message threads
  - `messages` - Individual messages
  - `notifications` - User notifications
  - `reviews` - Two-sided reviews

  ### Discovery & Marketing
  - `favorites` - Saved listings
  - `coupons` - Promotional codes
  - `cms_pages` - Legal/policy pages
  - `blog_posts` - Content marketing
  - `featured_collections` - Curated featured sets

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies enforce authentication and ownership checks
  - Sensitive data protected with restrictive access

  ## Indexes
  - Optimized for common query patterns
  - Compound indexes for availability + listing queries
  - GiST indexes for full-text search
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'lender', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('draft', 'pending_review', 'active', 'inactive', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE dispute_reason AS ENUM ('damage', 'missing_items', 'late_return', 'quality_issue', 'not_as_described', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE cancellation_policy AS ENUM ('flexible', 'moderate', 'strict');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_type AS ENUM ('pickup', 'delivery', 'setup');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pricing_type AS ENUM ('hourly', 'daily', 'weekly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('booking', 'message', 'review', 'payout', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  role user_role DEFAULT 'customer' NOT NULL,
  is_verified boolean DEFAULT false NOT NULL,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Lender profiles
CREATE TABLE IF NOT EXISTS lender_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name text,
  business_description text,
  stripe_account_id text UNIQUE,
  stripe_onboarding_completed boolean DEFAULT false NOT NULL,
  stripe_charges_enabled boolean DEFAULT false NOT NULL,
  stripe_payouts_enabled boolean DEFAULT false NOT NULL,
  verification_status text DEFAULT 'pending' NOT NULL,
  rating_avg numeric(3,2) DEFAULT 0 NOT NULL,
  rating_count integer DEFAULT 0 NOT NULL,
  total_bookings integer DEFAULT 0 NOT NULL,
  response_time_minutes integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label text,
  street_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text DEFAULT 'US' NOT NULL,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id uuid REFERENCES lender_profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  condition text,
  replacement_value numeric(10,2),
  base_price numeric(10,2) NOT NULL,
  pricing_type pricing_type DEFAULT 'daily' NOT NULL,
  min_rental_duration integer DEFAULT 1 NOT NULL,
  max_rental_duration integer,
  cancellation_policy cancellation_policy DEFAULT 'moderate' NOT NULL,
  status listing_status DEFAULT 'draft' NOT NULL,
  quantity_available integer DEFAULT 1 NOT NULL,
  location_address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  featured boolean DEFAULT false NOT NULL,
  views_count integer DEFAULT 0 NOT NULL,
  booking_count integer DEFAULT 0 NOT NULL,
  rating_avg numeric(3,2) DEFAULT 0 NOT NULL,
  rating_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- Listing images
CREATE TABLE IF NOT EXISTS listing_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  alt_text text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_cover boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Variants
CREATE TABLE IF NOT EXISTS variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sku text,
  price_adjustment numeric(10,2) DEFAULT 0 NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add-ons
CREATE TABLE IF NOT EXISTS add_ons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  type delivery_type,
  is_required boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Bundles
CREATE TABLE IF NOT EXISTS bundles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id uuid REFERENCES lender_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  discount_percentage integer DEFAULT 0 NOT NULL,
  image_url text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Bundle items
CREATE TABLE IF NOT EXISTS bundle_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_id uuid REFERENCES bundles(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(bundle_id, listing_id)
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Listing tags junction
CREATE TABLE IF NOT EXISTS listing_tags (
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (listing_id, tag_id)
);

-- Availability blocks
CREATE TABLE IF NOT EXISTS availability_blocks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  reason text,
  buffer_hours integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Pricing rules
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  rule_type text NOT NULL,
  start_date date,
  end_date date,
  day_of_week integer,
  price_override numeric(10,2),
  price_multiplier numeric(4,2),
  min_duration integer,
  max_duration integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Deposits
CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  type text DEFAULT 'fixed' NOT NULL,
  percentage integer,
  refundable boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Fees
CREATE TABLE IF NOT EXISTS fees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  type text NOT NULL,
  amount numeric(10,2),
  percentage numeric(5,2),
  applies_to text DEFAULT 'booking' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Tax rates
CREATE TABLE IF NOT EXISTS tax_rates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  region text NOT NULL,
  state text,
  rate numeric(5,4) NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  renter_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  lender_id uuid REFERENCES lender_profiles(id) ON DELETE SET NULL NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL NOT NULL,
  status booking_status DEFAULT 'pending' NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  fees_total numeric(10,2) DEFAULT 0 NOT NULL,
  tax_total numeric(10,2) DEFAULT 0 NOT NULL,
  deposit_amount numeric(10,2) DEFAULT 0 NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  stripe_payment_intent_id text,
  stripe_deposit_hold_id text,
  deposit_released boolean DEFAULT false NOT NULL,
  delivery_address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  cancellation_reason text,
  cancelled_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Booking items
CREATE TABLE IF NOT EXISTS booking_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL NOT NULL,
  variant_id uuid REFERENCES variants(id) ON DELETE SET NULL,
  quantity integer DEFAULT 1 NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Booking add-ons
CREATE TABLE IF NOT EXISTS booking_add_ons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  add_on_id uuid REFERENCES add_ons(id) ON DELETE SET NULL NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Delivery options
CREATE TABLE IF NOT EXISTS delivery_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  type delivery_type NOT NULL,
  scheduled_date timestamptz NOT NULL,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id uuid REFERENCES lender_profiles(id) ON DELETE SET NULL NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) DEFAULT 0 NOT NULL,
  net_amount numeric(10,2) NOT NULL,
  stripe_transfer_id text,
  stripe_payout_id text,
  status text DEFAULT 'pending' NOT NULL,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  reason text,
  stripe_refund_id text,
  status text DEFAULT 'pending' NOT NULL,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  raised_by_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  reason dispute_reason NOT NULL,
  description text NOT NULL,
  status dispute_status DEFAULT 'open' NOT NULL,
  evidence_urls text[],
  admin_notes text,
  resolution_notes text,
  refund_amount numeric(10,2),
  resolved_by_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Webhook events
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider text DEFAULT 'stripe' NOT NULL,
  event_type text NOT NULL,
  event_id text UNIQUE NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false NOT NULL,
  processing_error text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  participant_1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(participant_1_id, participant_2_id, booking_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  content text NOT NULL,
  attachment_urls text[],
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  reviewee_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  private_feedback text,
  is_verified boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(booking_id, reviewer_id)
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, listing_id)
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text DEFAULT 'percentage' NOT NULL,
  discount_value numeric(10,2) NOT NULL,
  min_order_amount numeric(10,2),
  max_discount_amount numeric(10,2),
  usage_limit integer,
  usage_count integer DEFAULT 0 NOT NULL,
  valid_from timestamptz DEFAULT now() NOT NULL,
  valid_until timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- CMS pages
CREATE TABLE IF NOT EXISTS cms_pages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  meta_description text,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  is_published boolean DEFAULT false NOT NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Featured collections
CREATE TABLE IF NOT EXISTS featured_collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  image_url text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Featured collection items
CREATE TABLE IF NOT EXISTS featured_collection_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id uuid REFERENCES featured_collections(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(collection_id, listing_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_lender_profiles_user_id ON lender_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_lender_profiles_stripe_account ON lender_profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_lender_id ON listings(lender_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_listings_deleted_at ON listings(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_variants_listing_id ON variants(listing_id);
CREATE INDEX IF NOT EXISTS idx_add_ons_listing_id ON add_ons(listing_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_listing_dates ON availability_blocks(listing_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_listing_id ON pricing_rules(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lender_id ON bookings(lender_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id ON booking_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_payouts_lender_id ON payouts(lender_id);
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed) WHERE processed = false;

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_listings_title_search ON listings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_listings_description_search ON listings USING gin(to_tsvector('english', description));

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Lender profiles: Lenders can manage own, admins can view all
CREATE POLICY "Lenders can view own profile"
  ON lender_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Lenders can update own profile"
  ON lender_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create lender profile"
  ON lender_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Addresses: Users can manage own addresses
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Categories: Public read, admin write
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Listings: Public read active, lenders manage own
CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  TO authenticated
  USING (status = 'active' AND deleted_at IS NULL OR EXISTS (
    SELECT 1 FROM lender_profiles WHERE id = lender_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Lenders can insert own listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM lender_profiles WHERE id = lender_id AND user_id = auth.uid()
  ));

CREATE POLICY "Lenders can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM lender_profiles WHERE id = lender_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM lender_profiles WHERE id = lender_id AND user_id = auth.uid()
  ));

CREATE POLICY "Lenders can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM lender_profiles WHERE id = lender_id AND user_id = auth.uid()
  ));

-- Listing images: Inherit from listings
CREATE POLICY "Users can view listing images"
  ON listing_images FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM listings WHERE id = listing_id AND (status = 'active' AND deleted_at IS NULL OR EXISTS (
      SELECT 1 FROM lender_profiles WHERE id = listings.lender_id AND user_id = auth.uid()
    ))
  ));

CREATE POLICY "Lenders can manage own listing images"
  ON listing_images FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM listings l
    JOIN lender_profiles lp ON l.lender_id = lp.id
    WHERE l.id = listing_id AND lp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM listings l
    JOIN lender_profiles lp ON l.lender_id = lp.id
    WHERE l.id = listing_id AND lp.user_id = auth.uid()
  ));

-- Similar policies for variants, add_ons, availability_blocks, pricing_rules, deposits
CREATE POLICY "Users can view listing variants"
  ON variants FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM listings WHERE id = listing_id AND (status = 'active' AND deleted_at IS NULL OR EXISTS (
      SELECT 1 FROM lender_profiles WHERE id = listings.lender_id AND user_id = auth.uid()
    ))
  ));

CREATE POLICY "Lenders can manage own variants"
  ON variants FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM listings l
    JOIN lender_profiles lp ON l.lender_id = lp.id
    WHERE l.id = listing_id AND lp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM listings l
    JOIN lender_profiles lp ON l.lender_id = lp.id
    WHERE l.id = listing_id AND lp.user_id = auth.uid()
  ));

-- Bookings: Renters and lenders can view own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (renter_id = auth.uid() OR EXISTS (
    SELECT 1 FROM lender_profiles WHERE id = lender_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (renter_id = auth.uid());

CREATE POLICY "Participants can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (renter_id = auth.uid() OR EXISTS (
    SELECT 1 FROM lender_profiles WHERE id = lender_id AND user_id = auth.uid()
  ))
  WITH CHECK (renter_id = auth.uid() OR EXISTS (
    SELECT 1 FROM lender_profiles WHERE id = lender_id AND user_id = auth.uid()
  ));

-- Conversations: Participants can view and message
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  ));

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  ));

-- Notifications: Users can view own
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Reviews: Public read, participants can create
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Booking participants can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid() AND EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = booking_id 
    AND (renter_id = auth.uid() OR EXISTS (
      SELECT 1 FROM lender_profiles WHERE id = bookings.lender_id AND user_id = auth.uid()
    ))
    AND status = 'completed'
  ));

-- Favorites: Users can manage own
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- CMS pages and blog posts: Public read
CREATE POLICY "Anyone can view published cms pages"
  ON cms_pages FOR SELECT
  TO authenticated
  USING (is_published = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (is_published = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Featured collections: Public read
CREATE POLICY "Anyone can view active collections"
  ON featured_collections FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Anyone can view collection items"
  ON featured_collection_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM featured_collections WHERE id = collection_id AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Disputes: Participants and admins only
CREATE POLICY "Participants can view disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (raised_by_id = auth.uid() OR EXISTS (
    SELECT 1 FROM bookings WHERE id = booking_id AND (renter_id = auth.uid() OR EXISTS (
      SELECT 1 FROM lender_profiles WHERE id = bookings.lender_id AND user_id = auth.uid()
    ))
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Booking participants can create disputes"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (raised_by_id = auth.uid() AND EXISTS (
    SELECT 1 FROM bookings WHERE id = booking_id AND (renter_id = auth.uid() OR EXISTS (
      SELECT 1 FROM lender_profiles WHERE id = bookings.lender_id AND user_id = auth.uid()
    ))
  ));

-- Admin-only policies
CREATE POLICY "Admins can manage disputes"
  ON disputes FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Webhook events: System only (admins can view)
CREATE POLICY "Admins can view webhook events"
  ON webhook_events FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Audit logs: Admins only
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));