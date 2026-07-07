-- =========================================================
-- PAPELERIA ROSALES - INITIAL DATABASE SCHEMA
-- Supabase Postgres + RLS
-- =========================================================

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

-- =========================================================
-- ENUMS
-- =========================================================

create type public.app_role as enum ('owner', 'admin', 'cashier', 'viewer');

create type public.product_status as enum ('active', 'inactive', 'archived');

create type public.sale_channel as enum ('pos', 'whatsapp');

create type public.sale_status as enum ('completed', 'cancelled', 'refunded');

create type public.movement_type as enum (
  'stock_in',
  'stock_out',
  'sale',
  'adjustment',
  'pending_purchase',
  'return'
);

create type public.purchase_status as enum (
  'pending',
  'ordered',
  'received',
  'cancelled'
);

create type public.secretarial_status as enum (
  'completed',
  'cancelled'
);

-- =========================================================
-- ORGANIZATIONS / USERS / ROLES
-- =========================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  whatsapp_number text,
  address text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email citext,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

insert into public.organizations (name, slug, whatsapp_number)
values ('Papelería Rosales', 'papeleria-rosales', null)
on conflict (slug) do nothing;

-- =========================================================
-- AUTH PROFILE TRIGGER
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- ROLE HELPERS
-- =========================================================

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
      and m.is_active = true
  );
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
      and m.is_active = true
      and m.role = any(p_roles)
  );
$$;

-- =========================================================
-- CATEGORIES / PRODUCTS / COSTS / IMAGES
-- =========================================================

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug citext not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  slug citext not null,
  description text,
  sku text,
  barcode text,
  stock int not null default 0 check (stock >= 0),
  min_stock int not null default 0 check (min_stock >= 0),
  sale_price numeric(12,2) not null check (sale_price >= 0),
  status public.product_status not null default 'active',
  visible_public boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug),
  unique (org_id, sku)
);

-- El costo se separa para no exponerlo al catálogo público.
create table public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  storage_bucket text not null default 'product-images',
  storage_path text not null,
  public_url text,
  alt_text text,
  position int not null check (position between 1 and 5),
  created_at timestamptz not null default now(),
  unique (product_id, position)
);

-- =========================================================
-- INVENTORY MOVEMENTS
-- =========================================================

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type public.movement_type not null,
  quantity int not null,
  previous_stock int,
  new_stock int,
  reason text,
  reference_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- SALES / POS
-- =========================================================

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  channel public.sale_channel not null default 'pos',
  status public.sale_status not null default 'completed',
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  payment_method text not null default 'cash',
  customer_name text,
  customer_phone text,
  notes text,
  sold_by uuid references auth.users(id),
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name_snapshot text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

-- =========================================================
-- PENDING PURCHASES
-- =========================================================

create table public.pending_purchases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  requested_quantity int not null default 1 check (requested_quantity > 0),
  supplier_name text,
  supplier_phone text,
  estimated_cost numeric(12,2) check (estimated_cost >= 0),
  status public.purchase_status not null default 'pending',
  source text not null default 'manual',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- SECRETARIAL SERVICES
-- Dinero separado de ventas de productos.
-- =========================================================

create table public.secretarial_service_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  suggested_price numeric(12,2) check (suggested_price >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create table public.secretarial_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  service_type_id uuid references public.secretarial_service_types(id) on delete set null,
  service_name_snapshot text not null,
  quantity int not null default 1 check (quantity > 0),
  amount_charged numeric(12,2) not null check (amount_charged >= 0),
  customer_name text,
  notes text,
  status public.secretarial_status not null default 'completed',
  sold_by uuid references auth.users(id),
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Seed de servicios precargados
insert into public.secretarial_service_types (org_id, name, suggested_price, sort_order)
select o.id, x.name, x.price, x.sort_order
from public.organizations o
cross join (
  values
    ('Copia de DNI', null::numeric, 1),
    ('Constancia', null::numeric, 2),
    ('Referencia personal', null::numeric, 3),
    ('Hoja de impresión completa', null::numeric, 4),
    ('Media página', null::numeric, 5),
    ('Foto carnet', null::numeric, 6)
) as x(name, price, sort_order)
where o.slug = 'papeleria-rosales'
on conflict do nothing;

-- =========================================================
-- IMPORT BATCHES
-- =========================================================

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  file_name text not null,
  total_rows int not null default 0,
  imported_rows int not null default 0,
  failed_rows int not null default 0,
  status text not null default 'pending',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.import_errors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number int not null,
  error_message text not null,
  raw_data jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- AUDIT LOGS
-- =========================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_name text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- INDEXES
-- =========================================================

create index idx_members_user_org on public.organization_members (user_id, org_id);
create index idx_categories_org_active on public.product_categories (org_id, is_active);

create index idx_products_org_status on public.products (org_id, status);
create index idx_products_public on public.products (org_id, visible_public, status);
create index idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
create index idx_products_sku on public.products (org_id, sku);
create index idx_product_images_product_position on public.product_images (product_id, position);

create index idx_inventory_movements_product_created on public.inventory_movements (product_id, created_at desc);

create index idx_sales_org_sold_at on public.sales (org_id, sold_at desc);
create index idx_sales_channel_status on public.sales (org_id, channel, status);
create index idx_sale_items_sale on public.sale_items (sale_id);

create index idx_pending_purchases_org_status on public.pending_purchases (org_id, status, created_at desc);

create index idx_secretarial_jobs_org_sold_at on public.secretarial_jobs (org_id, sold_at desc);
create index idx_secretarial_jobs_search on public.secretarial_jobs using gin (service_name_snapshot gin_trgm_ops);

-- =========================================================
-- PUBLIC CATALOG VIEW
-- No expone costos.
-- =========================================================

create or replace view public.catalog_products
with (security_invoker = true)
as
select
  p.id,
  p.org_id,
  p.category_id,
  c.name as category_name,
  p.name,
  p.slug,
  p.description,
  p.sku,
  p.stock,
  p.sale_price,
  p.visible_public,
  p.status,
  p.created_at,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', pi.id,
        'url', pi.public_url,
        'alt', pi.alt_text,
        'position', pi.position
      )
      order by pi.position
    ) filter (where pi.id is not null),
    '[]'::jsonb
  ) as images
from public.products p
left join public.product_categories c on c.id = p.category_id
left join public.product_images pi on pi.product_id = p.id
where p.status = 'active'
  and p.visible_public = true
group by p.id, c.name;

-- =========================================================
-- RPC: RECORD POS SALE
-- Calcula precios desde BD y descuenta stock transaccionalmente.
-- =========================================================

create or replace function public.record_pos_sale(
  p_org_id uuid,
  p_items jsonb,
  p_payment_method text default 'cash',
  p_customer_name text default null,
  p_customer_phone text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_total numeric(12,2) := 0;
  v_item record;
  v_product record;
  v_line_total numeric(12,2);
  v_previous_stock int;
  v_new_stock int;
begin
  if not public.has_org_role(
    p_org_id,
    array['owner'::public.app_role, 'admin'::public.app_role, 'cashier'::public.app_role]
  ) then
    raise exception 'Not authorized';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Sale requires at least one item';
  end if;

  insert into public.sales (
    org_id,
    channel,
    status,
    payment_method,
    total_amount,
    customer_name,
    customer_phone,
    notes,
    sold_by
  )
  values (
    p_org_id,
    'pos',
    'completed',
    p_payment_method,
    0,
    p_customer_name,
    p_customer_phone,
    p_notes,
    auth.uid()
  )
  returning id into v_sale_id;

  for v_item in
    select *
    from jsonb_to_recordset(p_items)
      as x(product_id uuid, quantity int)
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Invalid quantity';
    end if;

    select p.id, p.name, p.stock, p.sale_price
    into v_product
    from public.products p
    where p.id = v_item.product_id
      and p.org_id = p_org_id
      and p.status = 'active'
    for update;

    if not found then
      raise exception 'Product not found';
    end if;

    if v_product.stock < v_item.quantity then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_previous_stock := v_product.stock;
    v_new_stock := v_product.stock - v_item.quantity;
    v_line_total := v_product.sale_price * v_item.quantity;

    update public.products
    set stock = v_new_stock,
        updated_at = now(),
        updated_by = auth.uid()
    where id = v_product.id;

    insert into public.sale_items (
      org_id,
      sale_id,
      product_id,
      product_name_snapshot,
      quantity,
      unit_price,
      line_total
    )
    values (
      p_org_id,
      v_sale_id,
      v_product.id,
      v_product.name,
      v_item.quantity,
      v_product.sale_price,
      v_line_total
    );

    insert into public.inventory_movements (
      org_id,
      product_id,
      movement_type,
      quantity,
      previous_stock,
      new_stock,
      reason,
      reference_id,
      created_by
    )
    values (
      p_org_id,
      v_product.id,
      'sale',
      -v_item.quantity,
      v_previous_stock,
      v_new_stock,
      'POS sale',
      v_sale_id,
      auth.uid()
    );

    v_total := v_total + v_line_total;
  end loop;

  update public.sales
  set total_amount = v_total
  where id = v_sale_id;

  insert into public.audit_logs (
    org_id,
    actor_id,
    action,
    entity_name,
    entity_id,
    metadata
  )
  values (
    p_org_id,
    auth.uid(),
    'record_pos_sale',
    'sales',
    v_sale_id,
    jsonb_build_object('total', v_total)
  );

  return v_sale_id;
end;
$$;

-- =========================================================
-- RPC: RECORD SECRETARIAL JOB
-- Contabilidad separada de ventas de productos.
-- =========================================================

create or replace function public.record_secretarial_job(
  p_org_id uuid,
  p_service_type_id uuid,
  p_quantity int,
  p_amount_charged numeric,
  p_customer_name text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
  v_service_name text;
begin
  if not public.has_org_role(
    p_org_id,
    array['owner'::public.app_role, 'admin'::public.app_role, 'cashier'::public.app_role]
  ) then
    raise exception 'Not authorized';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Invalid quantity';
  end if;

  if p_amount_charged is null or p_amount_charged < 0 then
    raise exception 'Invalid amount';
  end if;

  select name
  into v_service_name
  from public.secretarial_service_types
  where id = p_service_type_id
    and org_id = p_org_id
    and is_active = true;

  if not found then
    raise exception 'Service type not found';
  end if;

  insert into public.secretarial_jobs (
    org_id,
    service_type_id,
    service_name_snapshot,
    quantity,
    amount_charged,
    customer_name,
    notes,
    status,
    sold_by
  )
  values (
    p_org_id,
    p_service_type_id,
    v_service_name,
    p_quantity,
    p_amount_charged,
    p_customer_name,
    p_notes,
    'completed',
    auth.uid()
  )
  returning id into v_job_id;

  insert into public.audit_logs (
    org_id,
    actor_id,
    action,
    entity_name,
    entity_id,
    metadata
  )
  values (
    p_org_id,
    auth.uid(),
    'record_secretarial_job',
    'secretarial_jobs',
    v_job_id,
    jsonb_build_object('amount', p_amount_charged)
  );

  return v_job_id;
end;
$$;

-- =========================================================
-- RLS ENABLE
-- =========================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_costs enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.pending_purchases enable row level security;
alter table public.secretarial_service_types enable row level security;
alter table public.secretarial_jobs enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_errors enable row level security;
alter table public.audit_logs enable row level security;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- Organizations
create policy "members can read organizations"
on public.organizations
for select
to authenticated
using (public.is_org_member(id));

-- Profiles
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Organization members
create policy "members can read members of their org"
on public.organization_members
for select
to authenticated
using (public.is_org_member(org_id));

create policy "owners admins can manage members"
on public.organization_members
for all
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Product categories
create policy "public can read active categories"
on public.product_categories
for select
to anon, authenticated
using (is_active = true);

create policy "admins can manage categories"
on public.product_categories
for all
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Products
create policy "public can read visible active products"
on public.products
for select
to anon, authenticated
using (visible_public = true and status = 'active');

create policy "members can read all products in org"
on public.products
for select
to authenticated
using (public.is_org_member(org_id));

create policy "admins can manage products"
on public.products
for all
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Product costs
create policy "admins can read product costs"
on public.product_costs
for select
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

create policy "admins can manage product costs"
on public.product_costs
for all
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Product images
create policy "public can read product images"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and p.visible_public = true
      and p.status = 'active'
  )
);

create policy "admins can manage product images"
on public.product_images
for all
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Inventory movements
create policy "members can read inventory movements"
on public.inventory_movements
for select
to authenticated
using (public.is_org_member(org_id));

create policy "admins can manage inventory movements"
on public.inventory_movements
for all
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Sales
create policy "members can read sales"
on public.sales
for select
to authenticated
using (public.is_org_member(org_id));

create policy "cashiers admins can insert sales"
on public.sales
for insert
to authenticated
with check (
  public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role, 'cashier'::public.app_role])
);

create policy "admins can update sales"
on public.sales
for update
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Sale items
create policy "members can read sale items"
on public.sale_items
for select
to authenticated
using (public.is_org_member(org_id));

create policy "cashiers admins can insert sale items"
on public.sale_items
for insert
to authenticated
with check (
  public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role, 'cashier'::public.app_role])
);

-- Pending purchases
create policy "members can read pending purchases"
on public.pending_purchases
for select
to authenticated
using (public.is_org_member(org_id));

create policy "admins can manage pending purchases"
on public.pending_purchases
for all
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Secretarial service types
create policy "members can read secretarial service types"
on public.secretarial_service_types
for select
to authenticated
using (public.is_org_member(org_id));

create policy "admins can manage secretarial service types"
on public.secretarial_service_types
for all
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Secretarial jobs
create policy "members can read secretarial jobs"
on public.secretarial_jobs
for select
to authenticated
using (public.is_org_member(org_id));

create policy "cashiers admins can insert secretarial jobs"
on public.secretarial_jobs
for insert
to authenticated
with check (
  public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role, 'cashier'::public.app_role])
);

create policy "admins can update secretarial jobs"
on public.secretarial_jobs
for update
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Imports
create policy "admins can manage import batches"
on public.import_batches
for all
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

create policy "admins can manage import errors"
on public.import_errors
for all
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]))
with check (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- Audit logs
create policy "admins can read audit logs"
on public.audit_logs
for select
to authenticated
using (public.has_org_role(org_id, array['owner'::public.app_role, 'admin'::public.app_role]));

-- =========================================================
-- GRANTS
-- =========================================================

grant usage on schema public to anon, authenticated;

grant select on public.catalog_products to anon, authenticated;

grant select on public.product_categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_images to anon, authenticated;

grant all on public.organizations to authenticated;
grant all on public.profiles to authenticated;
grant all on public.organization_members to authenticated;
grant all on public.product_categories to authenticated;
grant all on public.products to authenticated;
grant all on public.product_costs to authenticated;
grant all on public.product_images to authenticated;
grant all on public.inventory_movements to authenticated;
grant all on public.sales to authenticated;
grant all on public.sale_items to authenticated;
grant all on public.pending_purchases to authenticated;
grant all on public.secretarial_service_types to authenticated;
grant all on public.secretarial_jobs to authenticated;
grant all on public.import_batches to authenticated;
grant all on public.import_errors to authenticated;
grant select on public.audit_logs to authenticated;

grant execute on function public.record_pos_sale(uuid, jsonb, text, text, text, text) to authenticated;
grant execute on function public.record_secretarial_job(uuid, uuid, int, numeric, text, text) to authenticated;