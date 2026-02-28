-- ── Supabase RBAC Schema (Adjusted for Role Selection) ──
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Drop existing policies/triggers to ensure clean run
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user cascade;
drop trigger if exists prevent_role_escalation on public.users;
drop function if exists public.check_role_escalation cascade;
drop function if exists public.get_user_role cascade;

-- 2. Create public.users table
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  full_name text,
  role text check (role in ('CEO', 'Manager', 'Employee')) default 'Employee',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reset RLS
alter table public.users enable row level security;
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Everyone can view everyone (for now)" on public.users;
drop policy if exists "CEO can view all" on public.users;
drop policy if exists "Manager can view employees and managers" on public.users;
drop policy if exists "CEO can update all" on public.users;

-- 3. Security Definer Helper Function to check current user's role
create or replace function public.get_user_role()
returns text
language sql
security definer set search_path = ''
stable
as $$
  select role from public.users where id = auth.uid();
$$;

-- 4. Re-create RLS Policies
-- SELECT Policies
create policy "Users can view own profile" 
  on public.users for select 
  using ( auth.uid() = id );

create policy "CEO can view all" 
  on public.users for select 
  using ( public.get_user_role() = 'CEO' );

create policy "Manager can view employees and managers" 
  on public.users for select 
  using ( public.get_user_role() = 'Manager' and role in ('Employee', 'Manager') );

-- Important: Since this is a collaborative/dashboard app for demoing purposes,
-- let's allow everyone to at least see everyone's name/role so the teams feature doesn't break.
create policy "Everyone can view everyone"
  on public.users for select
  using ( true );

-- UPDATE Policies
create policy "Users can update own profile" 
  on public.users for update 
  using ( auth.uid() = id );

create policy "CEO can update all" 
  on public.users for update 
  using ( public.get_user_role() = 'CEO' );

-- 5. Trigger: Allow new signups to pass their chosen role via metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    -- Use the role passed in from the frontend, or default to Employee if not provided
    coalesce(new.raw_user_meta_data->>'role', 'Employee')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Optional: Trigger to prevent role escalation after signup
-- We'll keep this so users can't edit their role LATER, but they can pick it at signup.
create or replace function public.check_role_escalation()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if public.get_user_role() != 'CEO' then
      raise exception 'Permission denied: Only CEOs can change user roles after creation.';
    end if;
  end if;
  return new;
end;
$$;

create trigger prevent_role_escalation
  before update on public.users
  for each row
  execute procedure public.check_role_escalation();
