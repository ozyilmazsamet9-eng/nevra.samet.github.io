create table public.messages (
  id uuid default gen_random_uuid() primary key,
  author_name text,
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Herkes okuyabilir" on public.messages for select using (true);
create policy "Herkes mesaj ekleyebilir" on public.messages for insert with check (true);
