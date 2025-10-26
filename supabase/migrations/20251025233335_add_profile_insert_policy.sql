/*
  # Add INSERT policy for profiles table

  1. Changes
    - Add policy to allow authenticated users to insert their own profile during signup
    - This is required for the signup process to work correctly
  
  2. Security
    - Users can only insert a profile with their own auth.uid()
    - The policy ensures users cannot create profiles for other users
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
