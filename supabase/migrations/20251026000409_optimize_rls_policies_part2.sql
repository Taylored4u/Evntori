/*
  # Optimize RLS Policies for Performance - Part 2

  1. Performance Optimization
    - Replace auth.uid() with (SELECT auth.uid()) in remaining RLS policies
    - Consolidate duplicate policies
    - Remove redundant policies

  2. Tables Updated (Part 2)
    - notifications, reviews, favorites
    - cms_pages, blog_posts, featured_collections
    - disputes, admin_roles, webhook_events
    - audit_logs, review_helpful, email_preferences
    - content_reports, platform_stats, saved_searches, search_history
*/

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Reviews policies
DROP POLICY IF EXISTS "Booking participants can create reviews" ON reviews;

CREATE POLICY "Booking participants can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND (bookings.renter_id = (SELECT auth.uid()) OR bookings.lender_id = (SELECT auth.uid()))
    )
  );

-- Favorites policies (consolidate duplicates)
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can add to favorites" ON favorites;
DROP POLICY IF EXISTS "Users can remove from favorites" ON favorites;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- CMS pages policy
DROP POLICY IF EXISTS "Anyone can view published cms pages" ON cms_pages;

CREATE POLICY "Anyone can view published cms pages"
  ON cms_pages FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Blog posts policy
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;

CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Featured collections policy
DROP POLICY IF EXISTS "Anyone can view active collections" ON featured_collections;

CREATE POLICY "Anyone can view active collections"
  ON featured_collections FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Featured collection items policy
DROP POLICY IF EXISTS "Anyone can view collection items" ON featured_collection_items;

CREATE POLICY "Anyone can view collection items"
  ON featured_collection_items FOR SELECT
  TO authenticated
  USING (true);

-- Disputes policies
DROP POLICY IF EXISTS "Participants can view disputes" ON disputes;
DROP POLICY IF EXISTS "Booking participants can create disputes" ON disputes;
DROP POLICY IF EXISTS "Admins can manage disputes" ON disputes;

CREATE POLICY "Participants can view disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    raised_by_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = disputes.booking_id
      AND (bookings.renter_id = (SELECT auth.uid()) OR bookings.lender_id = (SELECT auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Booking participants can create disputes"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = disputes.booking_id
      AND (bookings.renter_id = (SELECT auth.uid()) OR bookings.lender_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Admins can manage disputes"
  ON disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- Admin roles policies (consolidate)
DROP POLICY IF EXISTS "Only admins can view admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Only super admins can manage admin roles" ON admin_roles;

CREATE POLICY "Only admins can view admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Only super admins can manage admin roles"
  ON admin_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role = 'super_admin'
    )
  );

-- Webhook events policy
DROP POLICY IF EXISTS "Admins can view webhook events" ON webhook_events;

CREATE POLICY "Admins can view webhook events"
  ON webhook_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Audit logs policy
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Review helpful policies
DROP POLICY IF EXISTS "Users can mark reviews helpful" ON review_helpful;
DROP POLICY IF EXISTS "Users can remove helpful vote" ON review_helpful;

CREATE POLICY "Users can mark reviews helpful"
  ON review_helpful FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can remove helpful vote"
  ON review_helpful FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Email preferences policies
DROP POLICY IF EXISTS "Users can view own email preferences" ON email_preferences;
DROP POLICY IF EXISTS "Users can update own email preferences" ON email_preferences;
DROP POLICY IF EXISTS "Users can insert own email preferences" ON email_preferences;

CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own email preferences"
  ON email_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Content reports policies
DROP POLICY IF EXISTS "Users can view their own reports" ON content_reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON content_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON content_reports;

CREATE POLICY "Users can view their own reports"
  ON content_reports FOR SELECT
  TO authenticated
  USING (
    reporter_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create reports"
  ON content_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));

CREATE POLICY "Admins can update reports"
  ON content_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- Platform stats policies (consolidate)
DROP POLICY IF EXISTS "Admins can view platform stats" ON platform_stats;
DROP POLICY IF EXISTS "Admins can manage platform stats" ON platform_stats;

CREATE POLICY "Admins can manage platform stats"
  ON platform_stats FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

-- Saved searches policies
DROP POLICY IF EXISTS "Users can view own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can create saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can update own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can delete own saved searches" ON saved_searches;

CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create saved searches"
  ON saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Search history policies
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
DROP POLICY IF EXISTS "Users can create search history" ON search_history;

CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Remove duplicate index
DROP INDEX IF EXISTS idx_favorites_user_id;
