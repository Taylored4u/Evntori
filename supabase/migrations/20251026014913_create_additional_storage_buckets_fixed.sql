/*
  # Create Additional Storage Buckets

  1. New Buckets
    - `message-attachments` - Private access for message file uploads
    - `dispute-evidence` - Restricted access for admin and involved parties

  2. Security Policies
    - Privacy controls for message attachments
    - Restricted access for dispute evidence
*/

-- Create message-attachments bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create dispute-evidence bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dispute-evidence',
  'dispute-evidence',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message-attachments
CREATE POLICY "Users can view message attachments in their conversations"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'message-attachments' AND
    EXISTS (
      SELECT 1 FROM messages m
      INNER JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id::text = (storage.foldername(name))[1]
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload message attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'message-attachments');

-- Storage policies for dispute-evidence
CREATE POLICY "Users can view their own dispute evidence"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dispute-evidence' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload dispute evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'dispute-evidence');

CREATE POLICY "Admins can view all dispute evidence"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dispute-evidence' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );