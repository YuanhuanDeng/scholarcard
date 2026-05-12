/**
 * TypeScript types matching the Supabase schema.
 *
 * Keep this in sync with supabase/schema.sql.
 * (Optionally: use `npx supabase gen types typescript` to auto-generate.)
 */

export type Profile = {
  id: string;
  user_id: string;
  username: string;

  name_en: string;
  name_zh: string | null;
  avatar_url: string | null;

  role: string | null;
  institution: string | null;
  institution_url: string | null;
  secondary_role: string | null;
  secondary_institution: string | null;

  bio_input: string | null;
  bio_en: string | null;
  research_interests: string[];

  scholar_url: string | null;
  semantic_scholar_id: string | null;

  looking_for_text: string | null;
  looking_for_tags: string[];

  email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  xiaohongshu_id: string | null;

  accent_color: string;

  published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type Publication = {
  id: string;
  profile_id: string;
  title: string;
  authors: string[];
  venue: string | null;
  year: number | null;
  paper_url: string | null;
  pdf_url: string | null;
  code_url: string | null;
  semantic_scholar_paper_id: string | null;
  citation_count: number;
  display_order: number;
  is_featured: boolean;
  created_at: string;
};

export type ResearchThread = {
  id: string;
  profile_id: string;
  heading: string;
  tagline: string | null;
  display_order: number;
  created_at: string;
};

export type NewsItem = {
  id: string;
  profile_id: string;
  date: string;
  content: string;
  is_new: boolean;
  display_order: number;
  created_at: string;
};

/**
 * Full profile data structure for rendering a user's academic site.
 * This is what's returned by the data fetcher used in /sites/[username]/page.tsx.
 */
export type FullProfile = Profile & {
  publications: Publication[];
  research_threads: (ResearchThread & {
    papers: Publication[];
  })[];
  news_items: NewsItem[];
};
