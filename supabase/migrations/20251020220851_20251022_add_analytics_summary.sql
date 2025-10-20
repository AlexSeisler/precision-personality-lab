/*
  # Add Analytics Summaries Table

  ## Purpose
  Add persistent analytics caching for faster metrics loading and historical trend analysis.
  
  ## New Tables
  - `analytics_summaries`
    - `id` (uuid, primary key) - Unique summary identifier
    - `user_id` (uuid, FK → auth.users) - User isolation for data security
    - `calibration_id` (uuid, FK → calibrations.id) - Links analytics to calibration context
    - `metrics_summary` (jsonb) - Cached computed metrics data
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable RLS on `analytics_summaries` table
  - Add policy for authenticated users to manage their own summaries only
  - Enforce `auth.uid()` based access control
  
  ## Relationships
  - Cascading delete from `calibrations` → `analytics_summaries`
  - Foreign key to `auth.users` for user isolation
  
  ## Performance
  - Index on `user_id` for fast user-scoped queries
  - Index on `calibration_id` for context-based lookups
  - Index on `created_at` for temporal sorting and analytics
*/

-- Create analytics_summaries table
create table if not exists analytics_summaries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  calibration_id uuid references calibrations(id) on delete cascade,
  metrics_summary jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table analytics_summaries enable row level security;

-- Create RLS policies for authenticated users
create policy "Users can view their own analytics summaries"
  on analytics_summaries
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own analytics summaries"
  on analytics_summaries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own analytics summaries"
  on analytics_summaries
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own analytics summaries"
  on analytics_summaries
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists analytics_summaries_user_id_idx on analytics_summaries(user_id);
create index if not exists analytics_summaries_calibration_id_idx on analytics_summaries(calibration_id);
create index if not exists analytics_summaries_created_at_idx on analytics_summaries(created_at desc);

-- Create updated_at trigger
create or replace function update_analytics_summaries_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger analytics_summaries_updated_at
  before update on analytics_summaries
  for each row
  execute function update_analytics_summaries_updated_at();