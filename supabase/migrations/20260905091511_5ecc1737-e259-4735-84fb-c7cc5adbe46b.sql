CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  service text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can send a contact message" ON public.contact_messages;
CREATE POLICY "Anyone can send a contact message"
  ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Signed-in staff can read contact messages" ON public.contact_messages;
CREATE POLICY "Signed-in staff can read contact messages"
  ON public.contact_messages FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Signed-in staff can update contact messages" ON public.contact_messages;
CREATE POLICY "Signed-in staff can update contact messages"
  ON public.contact_messages FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Signed-in staff can delete contact messages" ON public.contact_messages;
CREATE POLICY "Signed-in staff can delete contact messages"
  ON public.contact_messages FOR DELETE TO authenticated
  USING (true);