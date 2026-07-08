-- PAPELERIA ROSALES - VENTAS POS Y WHATSAPP DE DEMOSTRACION

with target_org as (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
  limit 1
),
sale_data (
  id,
  channel,
  total_amount,
  payment_method,
  customer_name,
  customer_phone,
  notes,
  sold_at
) as (
  values
    (
      '40000000-0000-4000-8000-000000000001'::uuid,
      'pos'::public.sale_channel,
      150.00,
      'cash',
      'Cliente mostrador',
      null,
      'Venta POS de demostracion.',
      '2026-07-06 10:15:00-06'::timestamptz
    ),
    (
      '40000000-0000-4000-8000-000000000002'::uuid,
      'whatsapp'::public.sale_channel,
      172.00,
      'transfer',
      'Cliente WhatsApp',
      '50499990003',
      'Pedido coordinado por WhatsApp.',
      '2026-07-07 13:40:00-06'::timestamptz
    )
)
insert into public.sales (
  id,
  org_id,
  channel,
  status,
  total_amount,
  payment_method,
  customer_name,
  customer_phone,
  notes,
  sold_at
)
select
  sale_data.id,
  target_org.id,
  sale_data.channel,
  'completed'::public.sale_status,
  sale_data.total_amount,
  sale_data.payment_method,
  sale_data.customer_name,
  sale_data.customer_phone,
  sale_data.notes,
  sale_data.sold_at
from target_org
cross join sale_data
on conflict (id)
do update set
  channel = excluded.channel,
  status = excluded.status,
  total_amount = excluded.total_amount,
  payment_method = excluded.payment_method,
  customer_name = excluded.customer_name,
  customer_phone = excluded.customer_phone,
  notes = excluded.notes,
  sold_at = excluded.sold_at;

with target_org as (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
  limit 1
),
item_data (
  id,
  sale_id,
  product_slug,
  product_name,
  quantity,
  unit_price,
  line_total
) as (
  values
    (
      '41000000-0000-4000-8000-000000000001'::uuid,
      '40000000-0000-4000-8000-000000000001'::uuid,
      'demo-cuaderno-espiral-100-hojas',
      'Cuaderno espiral 100 hojas',
      2,
      48.00,
      96.00
    ),
    (
      '41000000-0000-4000-8000-000000000002'::uuid,
      '40000000-0000-4000-8000-000000000001'::uuid,
      'demo-lapices-grafito-12',
      'Lapices de grafito caja de 12',
      1,
      54.00,
      54.00
    ),
    (
      '41000000-0000-4000-8000-000000000003'::uuid,
      '40000000-0000-4000-8000-000000000002'::uuid,
      'demo-resma-papel-carta-500',
      'Resma papel carta 500 hojas',
      1,
      148.00,
      148.00
    ),
    (
      '41000000-0000-4000-8000-000000000004'::uuid,
      '40000000-0000-4000-8000-000000000002'::uuid,
      'demo-cartulina-color',
      'Cartulina de color unidad',
      2,
      12.00,
      24.00
    )
)
insert into public.sale_items (
  id,
  org_id,
  sale_id,
  product_id,
  product_name_snapshot,
  quantity,
  unit_price,
  line_total
)
select
  item_data.id,
  target_org.id,
  item_data.sale_id,
  product.id,
  item_data.product_name,
  item_data.quantity,
  item_data.unit_price,
  item_data.line_total
from target_org
join item_data on true
join public.products as product
  on product.org_id = target_org.id
 and product.slug = item_data.product_slug
on conflict (id)
do update set
  sale_id = excluded.sale_id,
  product_id = excluded.product_id,
  product_name_snapshot = excluded.product_name_snapshot,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  line_total = excluded.line_total;
