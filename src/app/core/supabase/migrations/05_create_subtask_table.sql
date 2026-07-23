create table public.subtasks (
  id uuid primary key default gen_random_uuid(),

  task_id uuid not null
    references public.tasks(id)
    on delete cascade,

  title text not null,
  is_completed boolean not null default false,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subtasks_title_not_empty
    check (char_length(trim(title)) > 0),

  constraint subtasks_sort_order_valid
    check (sort_order >= 0)
);

alter table public.subtasks enable row level security;