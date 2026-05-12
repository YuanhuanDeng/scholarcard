'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OnboardData, PubDraft } from './onboard-wizard';

type Props = {
  data: OnboardData;
  onUpdate: (partial: Partial<OnboardData>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepImportScholar({ data, onUpdate, onNext, onBack }: Props) {
  const [url, setUrl] = useState(data.scholarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imported, setImported] = useState(data.publications.length > 0);
  const [importInfo, setImportInfo] = useState('');

  async function handleImport() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/import-scholar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarUrl: url }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Import failed');
        setLoading(false);
        return;
      }

      const papers: PubDraft[] = result.papers;
      onUpdate({
        scholarUrl: url,
        semanticScholarId: result.authorId,
        publications: papers,
      });
      setImported(true);
      setImportInfo(
        `Found ${papers.length} publications by ${result.authorName} (${result.citationCount ?? 0} total citations)`,
      );
    } catch {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Import Publications</h2>
        <p className="text-muted-foreground mt-1">
          Paste your Google Scholar or Semantic Scholar profile URL to auto-import your publications.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scholar-url">Scholar Profile URL</Label>
        <Input
          id="scholar-url"
          placeholder="https://scholar.google.com/citations?user=XXXX"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Google Scholar: go to your profile page and copy the URL.
          Semantic Scholar is also supported.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!imported && (
        <Button onClick={handleImport} disabled={loading || (!url.includes('scholar.google.') && !url.includes('semanticscholar.org'))}>
          {loading ? 'Importing...' : 'Import Publications'}
        </Button>
      )}

      {imported && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium text-green-700">{importInfo}</p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {data.publications.slice(0, 20).map((pub, i) => (
              <div key={i} className="text-sm border-b pb-2 last:border-0">
                <div className="font-medium">{pub.title}</div>
                <div className="text-muted-foreground text-xs">
                  {pub.venue && `${pub.venue} · `}{pub.year ?? ''}
                  {pub.citation_count > 0 && ` · ${pub.citation_count} citations`}
                </div>
              </div>
            ))}
            {data.publications.length > 20 && (
              <p className="text-xs text-muted-foreground">
                ...and {data.publications.length - 20} more
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <div className="flex gap-2">
          {!imported && (
            <Button variant="outline" onClick={onNext}>
              Skip — I&apos;ll add papers later
            </Button>
          )}
          {imported && <Button onClick={onNext}>Continue</Button>}
        </div>
      </div>
    </div>
  );
}
