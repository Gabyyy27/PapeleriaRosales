-- PAPELERIA ROSALES - COMPRAS PENDIENTES DE DEMOSTRACION

with target_org as (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
  limit 1
),
purchase_data (
  id,
  product_slug,
  product_name,
  requested_quantity,
  supplier_name,
  supplier_phone,
  estimated_cost,
  status,
  notes,
  created_at
) as (
  values
    (
      '30000000-0000-4000-8000-000000000001'::uuid,
      'demo-resma-papel-carta-500',
      'Resma papel carta 500 hojas',
      10,
      'Distribuidora Demo',
      '50499990001',
      1150.00,
      'pending'::public.purchase_status,
      'Reponer antes de finalizar la semana.',
      '2026-07-05 08:00:00-06'::timestamptz
    ),
    (
      '30000000-0000-4000-8000-000000000002'::uuid,
      'demo-agenda-semanal',
      'Agenda semanal',
      12,
      'Proveedor Escolar Demo',
      '50499990002',
      1080.00,
      'ordered'::public.purchase_status,
      'Pedido confirmado con el proveedor.',
      '2026-07-05 10:30:00-06'::timestamptz
    ),
    (
      '30000000-0000-4000-8000-000000000003'::uuid,
      'demo-marcadores-permanentes-6',
      'Marcadores permanentes paquete de 6',
      8,
      'Distribuidora Demo',
      '50499990001',
      680.00,
      'received'::public.purchase_status,
      'Compra recibida para probar el historial.',
      '2026-07-06 15:45:00-06'::timestamptz
    )
)
insert into public.pending_purchases (
  id,
  org_id,
  product_id,
  product_name,
  requested_quantity,
  supplier_name,
  supplier_phone,
  estimated_cost,
  status,
  source,
  notes,
  created_at,
  updated_at
)
select
  purchase_data.id,
  target_org.id,
  product.id,
  purchase_data.product_name,
  purchase_data.requested_quantity,
  purchase_data.supplier_name,
  purchase_data.supplier_phone,
  purchase_data.estimated_cost,
  purchase_data.status,
  'demo',
  purchase_data.notes,
  purchase_data.created_at,
  purchase_data.created_at
from target_org
join purchase_data on true
left join public.products as product
  on product.org_id = target_org.id
 and product.slug = purchase_data.product_slug
on conflict (id)
do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  requested_quantity = excluded.requested_quantity,
  supplier_name = excluded.supplier_name,
  supplier_phone = excluded.supplier_phone,
  estimated_cost = excluded.estimated_cost,
  status = excluded.status,
  source = excluded.source,
  notes = excluded.notes,
  updated_at = excluded.updated_at;
