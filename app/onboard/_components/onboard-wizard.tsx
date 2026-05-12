'use client';

import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { StepAuth } from './step-auth';
import { StepBasicInfo } from './step-basic-info';
import { StepImportScholar } from './step-import-scholar';
import { StepGenerateBio } from './step-generate-bio';
import { StepPickUsername } from './step-pick-username';
import { StepPreviewPublish } from './step-preview-publish';

/** Shape of a publication draft before it gets a profile_id */
export type PubDraft = {
  title: string;
  authors: string[];
  venue: string | null;
  year: number | null;
  paper_url: string | null;
  pdf_url: string | null;
  code_url: string | null;
  semantic_scholar_paper_id: string | null;
  citation_count: number;
};

export type OnboardData = {
  // Auth
  userId: string | null;
  authEmail: string | null;

  // Basic info
  nameEn: string;
  nameZh: string;
  role: string;
  institution: string;
  email: string;

  // Scholar import
  scholarUrl: string;
  semanticScholarId: string | null;
  publications: PubDraft[];

  // Bio generation
  bioInput: string;
  bioEn: string;
  researchInterests: string[];

  // Username
  username: string;

  // Theme
  accentColor: string;
};

const STEP_LABELS = [
  'Account',
  'Basic Info',
  'Publications',
  'Bio',
  'URL',
  'Publish',
];

type Props = {
  initialUser: { id: string; email: string } | null;
};

export function OnboardWizard({ initialUser }: Props) {
  const [step, setStep] = useState(initialUser ? 1 : 0);
  const [data, setData] = useState<OnboardData>({
    userId: initialUser?.id ?? null,
    authEmail: initialUser?.email ?? null,
    nameEn: '',
    nameZh: '',
    role: '',
    institution: '',
    email: initialUser?.email ?? '',
    scholarUrl: '',
    semanticScholarId: null,
    publications: [],
    bioInput: '',
    bioEn: '',
    researchInterests: [],
    username: '',
    accentColor: '#2A4D7C',
  });

  const updateData = (partial: Partial<OnboardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const totalSteps = STEP_LABELS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {totalSteps}: {STEP_LABELS[step]}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps */}
      {step === 0 && (
        <StepAuth data={data} onUpdate={updateData} onNext={() => setStep(1)} />
      )}
      {step === 1 && (
        <StepBasicInfo
          data={data}
          onUpdate={updateData}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <StepImportScholar
          data={data}
          onUpdate={updateData}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepGenerateBio
          data={data}
          onUpdate={updateData}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <StepPickUsername
          data={data}
          onUpdate={updateData}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <StepPreviewPublish
          data={data}
          onUpdate={updateData}
          onBack={() => setStep(4)}
        />
      )}
    </div>
  );
}
