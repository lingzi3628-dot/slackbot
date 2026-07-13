-- SPYRO V1 — Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL → New Query).
-- Creates conversations + messages tables with Row Level Security so users
-- can only see their own data.

-- ── Conversations table ──────────────────────────────────────────────
create table if not exists public.conversations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Messages table ───────────────────────────────────────────────────
create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  type text not null default 'text' check (type in ('text', 'image')),
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation
  on public.messages(conversation_id, created_at);

create index if not exists idx_conversations_user
  on public.conversations(user_id, updated_at desc);

-- ── Row Level Security ───────────────────────────────────────────────
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Users can only see/modify their own conversations.
create policy "Users can CRUD own conversations"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only see/modify messages in their own conversations.
create policy "Users can CRUD own messages"
  on public.messages for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
      and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
      and c.user_id = auth.uid()
    )
  );

-- ── Auto-update updated_at ───────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();
