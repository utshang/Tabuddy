-- ============================================================
-- Tabuddy: Initial Schema + RLS Policies
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- User profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  avatar_url text,
  updated_at timestamptz default now()
);

-- Trips
create table if not exists public.trips (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  start_date date,
  end_date   date,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trip members (the RLS anchor for all per-trip data)
create table if not exists public.trip_members (
  trip_id    uuid not null references public.trips(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz default now(),
  primary key (trip_id, user_id)
);

-- Days within a trip
create table if not exists public.days (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  date       date not null,
  "order"    integer not null default 0,
  created_at timestamptz default now()
);

-- Activities within a day
create table if not exists public.activities (
  id         uuid primary key default gen_random_uuid(),
  day_id     uuid not null references public.days(id) on delete cascade,
  title      text not null,
  place      text,
  start_time time,
  note       text,
  "order"    integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Expenses
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  payer_id    uuid not null references public.profiles(id),
  amount      numeric(12, 2) not null check (amount > 0),
  currency    text not null default 'TWD',
  description text not null,
  split_type  text not null default 'equal' check (split_type in ('equal', 'amount', 'percent')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Expense splits (per-member share of each expense)
create table if not exists public.expense_splits (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  share      numeric(12, 4) not null,
  primary key (expense_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists trips_owner_id_idx          on public.trips(owner_id);
create index if not exists trip_members_user_id_idx    on public.trip_members(user_id);
create index if not exists trip_members_trip_id_idx    on public.trip_members(trip_id);
create index if not exists days_trip_id_idx            on public.days(trip_id);
create index if not exists activities_day_id_idx       on public.activities(day_id);
create index if not exists expenses_trip_id_idx        on public.expenses(trip_id);
create index if not exists expense_splits_expense_id_idx on public.expense_splits(expense_id);

-- ============================================================
-- RLS: ENABLE
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.trips          enable row level security;
alter table public.trip_members   enable row level security;
alter table public.days           enable row level security;
alter table public.activities     enable row level security;
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;

-- ============================================================
-- HELPER: is the current user a member of the given trip?
-- ============================================================

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id
      and user_id = auth.uid()
  );
$$;

-- ============================================================
-- RLS: profiles
-- ============================================================

-- Anyone who is authenticated can read any profile (names are shown to trip-mates)
create policy "profiles: authenticated read"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Users can only insert/update their own profile
create policy "profiles: owner insert"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles: owner update"
  on public.profiles for update
  using (id = auth.uid());

-- ============================================================
-- RLS: trips
-- ============================================================

-- Only trip members can read a trip
create policy "trips: member read"
  on public.trips for select
  using (public.is_trip_member(id));

-- Any authenticated user can create a trip
create policy "trips: authenticated insert"
  on public.trips for insert
  with check (auth.role() = 'authenticated' and owner_id = auth.uid());

-- Only the owner can update or delete
create policy "trips: owner update"
  on public.trips for update
  using (owner_id = auth.uid());

create policy "trips: owner delete"
  on public.trips for delete
  using (owner_id = auth.uid());

-- ============================================================
-- RLS: trip_members
-- ============================================================

-- Trip members can read who else is in their trips
create policy "trip_members: member read"
  on public.trip_members for select
  using (public.is_trip_member(trip_id));

-- The trip owner (or the user inserting themselves) can add members
-- We allow any authenticated user to insert a row for themselves (join via invite link)
create policy "trip_members: insert self or owner"
  on public.trip_members for insert
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.trips
      where id = trip_id and owner_id = auth.uid()
    )
  );

-- Only the trip owner can remove members (or a member can remove themselves)
create policy "trip_members: owner delete or self leave"
  on public.trip_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.trips
      where id = trip_id and owner_id = auth.uid()
    )
  );

-- ============================================================
-- RLS: days
-- ============================================================

create policy "days: member read"
  on public.days for select
  using (public.is_trip_member(trip_id));

create policy "days: member insert"
  on public.days for insert
  with check (public.is_trip_member(trip_id));

create policy "days: member update"
  on public.days for update
  using (public.is_trip_member(trip_id));

create policy "days: member delete"
  on public.days for delete
  using (public.is_trip_member(trip_id));

-- ============================================================
-- RLS: activities
-- ============================================================

create policy "activities: member read"
  on public.activities for select
  using (
    exists (
      select 1 from public.days d
      where d.id = day_id and public.is_trip_member(d.trip_id)
    )
  );

create policy "activities: member insert"
  on public.activities for insert
  with check (
    exists (
      select 1 from public.days d
      where d.id = day_id and public.is_trip_member(d.trip_id)
    )
  );

create policy "activities: member update"
  on public.activities for update
  using (
    exists (
      select 1 from public.days d
      where d.id = day_id and public.is_trip_member(d.trip_id)
    )
  );

create policy "activities: member delete"
  on public.activities for delete
  using (
    exists (
      select 1 from public.days d
      where d.id = day_id and public.is_trip_member(d.trip_id)
    )
  );

-- ============================================================
-- RLS: expenses
-- ============================================================

create policy "expenses: member read"
  on public.expenses for select
  using (public.is_trip_member(trip_id));

create policy "expenses: member insert"
  on public.expenses for insert
  with check (public.is_trip_member(trip_id) and payer_id = auth.uid());

create policy "expenses: member update"
  on public.expenses for update
  using (public.is_trip_member(trip_id));

create policy "expenses: member delete"
  on public.expenses for delete
  using (public.is_trip_member(trip_id));

-- ============================================================
-- RLS: expense_splits
-- ============================================================

create policy "expense_splits: member read"
  on public.expense_splits for select
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_trip_member(e.trip_id)
    )
  );

create policy "expense_splits: member insert"
  on public.expense_splits for insert
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_trip_member(e.trip_id)
    )
  );

create policy "expense_splits: member update"
  on public.expense_splits for update
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_trip_member(e.trip_id)
    )
  );

create policy "expense_splits: member delete"
  on public.expense_splits for delete
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_trip_member(e.trip_id)
    )
  );

-- ============================================================
-- TRIGGER: auto-create profile on sign-up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TRIGGER: auto-add owner to trip_members on trip creation
-- ============================================================

create or replace function public.handle_new_trip()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create or replace trigger on_trip_created
  after insert on public.trips
  for each row execute function public.handle_new_trip();
