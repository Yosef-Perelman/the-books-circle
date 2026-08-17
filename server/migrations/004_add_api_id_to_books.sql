-- Add api_id to books table to store the original API identifier (e.g., OpenLibrary ID)
-- This allows fetching live data (like descriptions) from the external API using this ID.

ALTER TABLE books
ADD COLUMN IF NOT EXISTS api_id text;
