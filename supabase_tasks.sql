-- ── Supabase Tasks Table ──
-- Run this in your Supabase Dashboard -> SQL Editor

create table if not exists public.tasks (
  id uuid primary key,
  workspace_id text not null,
  project_id text,
  title text not null,
  type text default 'Task',
  assignee_id uuid references public.users(id),
  status text default 'To Do',
  weight integer default 5,
  start_date text,
  end_date text,
  completed_date text,
  quality_indicator integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tasks enable row level security;

-- Policies
create policy "Anyone in the workspace can view tasks"
  on public.tasks for select
  using ( true );

create policy "Managers and CEOs can insert tasks"
  on public.tasks for insert
  with check ( public.get_user_role() in ('Manager', 'CEO') );

create policy "Anyone can update tasks (assignees can mark done)"
  on public.tasks for update
  using ( true );

create policy "Managers and CEOs can delete tasks"
  on public.tasks for delete
  using ( public.get_user_role() in ('Manager', 'CEO') );
