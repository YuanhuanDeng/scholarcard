'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { OnboardData } from './onboard-wizard';

type Props = {
  data: OnboardData;
  onUpdate: (partial: Partial<OnboardData>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepGenerateBio({ data, onUpdate, onNext, onBack }: Props) {
  const [bioInput, setBioInput] = useState(data.bioInput);
  const [bioEn, setBioEn] = useState(data.bioEn);
  const [interests, setInterests] = useState<string[]>(data.researchInterests);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(!!data.bioEn);

  async function handleGenerate() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bioInput,
          name: data.nameEn,
          role: data.role,
          institution: data.institution,
          paperTitles: data.publications.map((p) => p.title),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Generation failed');
        setLoading(false);
        return;
      }

      setBioEn(result.bioEn);
      setInterests(result.researchInterests);
      setGenerated(true);
    } catch {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  }

  function handleNext() {
    onUpdate({ bioInput, bioEn, researchInterests: interests });
    onNext();
  }

  function addTag() {
    const tag = newTag.trim();
    if (tag && !interests.includes(tag)) {
      setInterests([...interests, tag]);
      setNewTag('');
    }
  }

  function removeTag(tag: string) {
    setInterests(interests.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Generate Your Bio</h2>
        <p className="text-muted-foreground mt-1">
          Describe your research in any language. AI will generate a polished English bio for your website.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio-input">Your Research Description</Label>
        <Textarea
          id="bio-input"
          rows={6}
          placeholder={"用中文描述你的研究方向和工作，例如：\n\n我是斯坦福大学计算机科学系的博士生，研究方向是可视化和人机交互。我的工作主要关注如何用可视化工具帮助人们理解复杂的GPU性能数据..."}
          value={bioInput}
          onChange={(e) => setBioInput(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Write in Chinese, English, or any language you prefer. 2-5 sentences is ideal.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!generated && (
        <Button onClick={handleGenerate} disabled={loading || bioInput.trim().length < 10}>
          {loading ? 'AI is writing your bio...' : 'Generate English Bio'}
        </Button>
      )}

      {generated && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio-en">Generated English Bio (editable)</Label>
            <Textarea
              id="bio-en"
              rows={8}
              value={bioEn}
              onChange={(e) => setBioEn(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Research Interests</Label>
            <div className="flex flex-wrap gap-2">
              {interests.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a keyword..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
          </div>

          <Button variant="outline" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Regenerating...' : 'Regenerate Bio'}
          </Button>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleNext} disabled={!bioEn}>Continue</Button>
      </div>
    </div>
  );
}
