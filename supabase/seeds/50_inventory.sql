-- PAPELERIA ROSALES - MOVIMIENTOS DE INVENTARIO DE DEMOSTRACION

with target_org as (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
  limit 1
),
movement_data (
  id,
  product_slug,
  movement_type,
  quantity,
  previous_stock,
  new_stock,
  reason,
  created_at
) as (
  values
    (
      '50000000-0000-4000-8000-000000000001'::uuid,
      'demo-cuaderno-espiral-100-hojas',
      'stock_in'::public.movement_type,
      30,
      0,
      30,
      'Entrada inicial de demostracion.',
      '2026-07-01 08:00:00-06'::timestamptz
    ),
    (
      '50000000-0000-4000-8000-000000000002'::uuid,
      'demo-cuaderno-espiral-100-hojas',
      'sale'::public.movement_type,
      -5,
      30,
      25,
      'Salida acumulada para demostracion.',
      '2026-07-06 10:15:00-06'::timestamptz
    ),
    (
      '50000000-0000-4000-8000-000000000003'::uuid,
      'demo-resma-papel-carta-500',
      'stock_in'::public.movement_type,
      12,
      0,
      12,
      'Entrada inicial de demostracion.',
      '2026-07-02 09:30:00-06'::timestamptz
    ),
    (
      '50000000-0000-4000-8000-000000000004'::uuid,
      'demo-agenda-semanal',
      'adjustment'::public.movement_type,
      -2,
      2,
      0,
      'Ajuste de producto agotado.',
      '2026-07-07 17:00:00-06'::timestamptz
    )
)
insert into public.inventory_movements (
  id,
  org_id,
  product_id,
  movement_type,
  quantity,
  previous_stock,
  new_stock,
  reason,
  created_at
)
select
  movement_data.id,
  target_org.id,
  product.id,
  movement_data.movement_type,
  movement_data.quantity,
  movement_data.previous_stock,
  movement_data.new_stock,
  movement_data.reason,
  movement_data.created_at
from target_org
join movement_data on true
join public.products as product
  on product.org_id = target_org.id
 and product.slug = movement_data.product_slug
on conflict (id)
do update set
  product_id = excluded.product_id,
  movement_type = excluded.movement_type,
  quantity = excluded.quantity,
  previous_stock = excluded.previous_stock,
  new_stock = excluded.new_stock,
  reason = excluded.reason,
  created_at = excluded.created_at;
