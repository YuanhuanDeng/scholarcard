'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OnboardData } from './onboard-wizard';

const ROLES = [
  'PhD Student',
  'Postdoctoral Researcher',
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Research Scientist',
  'Software Engineer',
  'Other',
];

type Props = {
  data: OnboardData;
  onUpdate: (partial: Partial<OnboardData>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepBasicInfo({ data, onUpdate, onNext, onBack }: Props) {
  const [nameEn, setNameEn] = useState(data.nameEn);
  const [nameZh, setNameZh] = useState(data.nameZh);
  const [role, setRole] = useState(data.role);
  const [institution, setInstitution] = useState(data.institution);
  const [email, setEmail] = useState(data.email || data.authEmail || '');

  function handleNext() {
    onUpdate({ nameEn, nameZh, role, institution, email });
    onNext();
  }

  const canContinue = nameEn.trim().length >= 2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Basic Information</h2>
        <p className="text-muted-foreground mt-1">
          Tell us about yourself. This will appear on your academic website.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name-en">English Name *</Label>
            <Input
              id="name-en"
              placeholder="e.g. Yuanhuan Deng"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name-zh">Chinese Name (optional)</Label>
            <Input
              id="name-zh"
              placeholder="e.g. 邓元焕"
              value={nameZh}
              onChange={(e) => setNameZh(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select your role...</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            placeholder="e.g. Stanford University"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Contact Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Displayed on your website (obfuscated). Leave blank to hide.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleNext} disabled={!canContinue}>Continue</Button>
      </div>
    </div>
  );
}
