/*
  # Create Saved Searches System

  1. New Tables
    - `saved_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles) - User who saved search
      - `name` (text) - User-given name for the search
      - `search_params` (jsonb) - Search criteria (category, price, dates, etc.)
      - `notification_enabled` (boolean) - Send alerts for new matches
      - `last_notified_at` (timestamptz) - Last alert sent
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `search_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles) - User who searched
      - `search_params` (jsonb) - Search criteria
      - `result_count` (integer) - Number of results found
      - `created_at` (timestamptz)

    - `popular_searches`
      - `id` (uuid, primary key)
      - `search_term` (text) - Search query text
      - `category_id` (uuid) - Category searched
      - `search_count` (integer) - Number of times searched
      - `last_searched_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all search tables
    - Users can only manage their own saved searches and history
    - Popular searches are publicly viewable

  3. Indexes
    - Index on user_id for saved searches and history
    - Index on search terms for popular searches
    - Index on notification_enabled for alert processing
*/

-- Create saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  search_params jsonb DEFAULT '{}',
  notification_enabled boolean DEFAULT false,
  last_notified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  search_params jsonb DEFAULT '{}',
  result_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create popular searches table
CREATE TABLE IF NOT EXISTS popular_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_term text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  search_count integer DEFAULT 1,
  last_searched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(search_term, category_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_notifications ON saved_searches(notification_enabled) WHERE notification_enabled = true;
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_popular_searches_term ON popular_searches(search_term);

-- Enable Row Level Security
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_searches
CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create saved searches"
  ON saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for search_history
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for popular_searches
CREATE POLICY "Anyone can view popular searches"
  ON popular_searches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update popular searches"
  ON popular_searches FOR ALL
  TO authenticated
  USING (true);

-- Function to update saved search timestamp
CREATE OR REPLACE FUNCTION update_saved_search_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saved_search_timestamp ON saved_searches;
CREATE TRIGGER trigger_update_saved_search_timestamp
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_search_timestamp();

-- Function to track popular searches
CREATE OR REPLACE FUNCTION track_popular_search(
  search_text text,
  cat_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO popular_searches (search_term, category_id, search_count, last_searched_at)
  VALUES (search_text, cat_id, 1, now())
  ON CONFLICT (search_term, category_id) 
  DO UPDATE SET
    search_count = popular_searches.search_count + 1,
    last_searched_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to get search recommendations based on history
CREATE OR REPLACE FUNCTION get_search_recommendations(p_user_id uuid, p_limit integer DEFAULT 5)
RETURNS TABLE (
  search_term text,
  category_id uuid,
  relevance_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.search_term,
    ps.category_id,
    (ps.search_count::numeric * 0.7 + 
     CASE WHEN sh.user_id IS NOT NULL THEN 10 ELSE 0 END) as relevance_score
  FROM popular_searches ps
  LEFT JOIN search_history sh ON 
    sh.user_id = p_user_id AND
    (sh.search_params->>'q')::text = ps.search_term
  ORDER BY relevance_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
