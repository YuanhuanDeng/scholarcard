import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">ScholarCard</span>
          <Link href="/onboard">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            三分钟生成你的<br className="sm:hidden" />英文学术个人网站
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Build your professional English academic website in 3 minutes.
            Paste your publications, describe your research in Chinese,
            and let AI handle the rest.
          </p>
          <div className="mt-10">
            <Link href="/onboard">
              <Button size="lg" className="text-base px-8">
                Create Your Website — Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="text-2xl font-semibold text-center mb-12">How it works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <StepCard
              number="1"
              title="Import Publications"
              description="Paste your Semantic Scholar URL. We auto-import all your papers, venues, and citations."
            />
            <StepCard
              number="2"
              title="Describe Your Research"
              description="Write about your work in Chinese (or any language). AI generates a polished English bio."
            />
            <StepCard
              number="3"
              title="Publish Instantly"
              description="Pick a subdomain like yourname.scholarcard.app and your academic website goes live immediately."
            />
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold mb-4">Built for international researchers</h2>
          <p className="text-muted-foreground leading-relaxed">
            Existing academic website builders assume you can write your own English bio.
            ScholarCard removes that bottleneck — describe your research in your native language
            and get a publication-ready English academic homepage.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ScholarCard &middot; Made by researchers, for researchers.
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center space-y-3">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
        {number}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
