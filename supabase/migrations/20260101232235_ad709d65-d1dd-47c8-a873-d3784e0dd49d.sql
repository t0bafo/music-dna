-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create push_tokens table for storing device push notification tokens
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups by user
CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (tokens are identified by device, not auth)
CREATE POLICY "Allow insert push tokens"
ON public.push_tokens FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update push tokens"
ON public.push_tokens FOR UPDATE USING (true);

CREATE POLICY "Allow delete push tokens"
ON public.push_tokens FOR DELETE USING (true);

CREATE POLICY "Allow select push tokens"
ON public.push_tokens FOR SELECT USING (true);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();