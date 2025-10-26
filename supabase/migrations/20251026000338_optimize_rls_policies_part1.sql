/*
  # Optimize RLS Policies for Performance - Part 1

  1. Performance Optimization
    - Replace auth.uid() with (SELECT auth.uid()) in all RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  2. Tables Updated (Part 1)
    - profiles, lender_profiles, addresses
    - categories, listings, listing_images, variants
    - bookings, conversations, messages
*/

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- Lender profiles policies
DROP POLICY IF EXISTS "Lenders can view own profile" ON lender_profiles;
DROP POLICY IF EXISTS "Lenders can update own profile" ON lender_profiles;
DROP POLICY IF EXISTS "Users can create lender profile" ON lender_profiles;

CREATE POLICY "Lenders can view own profile"
  ON lender_profiles FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Lenders can update own profile"
  ON lender_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create lender profile"
  ON lender_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Addresses policies
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;

CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Categories policies
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Listings policies
DROP POLICY IF EXISTS "Lenders can insert own listings" ON listings;
DROP POLICY IF EXISTS "Lenders can update own listings" ON listings;
DROP POLICY IF EXISTS "Lenders can delete own listings" ON listings;

CREATE POLICY "Lenders can insert own listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (lender_id = (SELECT auth.uid()));

CREATE POLICY "Lenders can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (lender_id = (SELECT auth.uid()))
  WITH CHECK (lender_id = (SELECT auth.uid()));

CREATE POLICY "Lenders can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (lender_id = (SELECT auth.uid()));

-- Listing images policies
DROP POLICY IF EXISTS "Lenders can manage own listing images" ON listing_images;

CREATE POLICY "Lenders can manage own listing images"
  ON listing_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
      AND listings.lender_id = (SELECT auth.uid())
    )
  );

-- Variants policies
DROP POLICY IF EXISTS "Lenders can manage own variants" ON variants;

CREATE POLICY "Lenders can manage own variants"
  ON variants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = variants.listing_id
      AND listings.lender_id = (SELECT auth.uid())
    )
  );

-- Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Participants can update bookings" ON bookings;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (renter_id = (SELECT auth.uid()) OR lender_id = (SELECT auth.uid()));

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (renter_id = (SELECT auth.uid()));

CREATE POLICY "Participants can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (renter_id = (SELECT auth.uid()) OR lender_id = (SELECT auth.uid()))
  WITH CHECK (renter_id = (SELECT auth.uid()) OR lender_id = (SELECT auth.uid()));

-- Conversations policies
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (participant_1_id = (SELECT auth.uid()) OR participant_2_id = (SELECT auth.uid()));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (participant_1_id = (SELECT auth.uid()) OR participant_2_id = (SELECT auth.uid()));

-- Messages policies
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
DROP POLICY IF EXISTS "Participants can send messages" ON messages;

CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1_id = (SELECT auth.uid()) 
           OR conversations.participant_2_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1_id = (SELECT auth.uid()) 
           OR conversations.participant_2_id = (SELECT auth.uid()))
    )
  );
