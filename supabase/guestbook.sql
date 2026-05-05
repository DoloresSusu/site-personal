create extension if not exists pgcrypto;

create table if not exists public.guestbook_messages (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 40),
    message text not null check (char_length(message) between 2 and 500),
    page text not null default 'homepage',
    tag text,
    status text not null default 'visible' check (status in ('visible', 'hidden', 'pending')),
    created_at timestamptz not null default now()
);

create index if not exists guestbook_messages_visible_created_at_idx
    on public.guestbook_messages (created_at desc)
    where status = 'visible';

alter table public.guestbook_messages enable row level security;

drop policy if exists "Public visible messages are readable" on public.guestbook_messages;
create policy "Public visible messages are readable"
    on public.guestbook_messages
    for select
    using (status = 'visible');

drop policy if exists "Anyone can submit visible messages" on public.guestbook_messages;
create policy "Anyone can submit visible messages"
    on public.guestbook_messages
    for insert
    with check (
        status = 'visible'
        and char_length(name) between 1 and 40
        and char_length(message) between 2 and 500
    );
