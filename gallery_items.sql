create table public.gallery_items (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  type text not null,
  created_at timestamptz default now()
);

alter table public.gallery_items enable row level security;

create policy "Herkes okuyabilir" on public.gallery_items for select using (true);
create policy "Herkes ekleyebilir" on public.gallery_items for insert with check (true);
create policy "Herkes silebilir" on public.gallery_items for delete using (true);
