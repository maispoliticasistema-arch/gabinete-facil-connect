-- Create storage bucket for portal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-images', 'portal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for portal images
CREATE POLICY "Portal images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'portal-images');

CREATE POLICY "Authenticated users can upload portal images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'portal-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own portal images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'portal-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own portal images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'portal-images' 
  AND auth.role() = 'authenticated'
);