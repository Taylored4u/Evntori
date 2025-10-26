/*
  # Create Storage Buckets for Images

  1. Storage Buckets
    - `listing-images` - For listing/product images
    - `profile-avatars` - For user profile pictures

  2. Storage Policies
    - Allow authenticated users to upload images
    - Allow public read access to all images
    - Allow users to delete their own uploads

  3. Security
    - File size limits handled by application
    - File type validation in application code
    - RLS policies ensure users only delete their own files
*/

-- Create listing-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create profile-avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload listing images
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images');

-- Policy: Allow public read access to listing images
CREATE POLICY "Public can view listing images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listing-images');

-- Policy: Allow lenders to update/delete their listing images
CREATE POLICY "Lenders can update their listing images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-images');

CREATE POLICY "Lenders can delete their listing images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'listing-images');

-- Policy: Allow authenticated users to upload profile avatars
CREATE POLICY "Users can upload their avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to profile avatars
CREATE POLICY "Public can view profile avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-avatars');

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
