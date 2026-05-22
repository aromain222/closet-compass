create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.style_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  preferred_materials text[] not null default '{}',
  avoid_materials text[] not null default '{}',
  preferred_colors text[] not null default '{}',
  preferred_brands text[] not null default '{}',
  size_preferences jsonb not null default '{}'::jsonb,
  fit_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.product_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  agent_summary text,
  material_notes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.product_results (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references public.product_searches(id) on delete cascade,
  external_product_id text not null,
  product jsonb not null,
  source text not null default 'mock',
  created_at timestamptz not null default now(),
  unique (search_id, external_product_id)
);

create table if not exists public.saved_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  external_product_id text not null,
  product jsonb not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, external_product_id)
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  external_product_id text not null,
  product jsonb not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  target_price numeric(12,2),
  notify_on_drop boolean not null default true,
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, external_product_id)
);

create table if not exists public.material_profiles (
  id uuid primary key default gen_random_uuid(),
  product_id text not null unique,
  raw_material_text text not null,
  fibers text[] not null default '{}',
  blend_percentages jsonb not null default '{}'::jsonb,
  normalized_blend jsonb not null default '[]'::jsonb,
  fabric_feel text,
  stretch_level text check (stretch_level in ('low', 'medium', 'high', 'unknown')),
  weight text check (weight in ('light', 'midweight', 'heavy', 'unknown')),
  opacity text check (opacity in ('low', 'medium', 'high', 'unknown')),
  breathability text check (breathability in ('low', 'medium', 'high', 'unknown')),
  performance_tags text[] not null default '{}',
  confidence numeric(4,3) not null default 0 check (confidence >= 0 and confidence <= 1),
  confidence_label text not null default 'low' check (confidence_label in ('high', 'medium', 'low')),
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dupe_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  source_product_id text not null,
  alternative_product_id text not null,
  source_product jsonb not null,
  alternative_product jsonb not null,
  score jsonb not null,
  material_explanation text,
  created_at timestamptz not null default now()
);

create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  external_product_id text not null,
  retailer text not null,
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'USD',
  observed_at timestamptz not null default now()
);

create table if not exists public.plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plaid_item_id text not null unique,
  institution_name text,
  access_token_encrypted text not null,
  transactions_cursor text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plaid_item_id uuid references public.plaid_items(id) on delete cascade,
  plaid_transaction_id text unique,
  merchant_name text,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  category text[] not null default '{}',
  shopping_category text not null default 'needs_review'
    check (shopping_category in ('activewear', 'fashion', 'beauty', 'mixed', 'needs_review', 'non_shopping')),
  transaction_date date not null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shopping_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  monthly_limit numeric(12,2) not null check (monthly_limit >= 0),
  currency text not null default 'USD',
  categories text[] not null default array['clothing'],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status text not null default 'unknown'
    check (status in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused', 'unknown')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_event_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  agent_name text not null check (agent_name in ('search', 'material', 'dupe', 'fit', 'budget')),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_style_preferences_updated_at on public.style_preferences;
create trigger set_style_preferences_updated_at
before update on public.style_preferences
for each row execute function public.set_updated_at();

drop trigger if exists set_saved_products_updated_at on public.saved_products;
create trigger set_saved_products_updated_at
before update on public.saved_products
for each row execute function public.set_updated_at();

drop trigger if exists set_wishlist_items_updated_at on public.wishlist_items;
create trigger set_wishlist_items_updated_at
before update on public.wishlist_items
for each row execute function public.set_updated_at();

drop trigger if exists set_material_profiles_updated_at on public.material_profiles;
create trigger set_material_profiles_updated_at
before update on public.material_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_plaid_items_updated_at on public.plaid_items;
create trigger set_plaid_items_updated_at
before update on public.plaid_items
for each row execute function public.set_updated_at();

drop trigger if exists set_shopping_budgets_updated_at on public.shopping_budgets;
create trigger set_shopping_budgets_updated_at
before update on public.shopping_budgets
for each row execute function public.set_updated_at();

drop trigger if exists set_subscription_status_updated_at on public.subscription_status;
create trigger set_subscription_status_updated_at
before update on public.subscription_status
for each row execute function public.set_updated_at();

create index if not exists idx_style_preferences_user_id on public.style_preferences(user_id);
create index if not exists idx_product_searches_user_created on public.product_searches(user_id, created_at desc);
create index if not exists idx_product_results_search_id on public.product_results(search_id);
create index if not exists idx_saved_products_user_created on public.saved_products(user_id, created_at desc);
create index if not exists idx_wishlist_items_user_created on public.wishlist_items(user_id, created_at desc);
create index if not exists idx_material_profiles_fibers on public.material_profiles using gin(fibers);
create index if not exists idx_dupe_comparisons_source on public.dupe_comparisons(source_product_id, created_at desc);
create index if not exists idx_price_history_product_observed on public.price_history(external_product_id, observed_at desc);
create index if not exists idx_plaid_items_user_id on public.plaid_items(user_id);
create index if not exists idx_transactions_user_date on public.transactions(user_id, transaction_date desc);
create index if not exists idx_transactions_user_shopping_category on public.transactions(user_id, shopping_category);
create index if not exists idx_transactions_category on public.transactions using gin(category);
create index if not exists idx_agent_outputs_user_agent_created on public.agent_outputs(user_id, agent_name, created_at desc);
create unique index if not exists idx_one_active_budget_per_user
  on public.shopping_budgets(user_id)
  where active;
create index if not exists idx_subscription_status_user_id on public.subscription_status(user_id);
create index if not exists idx_subscription_status_customer_id on public.subscription_status(stripe_customer_id);

alter table public.profiles enable row level security;
alter table public.style_preferences enable row level security;
alter table public.product_searches enable row level security;
alter table public.product_results enable row level security;
alter table public.saved_products enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.material_profiles enable row level security;
alter table public.dupe_comparisons enable row level security;
alter table public.price_history enable row level security;
alter table public.plaid_items enable row level security;
alter table public.transactions enable row level security;
alter table public.shopping_budgets enable row level security;
alter table public.subscription_status enable row level security;
alter table public.agent_outputs enable row level security;

create policy "profiles own rows" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "style preferences own rows" on public.style_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "product searches own rows" on public.product_searches
  for all using (user_id is null or auth.uid() = user_id) with check (user_id is null or auth.uid() = user_id);

create policy "product results readable through own searches" on public.product_results
  for select using (
    search_id is null or exists (
      select 1 from public.product_searches s
      where s.id = product_results.search_id
      and (s.user_id is null or s.user_id = auth.uid())
    )
  );

create policy "saved products own rows" on public.saved_products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "wishlist own rows" on public.wishlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "material profiles readable" on public.material_profiles
  for select using (true);

create policy "dupe comparisons own or anonymous reads" on public.dupe_comparisons
  for select using (user_id is null or auth.uid() = user_id);

create policy "price history readable" on public.price_history
  for select using (true);

create policy "plaid items own rows" on public.plaid_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions own rows" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "shopping budgets own rows" on public.shopping_budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscription status own rows" on public.subscription_status
  for select using (auth.uid() = user_id);

create policy "agent outputs own rows" on public.agent_outputs
  for all using (user_id is null or auth.uid() = user_id) with check (user_id is null or auth.uid() = user_id);
