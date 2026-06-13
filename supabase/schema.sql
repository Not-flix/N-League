-- Mahjong League database schema for Supabase / PostgreSQL.
-- Run this in Supabase SQL Editor on a fresh project.

create extension if not exists "pgcrypto";

create table if not exists players (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  joined_at       timestamptz not null default now(),
  active          boolean not null default true,
  avatar_data_url text
);

-- If you ran an earlier version of this schema, add the column with:
--   alter table players add column if not exists avatar_data_url text;

create table if not exists matches (
  id          uuid primary key default gen_random_uuid(),
  played_at   timestamptz not null,
  created_at  timestamptz not null default now(),
  note        text
);

create table if not exists match_results (
  match_id     uuid not null references matches(id) on delete cascade,
  player_id    uuid not null references players(id) on delete restrict,
  raw_score    integer not null,
  rank         smallint not null check (rank between 1 and 4),
  final_points numeric(10,1) not null,
  primary key (match_id, player_id)
);

create index if not exists match_results_player_idx on match_results (player_id);
create index if not exists matches_played_at_idx on matches (played_at desc);

create table if not exists schedule (
  id            uuid primary key default gen_random_uuid(),
  scheduled_at  timestamptz not null,
  label         text not null,
  notes         text
);

create table if not exists settings (
  key    text primary key,
  value  jsonb not null
);

-- Seed the default scoring config so the app can read it on first run.
insert into settings (key, value)
values (
  'scoring',
  '{"startingPoints":25000,"returnPoints":25000,"uma":[15,5,-5,-15]}'::jsonb
)
on conflict (key) do nothing;
