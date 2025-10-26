/*
  # Add Email Preferences System

  1. New Table
    - `email_preferences`
      - `user_id` (uuid, primary key, references profiles)
      - `booking_notifications` (boolean) - Receive booking emails
      - `message_notifications` (boolean) - Receive message emails
      - `review_notifications` (boolean) - Receive review emails
      - `marketing_emails` (boolean) - Receive marketing emails
      - `updated_at` (timestamptz) - Last preference update

  2. Security
    - Enable RLS on email_preferences
    - Users can only manage their own preferences
    - Auto-create preferences on user registration

  3. Default Settings
    - All notification types enabled by default
    - Marketing emails disabled by default
*/

-- Create email preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  booking_notifications boolean DEFAULT true,
  message_notifications boolean DEFAULT true,
  review_notifications boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences"
  ON email_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to create default email preferences
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create email preferences
DROP TRIGGER IF EXISTS trigger_create_email_preferences ON profiles;
CREATE TRIGGER trigger_create_email_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_email_preferences();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_email_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_preferences_timestamp ON email_preferences;
CREATE TRIGGER trigger_update_email_preferences_timestamp
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_timestamp();
