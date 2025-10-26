/*
  # Create Notifications System

  ## Overview
  Comprehensive notification system for the KnotAgain marketplace with support for
  in-app notifications, email notifications, and notification preferences.

  ## New Tables

  ### `notifications`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles) - Recipient of the notification
  - `type` (text) - Type of notification (booking_confirmed, message_received, etc.)
  - `title` (text) - Notification title
  - `message` (text) - Notification message content
  - `link` (text, optional) - Deep link to relevant page
  - `is_read` (boolean) - Whether notification has been read
  - `read_at` (timestamptz, optional) - When notification was read
  - `data` (jsonb, optional) - Additional structured data
  - `created_at` (timestamptz) - When notification was created

  ### `notification_preferences`
  - `user_id` (uuid, primary key) - User's notification preferences
  - `email_booking_confirmed` (boolean) - Email for booking confirmations
  - `email_booking_updated` (boolean) - Email for booking status changes
  - `email_message_received` (boolean) - Email for new messages
  - `email_review_reminder` (boolean) - Email for review reminders
  - `email_payment_received` (boolean) - Email for payment confirmations
  - `email_marketing` (boolean) - Marketing emails
  - `push_enabled` (boolean) - Push notifications enabled
  - `updated_at` (timestamptz) - Last preference update

  ## Security
  - Enable RLS on all tables
  - Users can only see their own notifications
  - Users can only manage their own preferences

  ## Functions
  - `create_notification` - Helper function to create notifications
  - Triggers for automatic notification creation on key events
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_booking_confirmed boolean DEFAULT true,
  email_booking_updated boolean DEFAULT true,
  email_message_received boolean DEFAULT true,
  email_review_reminder boolean DEFAULT true,
  email_payment_received boolean DEFAULT true,
  email_marketing boolean DEFAULT false,
  push_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL,
  p_data jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_data)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_notification_preferences_on_profile_create'
  ) THEN
    CREATE TRIGGER create_notification_preferences_on_profile_create
      AFTER INSERT ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION create_default_notification_preferences();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION notify_on_booking_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  v_listing_title text;
  v_renter_name text;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    SELECT title INTO v_listing_title
    FROM listings
    WHERE id = NEW.listing_id;

    PERFORM create_notification(
      NEW.renter_id,
      'booking_confirmed',
      'Booking Confirmed',
      'Your booking for "' || v_listing_title || '" has been confirmed!',
      '/bookings/' || NEW.id
    );

    SELECT full_name INTO v_renter_name
    FROM profiles
    WHERE id = NEW.renter_id;

    PERFORM create_notification(
      NEW.lender_id,
      'booking_confirmed',
      'New Booking Confirmed',
      v_renter_name || ' booked your item "' || v_listing_title || '"',
      '/sell/bookings/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'notify_on_booking_confirmed_trigger'
  ) THEN
    CREATE TRIGGER notify_on_booking_confirmed_trigger
      AFTER INSERT OR UPDATE ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION notify_on_booking_confirmed();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id uuid;
  v_sender_name text;
  v_conversation_data jsonb;
BEGIN
  SELECT
    CASE
      WHEN c.participant_1_id = NEW.sender_id THEN c.participant_2_id
      ELSE c.participant_1_id
    END INTO v_recipient_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  SELECT full_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  SELECT jsonb_build_object(
    'conversation_id', c.id,
    'listing_id', c.listing_id,
    'listing_title', l.title
  ) INTO v_conversation_data
  FROM conversations c
  LEFT JOIN listings l ON l.id = c.listing_id
  WHERE c.id = NEW.conversation_id;

  PERFORM create_notification(
    v_recipient_id,
    'message_received',
    'New Message',
    v_sender_name || ' sent you a message',
    '/messages?conversation=' || NEW.conversation_id,
    v_conversation_data
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'notify_on_new_message_trigger'
  ) THEN
    CREATE TRIGGER notify_on_new_message_trigger
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION notify_on_new_message();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION notify_on_review_submitted()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_name text;
  v_listing_title text;
BEGIN
  SELECT full_name INTO v_reviewer_name
  FROM profiles
  WHERE id = NEW.reviewer_id;

  SELECT title INTO v_listing_title
  FROM listings
  WHERE id = NEW.listing_id;

  PERFORM create_notification(
    NEW.reviewee_id,
    'review_received',
    'New Review Received',
    v_reviewer_name || ' left you a ' || NEW.rating || '-star review on "' || v_listing_title || '"',
    '/profile'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'notify_on_review_submitted_trigger'
  ) THEN
    CREATE TRIGGER notify_on_review_submitted_trigger
      AFTER INSERT ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION notify_on_review_submitted();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION notify_on_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_listing_title text;
  v_status_message text;
BEGIN
  IF NEW.status != OLD.status THEN
    SELECT title INTO v_listing_title
    FROM listings
    WHERE id = NEW.listing_id;

    CASE NEW.status
      WHEN 'active' THEN
        v_status_message := 'Your rental of "' || v_listing_title || '" is now active';
      WHEN 'completed' THEN
        v_status_message := 'Your rental of "' || v_listing_title || '" has been completed';
      WHEN 'cancelled' THEN
        v_status_message := 'Your booking for "' || v_listing_title || '" has been cancelled';
      ELSE
        v_status_message := 'Your booking for "' || v_listing_title || '" status: ' || NEW.status;
    END CASE;

    PERFORM create_notification(
      NEW.renter_id,
      'booking_updated',
      'Booking Status Updated',
      v_status_message,
      '/bookings/' || NEW.id
    );

    PERFORM create_notification(
      NEW.lender_id,
      'booking_updated',
      'Booking Status Updated',
      'Booking for "' || v_listing_title || '" status: ' || NEW.status,
      '/sell/bookings/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'notify_on_booking_status_change_trigger'
  ) THEN
    CREATE TRIGGER notify_on_booking_status_change_trigger
      AFTER UPDATE ON bookings
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION notify_on_booking_status_change();
  END IF;
END $$;
