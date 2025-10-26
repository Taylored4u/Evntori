/*
  # Create Favorites/Wishlist System

  1. New Table
    - `favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles) - User who favorited
      - `listing_id` (uuid, references listings) - Favorited listing
      - `created_at` (timestamptz) - When favorited

  2. Security
    - Enable RLS on favorites table
    - Users can only manage their own favorites
    - Users can view their favorites list
    - Unique constraint per user/listing pair

  3. Indexes
    - Index on user_id for fast user favorites lookup
    - Index on listing_id for favorite count
    - Composite unique index to prevent duplicates
*/

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_favorite UNIQUE (user_id, listing_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created ON favorites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorites
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add favorite count to listings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'favorite_count'
  ) THEN
    ALTER TABLE listings ADD COLUMN favorite_count integer DEFAULT 0;
  END IF;
END $$;

-- Function to update listing favorite count
CREATE OR REPLACE FUNCTION update_listing_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings 
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings 
    SET favorite_count = GREATEST(favorite_count - 1, 0)
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update favorite count
DROP TRIGGER IF EXISTS trigger_update_listing_favorite_count ON favorites;
CREATE TRIGGER trigger_update_listing_favorite_count
  AFTER INSERT OR DELETE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_favorite_count();