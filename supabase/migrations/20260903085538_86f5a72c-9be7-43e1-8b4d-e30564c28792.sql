ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS joined_at date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS target_label text,
  ADD COLUMN IF NOT EXISTS target_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employee_of_month_for text,
  ADD COLUMN IF NOT EXISTS bio text;

CREATE POLICY "Company members can view team profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'employee') OR private.has_role(auth.uid(), 'supreme_admin'));

CREATE POLICY "Company members can view team roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'employee') OR private.has_role(auth.uid(), 'supreme_admin'));