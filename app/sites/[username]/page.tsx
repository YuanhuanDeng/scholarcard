import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { FullProfile, Publication } from '@/lib/types';

/**
 * User academic website renderer.
 *
 * URL: yuanhuan.scholarcard.app  →  rewritten by middleware to /sites/yuanhuan
 * This page fetches the profile from Supabase and renders the academic site.
 */

type Props = {
  params: Promise<{ username: string }>;
};

async function fetchProfile(username: string): Promise<FullProfile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .eq('published', true)
    .single();

  if (error || !profile) return null;

  const [publicationsRes, threadsRes, newsRes] = await Promise.all([
    supabase
      .from('publications')
      .select('*')
      .eq('profile_id', profile.id)
      .order('year', { ascending: false }),
    supabase
      .from('research_threads')
      .select('*')
      .eq('profile_id', profile.id)
      .order('display_order'),
    supabase
      .from('news_items')
      .select('*')
      .eq('profile_id', profile.id)
      .order('date', { ascending: false }),
  ]);

  return {
    ...profile,
    publications: publicationsRes.data ?? [],
    research_threads: (threadsRes.data ?? []).map((t) => ({
      ...t,
      papers: [], // join via research_thread_papers — simplified for MVP
    })),
    news_items: newsRes.data ?? [],
  };
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const profile = await fetchProfile(username);

  if (!profile) {
    return { title: 'Not found' };
  }

  return {
    title: `${profile.name_en} | ${profile.role ?? 'Researcher'}`,
    description: profile.bio_en ?? `Academic homepage of ${profile.name_en}`,
  };
}

export default async function UserSite({ params }: Props) {
  const { username } = await params;
  const profile = await fetchProfile(username);

  if (!profile) {
    notFound();
  }

  return (
    <div className="academic-site">
      {/* Top nav */}
      <nav className="top-nav">
        <div className="nav-inner">
          <a href="#" className="nav-name">
            {profile.name_en}
          </a>
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#research">Research</a>
            <a href="#news">News</a>
            <a href="#publications">Publications</a>
          </div>
        </div>
      </nav>

      <main className="container">
        {/* Header */}
        <header className="header" id="about">
          <div className="header-photo-col">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name_en}
                className="photo"
              />
            ) : (
              <div className="photo placeholder" />
            )}
            <div className="name-block">
              <h1 className="name">{profile.name_en}</h1>
              {profile.role && (
                <div className="title-line">{profile.role}</div>
              )}
              {profile.institution && (
                <div className="title-line">{profile.institution}</div>
              )}
              {profile.secondary_role && (
                <div className="title-line muted">
                  {profile.secondary_role}
                </div>
              )}
              {profile.email && (
                <div className="email">
                  {profile.email.replace('@', ' [AT] ')}
                </div>
              )}
              <SocialLinks profile={profile} />
            </div>
          </div>

          <div className="about-col">
            {profile.bio_en && (
              <div
                className="about-text"
                // Note: bio_en should be sanitized markdown rendered to HTML.
                // For MVP we render as paragraphs.
                dangerouslySetInnerHTML={{
                  __html: profile.bio_en.replace(/\n\n/g, '</p><p>'),
                }}
              />
            )}

            {profile.looking_for_text && (
              <div className="looking-for-box">
                <div className="looking-for-label">
                  Currently looking for collaborators
                </div>
                <div className="looking-for-text">
                  {profile.looking_for_text}
                </div>
                {profile.looking_for_tags.length > 0 && (
                  <div className="looking-for-tags">
                    {profile.looking_for_tags.map((tag) => (
                      <span key={tag} className="looking-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Research threads */}
        {profile.research_threads.length > 0 && (
          <section className="section" id="research">
            <h2 className="section-title">Research</h2>
            {profile.research_threads.map((thread) => (
              <div key={thread.id} className="research-block">
                <h3 className="research-heading">
                  <span className="research-heading-arrow">→</span>
                  {thread.heading}
                </h3>
                {thread.tagline && (
                  <div className="research-tagline">{thread.tagline}</div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* News */}
        {profile.news_items.length > 0 && (
          <section className="section" id="news">
            <h2 className="section-title">News</h2>
            <ul className="news-list">
              {profile.news_items.map((item) => (
                <li key={item.id} className={item.is_new ? 'new' : ''}>
                  <span className="news-date">{item.date}</span>
                  <span dangerouslySetInnerHTML={{ __html: item.content }} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Publications */}
        {profile.publications.length > 0 && (
          <section className="section" id="publications">
            <h2 className="section-title">Publications</h2>
            <PublicationsList
              publications={profile.publications}
              myName={profile.name_en}
            />
          </section>
        )}

        <footer className="site-footer">
          <div>
            © {new Date().getFullYear()} {profile.name_en} · Made with{' '}
            <a
              href={`https://${process.env.NEXT_PUBLIC_APP_DOMAIN}`}
              target="_blank"
              rel="noopener"
            >
              ScholarCard
            </a>
          </div>
        </footer>
      </main>

      {/* Inline styles — for MVP, copied from academic template */}
      {/* TODO: move to a CSS module or global stylesheet */}
      <style>{ACADEMIC_CSS(profile.accent_color)}</style>
    </div>
  );
}

function SocialLinks({ profile }: { profile: FullProfile }) {
  const links = [
    { url: profile.email ? `mailto:${profile.email}` : null, label: 'Email' },
    { url: profile.scholar_url, label: 'Scholar' },
    { url: profile.github_url, label: 'GitHub' },
    { url: profile.linkedin_url, label: 'LinkedIn' },
    {
      url: profile.xiaohongshu_id
        ? `https://www.xiaohongshu.com/user/profile/${profile.xiaohongshu_id}`
        : null,
      label: '小红书',
    },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="social-row">
      {links.map((link) => (
        <a key={link.label} href={link.url!}>
          {link.label}
        </a>
      ))}
    </div>
  );
}

function PublicationsList({
  publications,
  myName,
}: {
  publications: Publication[];
  myName: string;
}) {
  // Group by year
  const byYear = publications.reduce((acc, pub) => {
    const year = pub.year ?? 0;
    if (!acc[year]) acc[year] = [];
    acc[year].push(pub);
    return acc;
  }, {} as Record<number, Publication[]>);

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <>
      {years.map((year) => (
        <div key={year}>
          <div className="year-sep">{year || 'Forthcoming'}</div>
          <ul className="pub-list">
            {byYear[year].map((pub) => (
              <li key={pub.id} className="pub-item">
                <div className="pub-title">
                  {pub.paper_url ? (
                    <a href={pub.paper_url}>{pub.title}</a>
                  ) : (
                    pub.title
                  )}
                </div>
                <div className="pub-authors">
                  {pub.authors.map((author, i) => (
                    <span key={i}>
                      {author.includes(myName.split(' ')[0]) ? (
                        <span className="me">{author}</span>
                      ) : (
                        author
                      )}
                      {i < pub.authors.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
                {pub.venue && <div className="pub-venue">{pub.venue}</div>}
                {(pub.pdf_url || pub.code_url) && (
                  <div className="pub-links">
                    {pub.pdf_url && <a href={pub.pdf_url}>PDF</a>}
                    {pub.code_url && <a href={pub.code_url}>Code</a>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

/**
 * CSS for the academic site, parameterized by accent color.
 * For MVP this is inlined. Move to a stylesheet later.
 */
const ACADEMIC_CSS = (accent: string) => `
  .academic-site {
    --bg: #ffffff;
    --bg-soft: #f8f7f4;
    --text: #1a1a1a;
    --text-soft: #4a4a4a;
    --text-muted: #757575;
    --border: #e5e3dd;
    --accent: ${accent};
    --accent-soft: ${accent}15;
    background: var(--bg);
    color: var(--text);
    font-family: 'Source Sans 3', -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.65;
    min-height: 100vh;
  }
  .academic-site a { color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.15s; }
  .academic-site a:hover { border-bottom-color: var(--accent); }
  .top-nav { position: sticky; top: 0; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); z-index: 100; }
  .nav-inner { max-width: 1080px; margin: 0 auto; padding: 14px 32px; display: flex; justify-content: space-between; align-items: center; }
  .nav-name { font-weight: 600; font-size: 16px; }
  .nav-links { display: flex; gap: 24px; font-size: 14px; }
  .nav-links a { color: var(--text-soft); }
  .container { max-width: 1080px; margin: 0 auto; padding: 48px 32px 80px; }
  .header { display: grid; grid-template-columns: 240px 1fr; gap: 56px; margin-bottom: 64px; align-items: start; }
  .header-photo-col { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .photo { width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border); }
  .photo.placeholder { background: linear-gradient(135deg, #d4c4b0, #f0e5d0); }
  .name { font-family: 'Lora', serif; font-size: 28px; font-weight: 500; line-height: 1.1; margin-bottom: 6px; text-align: center; }
  .title-line { font-size: 14px; color: var(--text-soft); text-align: center; }
  .title-line.muted { color: var(--text-muted); font-size: 13px; }
  .email { font-size: 13px; color: var(--text-muted); margin-top: 12px; text-align: center; }
  .social-row { display: flex; gap: 14px; justify-content: center; margin-top: 14px; flex-wrap: wrap; }
  .social-row a { color: var(--text-muted); font-size: 12px; border-bottom: 1px solid var(--border); padding-bottom: 1px; }
  .about-col { padding-top: 8px; }
  .about-text { font-size: 15px; line-height: 1.75; margin-bottom: 16px; }
  .looking-for-box { background: var(--accent-soft); border-left: 3px solid var(--accent); padding: 20px 24px; margin-top: 24px; border-radius: 0 4px 4px 0; }
  .looking-for-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); font-weight: 600; margin-bottom: 8px; }
  .looking-for-text { font-family: 'Lora', serif; font-size: 17px; line-height: 1.55; margin-bottom: 12px; }
  .looking-for-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .looking-tag { background: white; color: var(--accent); padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; border: 1px solid var(--accent); }
  .section { margin-top: 72px; padding-top: 48px; border-top: 1px solid var(--border); }
  .section-title { font-family: 'Lora', serif; font-size: 26px; font-weight: 500; margin-bottom: 24px; }
  .research-block { margin-bottom: 32px; }
  .research-heading { font-family: 'Lora', serif; font-size: 18px; font-weight: 500; margin-bottom: 6px; color: var(--accent); }
  .research-heading-arrow { color: var(--text-muted); font-weight: 400; margin-right: 6px; }
  .research-tagline { font-style: italic; color: var(--text-soft); font-size: 14px; }
  .news-list { list-style: none; padding: 0; }
  .news-list li { padding: 8px 0; font-size: 14px; display: grid; grid-template-columns: 80px 1fr; gap: 16px; }
  .news-date { color: var(--text-muted); font-size: 12px; }
  .year-sep { font-family: 'Lora', serif; font-size: 20px; color: var(--text-muted); margin: 24px 0 8px; font-weight: 500; }
  .pub-list { list-style: none; padding: 0; }
  .pub-item { padding: 16px 0; border-bottom: 1px solid var(--border); font-size: 14px; line-height: 1.6; }
  .pub-title { font-weight: 600; margin-bottom: 4px; font-size: 15px; }
  .pub-authors { color: var(--text-soft); margin-bottom: 4px; }
  .pub-authors .me { font-weight: 600; color: var(--text); }
  .pub-venue { color: var(--text-muted); font-style: italic; font-size: 13px; }
  .pub-links { margin-top: 6px; display: flex; gap: 12px; font-size: 12px; }
  .site-footer { margin-top: 80px; padding-top: 32px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-muted); }
  @media (max-width: 768px) {
    .container { padding: 32px 20px 60px; }
    .header { grid-template-columns: 1fr; gap: 24px; text-align: center; }
  }
`;
