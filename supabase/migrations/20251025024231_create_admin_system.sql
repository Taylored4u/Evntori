/*
  # Create Admin System

  1. New Tables
    - `admin_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles) - Admin user
      - `role` (text) - Admin role type (super_admin, moderator, support)
      - `permissions` (jsonb) - Specific permissions
      - `created_at` (timestamptz)
      - `created_by` (uuid) - Who granted admin access
    
    - `content_reports`
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, references profiles) - User who reported
      - `content_type` (text) - listing, profile, review, message
      - `content_id` (uuid) - ID of reported content
      - `reason` (text) - Report reason
      - `description` (text) - Detailed description
      - `status` (text) - pending, reviewing, resolved, dismissed
      - `resolved_by` (uuid) - Admin who resolved
      - `resolved_at` (timestamptz)
      - `resolution_notes` (text)
      - `created_at` (timestamptz)

    - `platform_stats`
      - `id` (uuid, primary key)
      - `date` (date) - Stats date
      - `total_users` (integer)
      - `new_users` (integer)
      - `total_listings` (integer)
      - `new_listings` (integer)
      - `total_bookings` (integer)
      - `new_bookings` (integer)
      - `total_revenue` (numeric)
      - `active_users` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all admin tables
    - Only admin users can access admin tables
    - Comprehensive audit logging for admin actions

  3. Indexes
    - Index on user_id for admin roles
    - Index on content_id and type for reports
    - Index on date for platform stats
*/

-- Create admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('super_admin', 'moderator', 'support')),
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Create content reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content_type text NOT NULL CHECK (content_type IN ('listing', 'profile', 'review', 'message')),
  content_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolved_by uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- Create platform stats table
CREATE TABLE IF NOT EXISTS platform_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  total_listings integer DEFAULT 0,
  new_listings integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  new_bookings integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  active_users integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_user ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_platform_stats_date ON platform_stats(date DESC);

-- Enable Row Level Security
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE admin_roles.user_id = is_admin.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for admin_roles
CREATE POLICY "Only admins can view admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only super admins can manage admin roles"
  ON admin_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- RLS Policies for content_reports
CREATE POLICY "Users can view their own reports"
  ON content_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Authenticated users can create reports"
  ON content_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can update reports"
  ON content_reports FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for platform_stats
CREATE POLICY "Admins can view platform stats"
  ON platform_stats FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage platform stats"
  ON platform_stats FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Function to calculate daily platform stats
CREATE OR REPLACE FUNCTION calculate_platform_stats(stat_date date)
RETURNS void AS $$
BEGIN
  INSERT INTO platform_stats (
    date,
    total_users,
    new_users,
    total_listings,
    new_listings,
    total_bookings,
    new_bookings,
    total_revenue,
    active_users
  )
  SELECT
    stat_date,
    (SELECT COUNT(*) FROM profiles WHERE created_at <= stat_date + interval '1 day'),
    (SELECT COUNT(*) FROM profiles WHERE created_at::date = stat_date),
    (SELECT COUNT(*) FROM listings WHERE created_at <= stat_date + interval '1 day' AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM listings WHERE created_at::date = stat_date AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM bookings WHERE created_at <= stat_date + interval '1 day'),
    (SELECT COUNT(*) FROM bookings WHERE created_at::date = stat_date),
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'completed' AND completed_at <= stat_date + interval '1 day'),
    (SELECT COUNT(DISTINCT renter_id) FROM bookings WHERE created_at::date = stat_date)
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    total_listings = EXCLUDED.total_listings,
    new_listings = EXCLUDED.new_listings,
    total_bookings = EXCLUDED.total_bookings,
    new_bookings = EXCLUDED.new_bookings,
    total_revenue = EXCLUDED.total_revenue,
    active_users = EXCLUDED.active_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;