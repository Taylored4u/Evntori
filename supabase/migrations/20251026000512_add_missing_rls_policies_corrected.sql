/*
  # Add Missing RLS Policies

  1. Security Enhancement
    - Add RLS policies for tables that have RLS enabled but no policies
    - Ensures proper access control for all data

  2. Tables Updated
    - add_ons, availability_blocks, booking_add_ons, booking_items
    - bundle_items, bundles, coupons, delivery_options
    - deposits, fees, listing_tags, payouts
    - pricing_rules, refunds, tags, tax_rates
*/

-- Add-ons policies (lender manages, users can view)
CREATE POLICY "Users can view add-ons"
  ON add_ons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lenders can manage own add-ons"
  ON add_ons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = add_ons.listing_id
      AND listings.lender_id = (SELECT auth.uid())
    )
  );

-- Availability blocks policies
CREATE POLICY "Users can view availability"
  ON availability_blocks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lenders can manage own availability"
  ON availability_blocks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = availability_blocks.listing_id
      AND listings.lender_id = (SELECT auth.uid())
    )
  );

-- Booking add-ons policies
CREATE POLICY "Booking participants can view booking add-ons"
  ON booking_add_ons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_add_ons.booking_id
      AND (bookings.renter_id = (SELECT auth.uid()) OR bookings.lender_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Renters can add booking add-ons"
  ON booking_add_ons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_add_ons.booking_id
      AND bookings.renter_id = (SELECT auth.uid())
    )
  );

-- Booking items policies
CREATE POLICY "Booking participants can view booking items"
  ON booking_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_items.booking_id
      AND (bookings.renter_id = (SELECT auth.uid()) OR bookings.lender_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "System can insert booking items"
  ON booking_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_items.booking_id
      AND bookings.renter_id = (SELECT auth.uid())
    )
  );

-- Bundle items policies
CREATE POLICY "Users can view bundle items"
  ON bundle_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lenders can manage own bundle items"
  ON bundle_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.id = bundle_items.bundle_id
      AND bundles.lender_id = (SELECT auth.uid())
    )
  );

-- Bundles policies
CREATE POLICY "Users can view active bundles"
  ON bundles FOR SELECT
  TO authenticated
  USING (is_active = true OR lender_id = (SELECT auth.uid()));

CREATE POLICY "Lenders can manage own bundles"
  ON bundles FOR ALL
  TO authenticated
  USING (lender_id = (SELECT auth.uid()))
  WITH CHECK (lender_id = (SELECT auth.uid()));

-- Coupons policies
CREATE POLICY "Users can view active coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (is_active = true AND valid_from <= now() AND valid_until >= now());

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Delivery options policies
CREATE POLICY "Booking participants can view delivery options"
  ON delivery_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = delivery_options.booking_id
      AND (bookings.renter_id = (SELECT auth.uid()) OR bookings.lender_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Booking participants can manage delivery options"
  ON delivery_options FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = delivery_options.booking_id
      AND (bookings.renter_id = (SELECT auth.uid()) OR bookings.lender_id = (SELECT auth.uid()))
    )
  );

-- Deposits policies
CREATE POLICY "Users can view deposit requirements"
  ON deposits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lenders can manage own deposits"
  ON deposits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = deposits.listing_id
      AND listings.lender_id = (SELECT auth.uid())
    )
  );

-- Fees policies (platform fees - admin only)
CREATE POLICY "Users can view active fees"
  ON fees FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage fees"
  ON fees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Listing tags policies
CREATE POLICY "Users can view listing tags"
  ON listing_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lenders can manage own listing tags"
  ON listing_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_tags.listing_id
      AND listings.lender_id = (SELECT auth.uid())
    )
  );

-- Payouts policies
CREATE POLICY "Lenders can view own payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (lender_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Pricing rules policies
CREATE POLICY "Users can view pricing rules"
  ON pricing_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lenders can manage own pricing rules"
  ON pricing_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = pricing_rules.listing_id
      AND listings.lender_id = (SELECT auth.uid())
    )
  );

-- Refunds policies
CREATE POLICY "Booking participants can view refunds"
  ON refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = refunds.booking_id
      AND (bookings.renter_id = (SELECT auth.uid()) OR bookings.lender_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Admins can view all refunds"
  ON refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Tags policies
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Tax rates policies
CREATE POLICY "Users can view active tax rates"
  ON tax_rates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage tax rates"
  ON tax_rates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );
