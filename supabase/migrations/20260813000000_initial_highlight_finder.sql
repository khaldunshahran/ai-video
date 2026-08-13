create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  source_url text not null,
  title text,
  duration_seconds integer,
  status text not null check (status in ('pending', 'processing', 'ready', 'failed')) default 'pending',
  created_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  type text not null check (type in ('ingest', 'transcribe_chunk', 'analyze')),
  status text not null check (status in ('queued', 'running', 'done', 'failed')) default 'queued',
  attempts integer not null default 0,
  error text,
  started_at timestamptz,
  completed_at timestamptz
);

create table transcript_segments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  start_seconds numeric not null,
  end_seconds numeric not null,
  speaker_label text,
  text text not null,
  check (start_seconds >= 0),
  check (end_seconds >= start_seconds)
);

create table candidate_moments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  start_seconds numeric not null,
  end_seconds numeric not null,
  score numeric not null,
  rationale text not null,
  tag text,
  created_at timestamptz not null default now(),
  check (start_seconds >= 0),
  check (end_seconds >= start_seconds)
);

create table moment_decisions (
  id uuid primary key default gen_random_uuid(),
  candidate_moment_id uuid references candidate_moments on delete cascade not null,
  decision text not null check (decision in ('used', 'not_useful')),
  actual_start_seconds numeric,
  actual_end_seconds numeric,
  created_at timestamptz not null default now(),
  check (actual_start_seconds is null or actual_start_seconds >= 0),
  check (actual_end_seconds is null or actual_start_seconds is null or actual_end_seconds >= actual_start_seconds)
);
