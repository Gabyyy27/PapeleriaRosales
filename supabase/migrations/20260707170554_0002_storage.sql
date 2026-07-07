-- =========================================================
-- PRODUCT IMAGES BUCKET
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Público puede leer imágenes del catálogo.
create policy "public can read product image files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

-- Solo usuarios autenticados con rol administrativo deberían subir.
-- En v1 esto valida autenticación. La validación exacta por org/producto
-- se debe reforzar desde el flujo de app y/o una Edge Function de uploads.
create policy "authenticated can upload product image files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');

create policy "authenticated can update product image files"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy "authenticated can delete product image files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images');