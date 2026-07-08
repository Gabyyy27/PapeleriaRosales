-- =========================================================
-- PAPELERIA ROSALES - CATALOGO DE DEMOSTRACION
-- Categorias, productos e imagenes para desarrollo y pruebas.
-- Es idempotente por los slugs y SKU con prefijo DEMO.
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from public.organizations
    where slug = 'papeleria-rosales'
  ) then
    raise exception 'No existe la organizacion papeleria-rosales.';
  end if;
end;
$$;

with target_org as (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
  limit 1
),
category_data (name, slug, description, sort_order) as (
  values
    ('Escolares', 'demo-escolares', 'Cuadernos y materiales para clases.', 10),
    ('Escritura', 'demo-escritura', 'Lapices, boligrafos y marcadores.', 20),
    (
      'Arte y manualidades',
      'demo-arte',
      'Materiales para crear, colorear y recortar.',
      30
    ),
    ('Oficina', 'demo-oficina', 'Papeleria y organizacion para el trabajo.', 40)
)
insert into public.product_categories (
  org_id,
  name,
  slug,
  description,
  sort_order,
  is_active
)
select
  target_org.id,
  category_data.name,
  category_data.slug,
  category_data.description,
  category_data.sort_order,
  true
from target_org
cross join category_data
on conflict (org_id, slug)
do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

with target_org as (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
  limit 1
),
product_data (
  category_slug,
  name,
  slug,
  description,
  sku,
  stock,
  min_stock,
  sale_price
) as (
  values
    (
      'demo-escolares',
      'Cuaderno espiral 100 hojas',
      'demo-cuaderno-espiral-100-hojas',
      'Cuaderno rayado con espiral resistente y cubierta de color.',
      'DEMO-001',
      25,
      5,
      48.00
    ),
    (
      'demo-escolares',
      'Cuaderno cosido 200 paginas',
      'demo-cuaderno-cosido-200-paginas',
      'Cuaderno cosido de larga duracion para uso escolar diario.',
      'DEMO-002',
      18,
      4,
      72.00
    ),
    (
      'demo-escritura',
      'Lapices de grafito caja de 12',
      'demo-lapices-grafito-12',
      'Lapices HB para escritura, dibujo y tareas escolares.',
      'DEMO-003',
      32,
      6,
      54.00
    ),
    (
      'demo-escritura',
      'Boligrafos azules caja de 12',
      'demo-boligrafos-azules-12',
      'Boligrafos de tinta azul con trazo suave y uniforme.',
      'DEMO-004',
      20,
      5,
      88.00
    ),
    (
      'demo-escritura',
      'Marcadores permanentes paquete de 6',
      'demo-marcadores-permanentes-6',
      'Marcadores de punta fina en colores surtidos.',
      'DEMO-005',
      14,
      3,
      118.00
    ),
    (
      'demo-arte',
      'Lapices de colores caja de 24',
      'demo-lapices-colores-24',
      'Colores intensos para ilustracion y trabajos escolares.',
      'DEMO-006',
      16,
      4,
      164.00
    ),
    (
      'demo-escritura',
      'Resaltadores paquete de 4',
      'demo-resaltadores-4',
      'Cuatro colores fluorescentes para estudio y oficina.',
      'DEMO-007',
      22,
      4,
      94.00
    ),
    (
      'demo-arte',
      'Cartulina de color unidad',
      'demo-cartulina-color',
      'Cartulina flexible disponible en colores surtidos.',
      'DEMO-008',
      60,
      10,
      12.00
    ),
    (
      'demo-arte',
      'Papel construccion paquete de 20',
      'demo-papel-construccion-20',
      'Hojas de colores para maquetas y manualidades.',
      'DEMO-009',
      24,
      5,
      68.00
    ),
    (
      'demo-arte',
      'Tijera escolar punta redonda',
      'demo-tijera-escolar',
      'Tijera comoda y segura para trabajos escolares.',
      'DEMO-010',
      19,
      4,
      46.00
    ),
    (
      'demo-arte',
      'Pegamento blanco 4 onzas',
      'demo-pegamento-blanco-4oz',
      'Pegamento lavable para papel, carton y manualidades.',
      'DEMO-011',
      28,
      5,
      39.00
    ),
    (
      'demo-oficina',
      'Folder manila paquete de 10',
      'demo-folder-manila-10',
      'Folders tamano carta para archivo y clasificacion.',
      'DEMO-012',
      17,
      4,
      58.00
    ),
    (
      'demo-oficina',
      'Resma papel carta 500 hojas',
      'demo-resma-papel-carta-500',
      'Papel blanco multiproposito para impresion y copias.',
      'DEMO-013',
      12,
      3,
      148.00
    ),
    (
      'demo-oficina',
      'Grapadora mediana',
      'demo-grapadora-mediana',
      'Grapadora metalica compacta para escritorio.',
      'DEMO-014',
      10,
      2,
      112.00
    ),
    (
      'demo-oficina',
      'Agenda semanal',
      'demo-agenda-semanal',
      'Agenda con planificacion semanal y espacio para notas.',
      'DEMO-015',
      0,
      2,
      136.00
    )
)
insert into public.products (
  org_id,
  category_id,
  name,
  slug,
  description,
  sku,
  stock,
  min_stock,
  sale_price,
  status,
  visible_public
)
select
  target_org.id,
  category.id,
  product_data.name,
  product_data.slug,
  product_data.description,
  product_data.sku,
  product_data.stock,
  product_data.min_stock,
  product_data.sale_price,
  'active'::public.product_status,
  true
from target_org
join product_data on true
join public.product_categories as category
  on category.org_id = target_org.id
 and category.slug = product_data.category_slug
on conflict (org_id, slug)
do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  sku = excluded.sku,
  stock = excluded.stock,
  min_stock = excluded.min_stock,
  sale_price = excluded.sale_price,
  status = 'active'::public.product_status,
  visible_public = true,
  updated_at = now();

with target_org as (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
  limit 1
),
image_data (product_slug, label, color, position) as (
  values
    ('demo-cuaderno-espiral-100-hojas', 'Cuaderno frente', '166534', 1),
    ('demo-cuaderno-espiral-100-hojas', 'Hojas rayadas', '0f766e', 2),
    ('demo-cuaderno-espiral-100-hojas', 'Detalle espiral', 'b45309', 3),
    ('demo-cuaderno-cosido-200-paginas', 'Cuaderno cosido', '25639b', 1),
    ('demo-lapices-grafito-12', 'Lapices HB', 'b45309', 1),
    ('demo-boligrafos-azules-12', 'Boligrafos azules', '25639b', 1),
    ('demo-marcadores-permanentes-6', 'Marcadores', 'c95d4b', 1),
    ('demo-lapices-colores-24', 'Colores', 'c95d4b', 1),
    ('demo-resaltadores-4', 'Resaltadores', '0f766e', 1),
    ('demo-cartulina-color', 'Cartulina', 'c95d4b', 1),
    ('demo-papel-construccion-20', 'Papel construccion', '166534', 1),
    ('demo-tijera-escolar', 'Tijera escolar', 'c95d4b', 1),
    ('demo-pegamento-blanco-4oz', 'Pegamento', '25639b', 1),
    ('demo-folder-manila-10', 'Folder manila', 'b45309', 1),
    ('demo-resma-papel-carta-500', 'Resma 500 hojas', '166534', 1),
    ('demo-grapadora-mediana', 'Grapadora', 'c95d4b', 1)
)
insert into public.product_images (
  org_id,
  product_id,
  storage_bucket,
  storage_path,
  public_url,
  alt_text,
  position
)
select
  target_org.id,
  product.id,
  'product-images',
  'demo/' || image_data.product_slug || '-' || image_data.position || '.svg',
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" '
    || 'viewBox="0 0 800 800"%3E%3Crect width="800" height="800" '
    || 'fill="%23f5f7fa"/%3E%3Crect x="120" y="120" width="560" '
    || 'height="560" rx="24" fill="%23'
    || image_data.color
    || '"/%3E%3Ctext x="400" y="415" text-anchor="middle" '
    || 'font-family="Arial" font-size="42" fill="%23ffffff"%3E'
    || replace(image_data.label, ' ', '%20')
    || '%3C/text%3E%3C/svg%3E',
  image_data.label,
  image_data.position
from target_org
join image_data on true
join public.products as product
  on product.org_id = target_org.id
 and product.slug = image_data.product_slug
on conflict (product_id, position)
do update set
  storage_path = excluded.storage_path,
  public_url = excluded.public_url,
  alt_text = excluded.alt_text;
