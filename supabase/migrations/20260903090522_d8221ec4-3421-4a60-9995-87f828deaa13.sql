CREATE POLICY "Anyone can upload candidate files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'candidate-uploads');

CREATE POLICY "Supreme admin can read candidate files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'candidate-uploads' AND private.has_role(auth.uid(), 'supreme_admin'::app_role));