'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { OnboardData } from './onboard-wizard';

type Props = {
  data: OnboardData;
  onUpdate: (partial: Partial<OnboardData>) => void;
  onBack: () => void;
};

export function StepPreviewPublish({ data, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [published, setPublished] = useState(false);

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'scholarcard.app';
  const siteUrl = `https://${data.username}.${domain}`;

  async function handlePublish() {
    setLoading(true);
    setError('');

    const supabase = createClient();

    // Insert profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: data.userId,
        username: data.username,
        name_en: data.nameEn,
        name_zh: data.nameZh || null,
        role: data.role || null,
        institution: data.institution || null,
        bio_input: data.bioInput || null,
        bio_en: data.bioEn || null,
        research_interests: data.researchInterests,
        scholar_url: data.scholarUrl || null,
        semantic_scholar_id: data.semanticScholarId || null,
        email: data.email || null,
        accent_color: data.accentColor,
        published: true,
      })
      .select()
      .single();

    if (profileError) {
      if (profileError.message.includes('duplicate key') && profileError.message.includes('username')) {
        setError('This username was just taken. Please go back and pick a different one.');
      } else {
        setError(profileError.message);
      }
      setLoading(false);
      return;
    }

    // Insert publications
    if (data.publications.length > 0 && profile) {
      const pubRows = data.publications.map((pub, index) => ({
        profile_id: profile.id,
        title: pub.title,
        authors: pub.authors,
        venue: pub.venue,
        year: pub.year,
        paper_url: pub.paper_url,
        pdf_url: pub.pdf_url,
        code_url: pub.code_url,
        semantic_scholar_paper_id: pub.semantic_scholar_paper_id,
        citation_count: pub.citation_count,
        display_order: index,
        is_featured: false,
      }));

      const { error: pubError } = await supabase.from('publications').insert(pubRows);
      if (pubError) {
        console.error('Publication insert error:', pubError);
        // Don't block publish — profile is already created
      }
    }

    setPublished(true);
    setLoading(false);
  }

  if (published) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-semibold tracking-tight">Your website is live!</h2>
        <p className="text-muted-foreground">
          Your academic website has been published.
        </p>
        <div className="rounded-lg border bg-card p-6 inline-block">
          <p className="text-sm text-muted-foreground mb-1">Your website:</p>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl font-medium text-primary hover:underline"
          >
            {data.username}.{domain}
          </a>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            For local development, preview at:
          </p>
          <a
            href={`/sites/${data.username}`}
            className="text-primary hover:underline"
          >
            /sites/{data.username}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Review & Publish</h2>
        <p className="text-muted-foreground mt-1">
          Review your information, then publish your academic website.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-medium">{data.nameEn}{data.nameZh && ` (${data.nameZh})`}</p>
        </div>

        {data.role && (
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p>{data.role}</p>
          </div>
        )}

        {data.institution && (
          <div>
            <p className="text-sm text-muted-foreground">Institution</p>
            <p>{data.institution}</p>
          </div>
        )}

        <Separator />

        <div>
          <p className="text-sm text-muted-foreground">Website URL</p>
          <p className="font-medium text-primary">{data.username}.{domain}</p>
        </div>

        <Separator />

        {data.bioEn && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Bio (English)</p>
            <p className="text-sm whitespace-pre-line">{data.bioEn}</p>
          </div>
        )}

        {data.researchInterests.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Research Interests</p>
            <div className="flex flex-wrap gap-1">
              {data.researchInterests.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {data.publications.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Publications</p>
              <p>{data.publications.length} papers imported from Semantic Scholar</p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handlePublish} disabled={loading} size="lg">
          {loading ? 'Publishing...' : 'Publish My Website'}
        </Button>
      </div>
    </div>
  );
}
