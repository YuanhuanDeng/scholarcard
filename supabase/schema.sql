-- ScholarCard initial database schema
-- Paste this entire file into Supabase SQL Editor and run

-- ============================================
-- profiles table (core user data)
-- ============================================
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  username text unique not null,                  -- used as subdomain
  
  -- Basic identity
  name_en text not null,
  name_zh text,
  avatar_url text,
  
  -- Affiliation
  role text,                                       -- "PhD Student" / "Postdoc" / "SWE" / etc.
  institution text,
  institution_url text,
  secondary_role text,                             -- e.g. "MS in AI candidate at UT Austin"
  secondary_institution text,
  
  -- Research bio
  bio_input text,                                  -- raw user input (any language)
  bio_en text,                                     -- LLM-polished English
  research_interests text[] default array[]::text[],
  
  -- Scholar integration
  scholar_url text,
  semantic_scholar_id text,
  
  -- Collaboration discovery (the differentiation field)
  looking_for_text text,                           -- free-form English description
  looking_for_tags text[] default array[]::text[], -- e.g. ['coauthor', 'mentor', 'cross-disciplinary']
  
  -- Contact
  email text,
  github_url text,
  linkedin_url text,
  twitter_url text,
  xiaohongshu_id text,
  
  -- Theme
  accent_color text default '#2A4D7C',
  
  -- Meta
  published boolean default false,
  view_count int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- index on username for fast subdomain lookup
create index profiles_username_idx on profiles (username);
create index profiles_user_id_idx on profiles (user_id);

-- ============================================
-- publications table
-- ============================================
create table publications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles on delete cascade not null,
  
  title text not null,
  authors text[] default array[]::text[],         -- ordered list
  venue text,                                      -- "IEEE VIS 2026"
  year int,
  
  -- Links
  paper_url text,
  pdf_url text,
  code_url text,
  
  -- External
  semantic_scholar_paper_id text,
  citation_count int default 0,
  
  -- Display
  display_order int default 0,
  is_featured boolean default false,
  
  created_at timestamp with time zone default now()
);

create index publications_profile_id_idx on publications (profile_id);
create index publications_year_idx on publications (year desc);

-- ============================================
-- research_threads (the 3-direction structure on user page)
-- ============================================
create table research_threads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles on delete cascade not null,
  
  heading text not null,                           -- "GPU Performance Visualization"
  tagline text,                                    -- "Making hardware events legible..."
  display_order int default 0,
  
  created_at timestamp with time zone default now()
);

-- linking table: which papers go under which research thread
create table research_thread_papers (
  thread_id uuid references research_threads on delete cascade,
  publication_id uuid references publications on delete cascade,
  note text,                                       -- "the central paper in this thread"
  display_order int default 0,
  primary key (thread_id, publication_id)
);

-- ============================================
-- news_items (the "News" section)
-- ============================================
create table news_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles on delete cascade not null,
  
  date date not null,
  content text not null,                           -- markdown-ish, supports inline links
  is_new boolean default false,                    -- shows the "new" badge
  display_order int default 0,
  
  created_at timestamp with time zone default now()
);

create index news_items_profile_id_idx on news_items (profile_id);

-- ============================================
-- Row Level Security (RLS) policies
-- ============================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table publications enable row level security;
alter table research_threads enable row level security;
alter table research_thread_papers enable row level security;
alter table news_items enable row level security;

-- Profiles: anyone can READ published profiles (for the public website)
create policy "Published profiles are viewable by everyone"
  on profiles for select
  using (published = true);

-- Profiles: users can read their own (even unpublished)
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = user_id);

-- Profiles: users can insert/update their own
create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = user_id);

-- Publications: public read for published profiles
create policy "Publications visible if profile is published"
  on publications for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = publications.profile_id
      and (profiles.published = true or profiles.user_id = auth.uid())
    )
  );

create policy "Users can manage their publications"
  on publications for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = publications.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- Research threads: same pattern
create policy "Research threads visible if profile published"
  on research_threads for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = research_threads.profile_id
      and (profiles.published = true or profiles.user_id = auth.uid())
    )
  );

create policy "Users can manage their research threads"
  on research_threads for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = research_threads.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- Research thread papers: inherit from threads
create policy "Thread papers visible if thread visible"
  on research_thread_papers for select
  using (
    exists (
      select 1 from research_threads t
      join profiles p on p.id = t.profile_id
      where t.id = research_thread_papers.thread_id
      and (p.published = true or p.user_id = auth.uid())
    )
  );

create policy "Users can manage their thread papers"
  on research_thread_papers for all
  using (
    exists (
      select 1 from research_threads t
      join profiles p on p.id = t.profile_id
      where t.id = research_thread_papers.thread_id
      and p.user_id = auth.uid()
    )
  );

-- News items: same pattern
create policy "News visible if profile published"
  on news_items for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = news_items.profile_id
      and (profiles.published = true or profiles.user_id = auth.uid())
    )
  );

create policy "Users can manage their news"
  on news_items for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = news_items.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- Storage bucket for avatars
-- ============================================
-- Run this separately if needed:
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- ============================================
-- Updated_at trigger
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();
