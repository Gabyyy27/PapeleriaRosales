-- PAPELERIA ROSALES - LIMPIEZA DE DATOS DE DEMOSTRACION
-- Ejecutar manualmente. Este archivo no forma parte de db.seed.sql_paths.

begin;

delete from public.inventory_movements
where id::text like '50000000-%';

delete from public.sales
where id::text like '40000000-%';

delete from public.pending_purchases
where id::text like '30000000-%';

delete from public.secretarial_jobs
where id::text like '20000000-%';

delete from public.products
where org_id = (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
)
and slug::text like 'demo-%';

delete from public.product_categories
where org_id = (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
)
and slug::text like 'demo-%';

delete from public.secretarial_service_types
where org_id = (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
)
and name in ('Escaneo de documento', 'Currículum vitae');

update public.secretarial_service_types
set
  description = null,
  suggested_price = null,
  sort_order = case name
    when 'Copia de DNI' then 1
    when 'Constancia' then 2
    when 'Referencia personal' then 3
    when 'Hoja de impresión completa' then 4
    when 'Media página' then 5
    when 'Foto carnet' then 6
    else sort_order
  end,
  updated_at = now()
where org_id = (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
)
and name in (
  'Copia de DNI',
  'Constancia',
  'Referencia personal',
  'Hoja de impresión completa',
  'Media página',
  'Foto carnet'
);

commit;
