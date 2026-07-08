-- PAPELERIA ROSALES - SERVICIOS SECRETARIALES DE DEMOSTRACION

with target_org as (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
  limit 1
),
service_data (name, description, suggested_price, sort_order) as (
  values
    ('Copia de DNI', 'Copia por ambos lados del documento.', 5.00, 10),
    ('Constancia', 'Redaccion e impresion de constancia.', 80.00, 20),
    (
      'Referencia personal',
      'Redaccion e impresion de referencia personal.',
      70.00,
      30
    ),
    (
      'Hoja de impresión completa',
      'Impresion en blanco y negro por pagina.',
      5.00,
      40
    ),
    ('Media página', 'Impresion de media pagina.', 3.00, 50),
    ('Foto carnet', 'Juego de fotografias tamano carnet.', 40.00, 60),
    ('Escaneo de documento', 'Digitalizacion de documentos.', 15.00, 70),
    (
      'Currículum vitae',
      'Redaccion, formato e impresion de curriculum.',
      120.00,
      80
    )
)
insert into public.secretarial_service_types (
  org_id,
  name,
  description,
  suggested_price,
  is_active,
  sort_order
)
select
  target_org.id,
  service_data.name,
  service_data.description,
  service_data.suggested_price,
  true,
  service_data.sort_order
from target_org
cross join service_data
on conflict (org_id, name)
do update set
  description = excluded.description,
  suggested_price = excluded.suggested_price,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

with target_org as (
  select id
  from public.organizations
  where slug = 'papeleria-rosales'
  limit 1
),
job_data (
  id,
  service_name,
  quantity,
  amount_charged,
  customer_name,
  notes,
  sold_at
) as (
  values
    (
      '20000000-0000-4000-8000-000000000001'::uuid,
      'Copia de DNI',
      2,
      10.00,
      'Cliente demo 1',
      'Copias por ambos lados.',
      '2026-07-01 09:15:00-06'::timestamptz
    ),
    (
      '20000000-0000-4000-8000-000000000002'::uuid,
      'Hoja de impresión completa',
      5,
      25.00,
      'Cliente demo 2',
      'Documento escolar.',
      '2026-07-02 11:30:00-06'::timestamptz
    ),
    (
      '20000000-0000-4000-8000-000000000003'::uuid,
      'Currículum vitae',
      1,
      120.00,
      'Cliente demo 3',
      'Curriculum de dos paginas.',
      '2026-07-03 14:20:00-06'::timestamptz
    ),
    (
      '20000000-0000-4000-8000-000000000004'::uuid,
      'Foto carnet',
      2,
      80.00,
      'Cliente demo 4',
      'Dos juegos de fotografias.',
      '2026-07-04 16:10:00-06'::timestamptz
    )
)
insert into public.secretarial_jobs (
  id,
  org_id,
  service_type_id,
  service_name_snapshot,
  quantity,
  amount_charged,
  customer_name,
  notes,
  status,
  sold_at
)
select
  job_data.id,
  target_org.id,
  service_type.id,
  job_data.service_name,
  job_data.quantity,
  job_data.amount_charged,
  job_data.customer_name,
  job_data.notes,
  'completed'::public.secretarial_status,
  job_data.sold_at
from target_org
join job_data on true
join public.secretarial_service_types as service_type
  on service_type.org_id = target_org.id
 and service_type.name = job_data.service_name
on conflict (id)
do update set
  service_type_id = excluded.service_type_id,
  service_name_snapshot = excluded.service_name_snapshot,
  quantity = excluded.quantity,
  amount_charged = excluded.amount_charged,
  customer_name = excluded.customer_name,
  notes = excluded.notes,
  status = excluded.status,
  sold_at = excluded.sold_at;
