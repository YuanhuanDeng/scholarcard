import { createClient } from '@/lib/supabase/server';
import { OnboardWizard } from './_components/onboard-wizard';

export const metadata = {
  title: 'Create Your Website — ScholarCard',
  description: 'Build your professional academic website in 3 minutes.',
};

export default async function OnboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const initialUser = user ? { id: user.id, email: user.email ?? '' } : null;

  return <OnboardWizard initialUser={initialUser} />;
}
