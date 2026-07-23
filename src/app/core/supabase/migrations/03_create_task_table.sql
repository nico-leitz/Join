create table public.tasks (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text not null default '',
  due_date date not null,

  priority text not null default 'medium',
  category text not null,
  status text not null default 'todo',
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tasks_title_not_empty
    check (char_length(trim(title)) > 0),

  constraint tasks_priority_valid
    check (priority in ('urgent', 'medium', 'low')),

  constraint tasks_category_valid
    check (category in ('technical_task', 'user_story')),

  constraint tasks_status_valid
    check (
      status in (
        'todo',
        'in_progress',
        'awaiting_feedback',
        'done'
      )
    ),

  constraint tasks_sort_order_valid
    check (sort_order >= 0)
);

alter table public.tasks enable row level security;