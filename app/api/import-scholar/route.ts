export async function POST(request: Request) {
  const { scholarUrl } = await request.json();

  if (typeof scholarUrl !== 'string') {
    return Response.json({ error: 'Missing scholarUrl' }, { status: 400 });
  }

  // Detect URL type
  if (scholarUrl.includes('scholar.google.com') || scholarUrl.includes('scholar.google.co')) {
    return handleGoogleScholar(scholarUrl);
  }
  if (scholarUrl.includes('semanticscholar.org')) {
    return handleSemanticScholar(scholarUrl);
  }

  return Response.json(
    { error: 'Please paste a Google Scholar or Semantic Scholar profile URL.' },
    { status: 400 },
  );
}

// ── Google Scholar via SerpAPI ──────────────────────────────────

async function handleGoogleScholar(url: string) {
  // Extract user ID: scholar.google.com/citations?user=XXXX
  const match = url.match(/[?&]user=([^&]+)/);
  if (!match) {
    return Response.json(
      { error: 'Could not parse Google Scholar URL. Expected format: https://scholar.google.com/citations?user=XXXX' },
      { status: 400 },
    );
  }

  const userId = match[1];
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) {
    return Response.json(
      { error: 'Google Scholar import is not configured. Please add SERPAPI_KEY to .env.local (free at serpapi.com).' },
      { status: 500 },
    );
  }

  try {
    // Fetch author profile
    const profileRes = await fetch(
      `https://serpapi.com/search.json?engine=google_scholar_author&author_id=${userId}&api_key=${serpApiKey}`,
    );
    if (!profileRes.ok) {
      return Response.json({ error: 'Could not find Google Scholar profile' }, { status: 404 });
    }
    const profileData = await profileRes.json();
    const authorName = profileData.author?.name ?? 'Unknown';
    const citationCount = profileData.cited_by?.table?.[0]?.citations?.all ?? 0;

    // Fetch articles (SerpAPI paginates, fetch first 100)
    const articles: Array<Record<string, unknown>> = [];
    let start = 0;
    while (start < 100) {
      const articlesRes = await fetch(
        `https://serpapi.com/search.json?engine=google_scholar_author&author_id=${userId}&start=${start}&num=100&api_key=${serpApiKey}`,
      );
      if (!articlesRes.ok) break;
      const data = await articlesRes.json();
      const batch = data.articles ?? [];
      if (batch.length === 0) break;
      articles.push(...batch);
      start += batch.length;
      if (batch.length < 100) break;
    }

    const papers = articles.map((a) => ({
      title: (a.title as string) || '',
      authors: typeof a.authors === 'string'
        ? (a.authors as string).split(',').map((s: string) => s.trim())
        : [],
      venue: (a.publication as string) || null,
      year: typeof a.year === 'string' ? parseInt(a.year as string, 10) || null
        : typeof a.year === 'number' ? (a.year as number) : null,
      paper_url: (a.link as string) || null,
      pdf_url: null,
      code_url: null,
      semantic_scholar_paper_id: null,
      citation_count: typeof a.cited_by === 'object' && a.cited_by !== null
        ? ((a.cited_by as { value?: number }).value ?? 0)
        : 0,
    }));

    return Response.json({
      authorName,
      authorId: userId,
      paperCount: papers.length,
      citationCount,
      papers,
    });
  } catch {
    return Response.json({ error: 'Failed to connect to Google Scholar API' }, { status: 502 });
  }
}

// ── Semantic Scholar ────────────────────────────────────────────

async function handleSemanticScholar(url: string) {
  const match = url.match(/semanticscholar\.org\/author\/[^/]+\/(\d+)/);
  if (!match) {
    return Response.json(
      { error: 'Could not parse Semantic Scholar URL. Expected format: https://www.semanticscholar.org/author/Name/1234567' },
      { status: 400 },
    );
  }

  const authorId = match[1];

  try {
    const authorRes = await fetch(
      `https://api.semanticscholar.org/graph/v1/author/${authorId}?fields=name,paperCount,citationCount`,
    );
    if (!authorRes.ok) {
      return Response.json({ error: 'Could not find author on Semantic Scholar' }, { status: 404 });
    }
    const author = await authorRes.json();

    const papersRes = await fetch(
      `https://api.semanticscholar.org/graph/v1/author/${authorId}/papers?fields=title,authors,venue,year,url,openAccessPdf,citationCount&limit=100`,
    );
    if (!papersRes.ok) {
      return Response.json({ error: 'Failed to fetch publications' }, { status: 502 });
    }
    const papersData = await papersRes.json();

    const papers = (papersData.data ?? []).map((p: Record<string, unknown>) => ({
      title: p.title as string,
      authors: ((p.authors as Array<{ name: string }>) ?? []).map((a) => a.name),
      venue: (p.venue as string) || null,
      year: (p.year as number) || null,
      paper_url: (p.url as string) || null,
      pdf_url: (p.openAccessPdf as { url: string } | null)?.url || null,
      code_url: null,
      semantic_scholar_paper_id: (p.paperId as string) || null,
      citation_count: (p.citationCount as number) || 0,
    }));

    return Response.json({
      authorName: author.name,
      authorId,
      paperCount: author.paperCount,
      citationCount: author.citationCount,
      papers,
    });
  } catch {
    return Response.json({ error: 'Failed to connect to Semantic Scholar API' }, { status: 502 });
  }
}
