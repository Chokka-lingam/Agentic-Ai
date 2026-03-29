create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default timezone('utc'::text, now()),
  full_name text
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists messages_user_id_idx on public.messages (user_id);

create or replace function public.generate_profile_username(user_email text, user_id uuid)
returns text
language sql
immutable
as $$
  select left(
    regexp_replace(
      lower(coalesce(nullif(split_part(user_email, '@', 1), ''), 'traveler')) || '_' || replace(left(user_id::text, 8), '-', ''),
      '[^a-z0-9_]',
      '',
      'g'
    ),
    20
  );
$$;

update public.profiles
set username = public.generate_profile_username(email, id)
where username is null or username = '';

alter table public.profiles alter column username set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_key'
  ) then
    alter table public.profiles add constraint profiles_username_key unique (username);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format'
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username ~ '^[a-z0-9_]{3,20}$');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_content_length'
  ) then
    alter table public.messages
      add constraint messages_content_length
      check (char_length(trim(content)) between 1 and 1000);
  end if;
end
$$;

alter table public.profiles enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Messages are viewable by everyone" on public.messages;
create policy "Messages are viewable by everyone"
  on public.messages
  for select
  using (true);

drop policy if exists "Authenticated users can insert messages" on public.messages;
create policy "Authenticated users can insert messages"
  on public.messages
  for insert
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
begin
  requested_username := lower(nullif(new.raw_user_meta_data ->> 'username', ''));

  insert into public.profiles (id, email, username, full_name, avatar_url, bio)
  values (
    new.id,
    new.email,
    coalesce(
      requested_username,
      public.generate_profile_username(new.email, new.id)
    ),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    null
  )
  on conflict (id) do update
  set email = excluded.email,
      username = coalesce(public.profiles.username, excluded.username),
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;
