/*
  # Fix Function Search Paths for Security

  1. Security Enhancement
    - Set immutable search_path on all functions
    - Prevents search_path hijacking attacks
    - Ensures functions always execute with correct schema context

  2. Functions Updated
    - update_review_helpful_count
    - update_lender_ratings_from_reviews
    - update_reviews_updated_at
    - update_conversation_last_message
    - update_listing_favorite_count
    - create_default_email_preferences
    - update_email_preferences_timestamp
    - is_admin
    - calculate_platform_stats
    - update_saved_search_timestamp
    - track_popular_search
    - get_search_recommendations
*/

-- Update review helpful count function
ALTER FUNCTION update_review_helpful_count() SET search_path = public, pg_temp;

-- Update lender ratings from reviews function
ALTER FUNCTION update_lender_ratings_from_reviews() SET search_path = public, pg_temp;

-- Update reviews updated_at function
ALTER FUNCTION update_reviews_updated_at() SET search_path = public, pg_temp;

-- Update conversation last message function
ALTER FUNCTION update_conversation_last_message() SET search_path = public, pg_temp;

-- Update listing favorite count function
ALTER FUNCTION update_listing_favorite_count() SET search_path = public, pg_temp;

-- Create default email preferences function
ALTER FUNCTION create_default_email_preferences() SET search_path = public, pg_temp;

-- Update email preferences timestamp function
ALTER FUNCTION update_email_preferences_timestamp() SET search_path = public, pg_temp;

-- Is admin function
ALTER FUNCTION is_admin(user_id uuid) SET search_path = public, pg_temp;

-- Calculate platform stats function
ALTER FUNCTION calculate_platform_stats(stat_date date) SET search_path = public, pg_temp;

-- Update saved search timestamp function
ALTER FUNCTION update_saved_search_timestamp() SET search_path = public, pg_temp;

-- Track popular search function
ALTER FUNCTION track_popular_search(search_text text, cat_id uuid) SET search_path = public, pg_temp;

-- Get search recommendations function
ALTER FUNCTION get_search_recommendations(p_user_id uuid, p_limit integer) SET search_path = public, pg_temp;
