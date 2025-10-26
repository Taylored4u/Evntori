/*
  # Enhance Reviews Table

  1. Schema Updates
    - Add missing fields to reviews table:
      - `title` - Review headline
      - `cleanliness_rating` - Item condition rating
      - `accuracy_rating` - Description match rating
      - `communication_rating` - Lender communication rating
      - `value_rating` - Price vs quality rating
      - `response` - Lender response to review
      - `response_at` - Response timestamp
      - `helpful_count` - Number of helpful votes
      - `status` - Review moderation status
      - `flagged_reason` - Moderation notes
      - `updated_at` - Last update timestamp

  2. New Tables
    - `review_helpful` - Track helpful votes

  3. Indexes
    - Add performance indexes

  4. Triggers
    - Auto-update lender ratings
    - Update helpful counts
    - Set updated_at timestamps
*/

-- Add new columns to reviews table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'title') THEN
    ALTER TABLE reviews ADD COLUMN title text CHECK (char_length(title) <= 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'cleanliness_rating') THEN
    ALTER TABLE reviews ADD COLUMN cleanliness_rating integer CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'accuracy_rating') THEN
    ALTER TABLE reviews ADD COLUMN accuracy_rating integer CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'communication_rating') THEN
    ALTER TABLE reviews ADD COLUMN communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'value_rating') THEN
    ALTER TABLE reviews ADD COLUMN value_rating integer CHECK (value_rating >= 1 AND value_rating <= 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'response') THEN
    ALTER TABLE reviews ADD COLUMN response text CHECK (char_length(response) <= 1000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'response_at') THEN
    ALTER TABLE reviews ADD COLUMN response_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'helpful_count') THEN
    ALTER TABLE reviews ADD COLUMN helpful_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'status') THEN
    ALTER TABLE reviews ADD COLUMN status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'flagged', 'hidden'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'flagged_reason') THEN
    ALTER TABLE reviews ADD COLUMN flagged_reason text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'updated_at') THEN
    ALTER TABLE reviews ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update comment column constraint
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_comment_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_comment_check CHECK (char_length(comment) >= 10 AND char_length(comment) <= 2000);

-- Create review_helpful table
CREATE TABLE IF NOT EXISTS review_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_updated ON reviews(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review ON review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_user ON review_helpful(user_id);

-- Enable RLS on review_helpful
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_helpful
CREATE POLICY "Anyone can view helpful votes"
  ON review_helpful FOR SELECT
  USING (true);

CREATE POLICY "Users can mark reviews helpful"
  ON review_helpful FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove helpful vote"
  ON review_helpful FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews
    SET helpful_count = GREATEST(helpful_count - 1, 0)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update helpful count
DROP TRIGGER IF EXISTS trigger_update_review_helpful_count ON review_helpful;
CREATE TRIGGER trigger_update_review_helpful_count
  AFTER INSERT OR DELETE ON review_helpful
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- Function to update lender ratings
CREATE OR REPLACE FUNCTION update_lender_ratings_from_reviews()
RETURNS TRIGGER AS $$
DECLARE
  lender_profile_id uuid;
BEGIN
  -- Get lender_profile_id from the listing
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT lender_id INTO lender_profile_id
    FROM listings
    WHERE id = NEW.listing_id;
    
    IF lender_profile_id IS NOT NULL THEN
      UPDATE lender_profiles
      SET 
        rating_avg = (
          SELECT AVG(r.rating)::numeric(3,2)
          FROM reviews r
          JOIN listings l ON l.id = r.listing_id
          WHERE l.lender_id = lender_profile_id
          AND r.status = 'approved'
        ),
        rating_count = (
          SELECT COUNT(*)
          FROM reviews r
          JOIN listings l ON l.id = r.listing_id
          WHERE l.lender_id = lender_profile_id
          AND r.status = 'approved'
        ),
        updated_at = now()
      WHERE id = lender_profile_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT lender_id INTO lender_profile_id
    FROM listings
    WHERE id = OLD.listing_id;
    
    IF lender_profile_id IS NOT NULL THEN
      UPDATE lender_profiles
      SET 
        rating_avg = (
          SELECT COALESCE(AVG(r.rating)::numeric(3,2), 0)
          FROM reviews r
          JOIN listings l ON l.id = r.listing_id
          WHERE l.lender_id = lender_profile_id
          AND r.status = 'approved'
        ),
        rating_count = (
          SELECT COUNT(*)
          FROM reviews r
          JOIN listings l ON l.id = r.listing_id
          WHERE l.lender_id = lender_profile_id
          AND r.status = 'approved'
        ),
        updated_at = now()
      WHERE id = lender_profile_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update lender ratings
DROP TRIGGER IF EXISTS trigger_update_lender_ratings_from_reviews ON reviews;
CREATE TRIGGER trigger_update_lender_ratings_from_reviews
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_lender_ratings_from_reviews();

-- Function to update reviews updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS trigger_update_reviews_updated_at ON reviews;
CREATE TRIGGER trigger_update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();
