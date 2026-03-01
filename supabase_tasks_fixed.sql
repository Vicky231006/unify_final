-- ── Unify Supabase Tasks Table (V2) ──
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Drop the pre-existing tasks table which had conflicting UUID column types
drop table if exists public.tasks cascade;

-- 2. Create the correct table that matches the local Javascript state
create table public.tasks (
  id uuid primary key,
  workspace_id text not null,
  project_id text,
  title text not null,
  type text default 'Task',
  assignee_id text,             -- Changed from UUID FK because CSV parsing generates local arbitrary UUIDs
  status text default 'To Do',
  weight integer default 5,
  start_date text,
  end_date text,
  completed_date text,
  quality_indicator integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.tasks enable row level security;

-- 4. Policies (Simplified to ensure no database blocks during demo)
create policy "Anyone can view tasks"
  on public.tasks for select
  using ( true );

create policy "Anyone can insert tasks"
  on public.tasks for insert
  with check ( true );

create policy "Anyone can update tasks"
  on public.tasks for update
  using ( true );

create policy "Anyone can delete tasks"
  on public.tasks for delete
  using ( true );
