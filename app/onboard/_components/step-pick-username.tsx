'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OnboardData } from './onboard-wizard';

type Props = {
  data: OnboardData;
  onUpdate: (partial: Partial<OnboardData>) => void;
  onNext: () => void;
  onBack: () => void;
};

function suggestUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

export function StepPickUsername({ data, onUpdate, onNext, onBack }: Props) {
  const [username, setUsername] = useState(
    data.username || suggestUsername(data.nameEn),
  );
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'scholarcard.app';

  useEffect(() => {
    if (username.length < 3) {
      setAvailable(null);
      setMessage('');
      return;
    }

    setChecking(true);
    setAvailable(null);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        const result = await res.json();
        setAvailable(result.available);
        setMessage(result.available ? 'Available!' : (result.message || 'Taken'));
      } catch {
        setMessage('Could not check availability');
      }
      setChecking(false);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [username]);

  function handleNext() {
    onUpdate({ username });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Choose Your URL</h2>
        <p className="text-muted-foreground mt-1">
          Pick a subdomain for your academic website.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Subdomain</Label>
        <div className="flex items-center gap-0">
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className="rounded-r-none"
            placeholder="yourname"
          />
          <span className="flex h-9 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
            .{domain}
          </span>
        </div>

        <div className="flex items-center gap-2 h-5">
          {checking && <p className="text-sm text-muted-foreground">Checking...</p>}
          {!checking && available === true && (
            <p className="text-sm text-green-600">{message}</p>
          )}
          {!checking && available === false && (
            <p className="text-sm text-destructive">{message}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens. 3-30 characters.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Your website will be at:</p>
        <p className="text-lg font-medium mt-1">
          https://{username || '...'}.{domain}
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleNext} disabled={!available}>Continue</Button>
      </div>
    </div>
  );
}
