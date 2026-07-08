-- PAPELERIA ROSALES - ORGANIZACION BASE DE DEMOSTRACION

insert into public.organizations (
  name,
  slug,
  whatsapp_number
)
values (
  'Papelería Rosales',
  'papeleria-rosales',
  null
)
on conflict (slug)
do update set
  name = excluded.name,
  updated_at = now();
