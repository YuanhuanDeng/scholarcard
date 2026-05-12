'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { OnboardData } from './onboard-wizard';

type Props = {
  data: OnboardData;
  onUpdate: (partial: Partial<OnboardData>) => void;
  onNext: () => void;
};

export function StepAuth({ data, onUpdate, onNext }: Props) {
  const [email, setEmail] = useState(data.authEmail ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('signup');

  const supabase = createClient();

  async function handleSignUp() {
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboard`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      onUpdate({ userId: authData.user.id, authEmail: authData.user.email ?? email });
      onNext();
    }

    setLoading(false);
  }

  async function handleSignIn() {
    setLoading(true);
    setError('');

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      onUpdate({ userId: authData.user.id, authEmail: authData.user.email ?? email });
      onNext();
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Welcome to ScholarCard</h2>
        <p className="text-muted-foreground mt-1">
          Create an account to get started, or sign in if you already have one.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
          <TabsTrigger value="signin">Sign In</TabsTrigger>
        </TabsList>

        <TabsContent value="signup" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSignUp} disabled={loading || !email || !password} className="w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </TabsContent>

        <TabsContent value="signin" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSignIn} disabled={loading || !email || !password} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
