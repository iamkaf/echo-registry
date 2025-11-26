-- Migration: Add download_urls column to dependency_cache table
-- Purpose: Add support for storing Modrinth download URLs by mod loader
-- Run this in your Supabase SQL editor for existing databases

-- Check if the column exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dependency_cache'
        AND column_name = 'download_urls'
    ) THEN
        ALTER TABLE dependency_cache
        ADD COLUMN download_urls JSONB;

        RAISE NOTICE 'download_urls column added successfully';
    ELSE
        RAISE NOTICE 'download_urls column already exists';
    END IF;
END $$;

-- Optional: Create index for better query performance on download_urls
CREATE INDEX IF NOT EXISTS idx_dependency_cache_download_urls
ON dependency_cache USING GIN (download_urls);

-- Grant permissions on the new column
GRANT SELECT (download_urls) ON dependency_cache TO anon;
GRANT SELECT, INSERT, UPDATE (download_urls) ON dependency_cache TO authenticated, service_role;
