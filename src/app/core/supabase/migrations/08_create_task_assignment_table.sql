create table public.task_assignments (
  task_id uuid not null
    references public.tasks(id)
    on delete cascade,

  contact_id uuid not null
    references public.contacts(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  constraint task_assignments_primary_key
    primary key (task_id, contact_id)
);

alter table public.task_assignments enable row level security;