-- Add preview_url column to track_cache table
ALTER TABLE public.track_cache 
ADD COLUMN preview_url TEXT;