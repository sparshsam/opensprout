create table public.mcp_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  token_hash text not null,
  token_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  revoked_at timestamptz
);

create index idx_mcp_tokens_user on public.mcp_tokens(user_id);

alter table public.mcp_tokens enable row level security;

create policy "Users manage their own tokens"
  on public.mcp_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
