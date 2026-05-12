export async function POST(request: Request) {
  const { scholarUrl } = await request.json();

  if (typeof scholarUrl !== 'string') {
    return Response.json({ error: 'Missing scholarUrl' }, { status: 400 });
  }

  // Detect URL type
  if (scholarUrl.includes('scholar.google.')) {
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

// ── Google Scholar (direct fetch + parse) ───────────────────────

async function handleGoogleScholar(url: string) {
  const match = url.match(/[?&]user=([^&]+)/);
  if (!match) {
    return Response.json(
      { error: 'Could not parse Google Scholar URL. Expected: https://scholar.google.com/citations?user=XXXX' },
      { status: 400 },
    );
  }

  const userId = match[1];

  try {
    const allPapers: Array<{
      title: string;
      authors: string[];
      venue: string | null;
      year: number | null;
      paper_url: string | null;
      pdf_url: string | null;
      code_url: string | null;
      semantic_scholar_paper_id: string | null;
      citation_count: number;
    }> = [];

    let authorName = '';
    let totalCitations = 0;
    let start = 0;

    while (start < 500) {
      const pageUrl = `https://scholar.google.com/citations?user=${userId}&cstart=${start}&pagesize=100&sortby=pubdate&hl=en`;
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!res.ok) {
        if (allPapers.length > 0) break;
        return Response.json({ error: 'Could not fetch Google Scholar profile. Please try again.' }, { status: 502 });
      }

      const html = await res.text();

      // Extract author name (first page only)
      if (start === 0) {
        const nameMatch = html.match(/id="gsc_prf_in"[^>]*>([^<]+)/);
        authorName = nameMatch ? decode(nameMatch[1]) : 'Unknown';

        const citMatch = html.match(/gsc_rsb_std">(\d+)</);
        totalCitations = citMatch ? parseInt(citMatch[1], 10) : 0;
      }

      // Parse papers: extract all title links, then pair with gray divs and year/cite cells
      const titles: { title: string; url: string | null }[] = [];
      const titleRegex = /class="gsc_a_at"[^>]*(?:href="([^"]*)")?[^>]*>([^<]+)/g;
      let m;
      while ((m = titleRegex.exec(html)) !== null) {
        const href = m[1] ? `https://scholar.google.com${decode(m[1])}` : null;
        titles.push({ title: decode(m[2].trim()), url: href });
      }

      // Extract all gs_gray divs (authors and venue alternate)
      const grayTexts: string[] = [];
      const grayRegex = /class="gs_gray">([^<]+)/g;
      while ((m = grayRegex.exec(html)) !== null) {
        grayTexts.push(decode(m[1].trim()));
      }

      // Extract year spans
      const years: (number | null)[] = [];
      const yearRegex = /class="gsc_a_h gsc_a_hc gs_ibl">(\d{4})</g;
      // Also match empty year cells
      const yearCellRegex = /class="gsc_a_hc gs_ibl">([\d]*)</g;
      while ((m = yearRegex.exec(html)) !== null) {
        years.push(parseInt(m[1], 10));
      }
      // If year regex found nothing, try the cell regex
      if (years.length === 0) {
        while ((m = yearCellRegex.exec(html)) !== null) {
          years.push(m[1] ? parseInt(m[1], 10) : null);
        }
      }

      // Extract citation counts
      const cites: number[] = [];
      const citeRegex = /class="gsc_a_ac gs_ibl"[^>]*>(\d*)</g;
      while ((m = citeRegex.exec(html)) !== null) {
        cites.push(m[1] ? parseInt(m[1], 10) : 0);
      }

      if (titles.length === 0) break;

      for (let i = 0; i < titles.length; i++) {
        // gs_gray divs come in pairs: authors, then venue
        const authorsText = grayTexts[i * 2] ?? '';
        const venueText = grayTexts[i * 2 + 1] ?? '';

        allPapers.push({
          title: titles[i].title,
          authors: authorsText ? authorsText.split(',').map(s => s.trim()).filter(Boolean) : [],
          venue: venueText || null,
          year: years[i] ?? null,
          paper_url: titles[i].url,
          pdf_url: null,
          code_url: null,
          semantic_scholar_paper_id: null,
          citation_count: cites[i] ?? 0,
        });
      }

      start += 100;

      // Stop if fewer results than page size or no next button
      if (titles.length < 100 || !html.includes('gsc_pgn_pnx')) break;
    }

    if (allPapers.length === 0) {
      return Response.json({ error: 'No publications found on this Google Scholar profile.' }, { status: 404 });
    }

    return Response.json({
      authorName,
      authorId: userId,
      paperCount: allPapers.length,
      citationCount: totalCitations,
      papers: allPapers,
    });
  } catch {
    return Response.json({ error: 'Failed to fetch Google Scholar profile. Please try again.' }, { status: 502 });
  }
}

function decode(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

// ── Semantic Scholar ────────────────────────────────────────────

async function handleSemanticScholar(url: string) {
  const match = url.match(/semanticscholar\.org\/author\/[^/]+\/(\d+)/);
  if (!match) {
    return Response.json(
      { error: 'Could not parse Semantic Scholar URL. Expected: https://www.semanticscholar.org/author/Name/1234567' },
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
