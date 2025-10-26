/*
  # Move pg_trgm Extension from Public Schema

  1. Security Enhancement
    - Move pg_trgm extension from public schema to extensions schema
    - Follows security best practice to keep extensions separate
    - Prevents potential conflicts with application objects

  2. Changes
    - Create extensions schema if not exists
    - Move pg_trgm extension
    - Update search_path if needed
*/

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension to extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
