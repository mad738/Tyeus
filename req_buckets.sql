-- Create the product-models bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-models', 'product-models', true)
ON CONFLICT (id) DO NOTHING;

-- Create the user-models bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('user-models', 'user-models', true)
ON CONFLICT (id) DO NOTHING;

-- Create the request-images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('request-images', 'request-images', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES (Re-run to ensure they exist)

-- 1. Product Models Policies
DROP POLICY IF EXISTS "Public Read Product Models" ON storage.objects;
CREATE POLICY "Public Read Product Models"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-models' );

DROP POLICY IF EXISTS "Authenticated Admin Upload Product Models" ON storage.objects;
CREATE POLICY "Authenticated Admin Upload Product Models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-models' );

DROP POLICY IF EXISTS "Authenticated Admin Update Product Models" ON storage.objects;
CREATE POLICY "Authenticated Admin Update Product Models"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-models' );

-- 2. User Models Policies
DROP POLICY IF EXISTS "Public Model Access" ON storage.objects;
CREATE POLICY "Public Model Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'user-models' );

DROP POLICY IF EXISTS "Authenticated users can upload models" ON storage.objects;
CREATE POLICY "Authenticated users can upload models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'user-models' );

-- 3. Request Images Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'request-images' );
