-- Tighten candidate-uploads storage policies
DROP POLICY IF EXISTS "Anyone can upload candidate files" ON storage.objects;

CREATE POLICY "Public can upload candidate files with constraints"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'candidate-uploads'
  AND (storage.foldername(name))[1] = 'submissions'
  AND lower(storage.extension(name)) IN ('pdf','doc','docx','png','jpg','jpeg','zip','txt','md','ppt','pptx','xls','xlsx')
  AND octet_length(name) < 300
);

CREATE POLICY "Supreme admins can read candidate files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'candidate-uploads' AND public.has_role(auth.uid(), 'supreme_admin'::app_role));

CREATE POLICY "Supreme admins can delete candidate files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'candidate-uploads' AND public.has_role(auth.uid(), 'supreme_admin'::app_role));

-- Trigger-only SECURITY DEFINER-ish helper should not be callable by API roles
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
