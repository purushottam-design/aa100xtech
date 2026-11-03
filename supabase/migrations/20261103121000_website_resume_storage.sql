BEGIN;
-- A new private bucket; historical candidate uploads are untouched.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('website-resumes','website-resumes',false,5242880,ARRAY['application/pdf'])
ON CONFLICT(id) DO NOTHING;
COMMIT;
