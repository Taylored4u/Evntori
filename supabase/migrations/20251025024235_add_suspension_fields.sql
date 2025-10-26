/*
  # Add User Suspension Fields

  1. Changes
    - Add `is_suspended` field to profiles
    - Add `suspension_reason` field to profiles
    - Add `admin_notes` field to listings for admin moderation

  2. Notes
    - Used for admin moderation and account management
*/

-- Add suspension fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_suspended'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_suspended boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'suspension_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN suspension_reason text;
  END IF;
END $$;

-- Add admin notes to listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE listings ADD COLUMN admin_notes text;
  END IF;
END $$;

-- Create index for suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended) WHERE is_suspended = true;