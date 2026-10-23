ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS personal_email text,
  ADD COLUMN IF NOT EXISTS company_email text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS telegram_number text;

UPDATE public.access_requests
SET personal_email = COALESCE(personal_email, email),
    whatsapp_number = COALESCE(whatsapp_number, phone);