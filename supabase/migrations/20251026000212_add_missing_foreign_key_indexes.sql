/*
  # Add Missing Foreign Key Indexes for Performance

  1. Performance Improvements
    - Add indexes for all foreign key columns that don't have covering indexes
    - This significantly improves JOIN performance and query optimization
    - Prevents table scans on foreign key lookups

  2. Tables Enhanced
    - admin_roles, audit_logs, blog_posts
    - booking_add_ons, booking_items, bookings
    - bundle_items, bundles, categories
    - content_reports, conversations, delivery_options
    - deposits, disputes, featured_collection_items
    - listing_tags, listings, messages
    - payouts, popular_searches, refunds, reviews
*/

-- Admin and audit tables
CREATE INDEX IF NOT EXISTS idx_admin_roles_created_by ON admin_roles(created_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- Booking related tables
CREATE INDEX IF NOT EXISTS idx_booking_add_ons_add_on_id ON booking_add_ons(add_on_id);
CREATE INDEX IF NOT EXISTS idx_booking_add_ons_booking_id ON booking_add_ons(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_listing_id ON booking_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_variant_id ON booking_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_delivery_address_id ON bookings(delivery_address_id);

-- Bundle tables
CREATE INDEX IF NOT EXISTS idx_bundle_items_listing_id ON bundle_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_bundles_lender_id ON bundles(lender_id);

-- Category and content tables
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_resolved_by ON content_reports(resolved_by);

-- Conversation tables
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2_id ON conversations(participant_2_id);

-- Delivery and deposit tables
CREATE INDEX IF NOT EXISTS idx_delivery_options_booking_id ON delivery_options(booking_id);
CREATE INDEX IF NOT EXISTS idx_deposits_listing_id ON deposits(listing_id);

-- Dispute tables
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by_id ON disputes(raised_by_id);
CREATE INDEX IF NOT EXISTS idx_disputes_resolved_by_id ON disputes(resolved_by_id);

-- Featured collections
CREATE INDEX IF NOT EXISTS idx_featured_collection_items_listing_id ON featured_collection_items(listing_id);

-- Listing tables
CREATE INDEX IF NOT EXISTS idx_listing_tags_tag_id ON listing_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_listings_location_address_id ON listings(location_address_id);

-- Message tables
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Payment tables
CREATE INDEX IF NOT EXISTS idx_payouts_booking_id ON payouts(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);

-- Review tables
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- Search tables
CREATE INDEX IF NOT EXISTS idx_popular_searches_category_id ON popular_searches(category_id);
