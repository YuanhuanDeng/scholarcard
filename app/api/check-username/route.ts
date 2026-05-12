import { createAdminClient } from '@/lib/supabase/server';

const RESERVED = new Set([
  'www', 'app', 'api', 'admin', 'docs', 'blog', 'mail', 'localhost',
  'test', 'demo', 'help', 'support', 'onboard', 'settings', 'profile',
  'signup', 'login', 'auth', 'about', 'contact', 'pricing', 'terms',
  'privacy', 'status', 'static', 'assets', 'cdn',
]);

export async function POST(request: Request) {
  const { username } = await request.json();

  if (typeof username !== 'string') {
    return Response.json({ available: false, message: 'Invalid input' });
  }

  const clean = username.toLowerCase().trim();

  const validPattern = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
  if (!validPattern.test(clean)) {
    return Response.json({
      available: false,
      message: 'Must be 3-30 characters: lowercase letters, numbers, hyphens. Cannot start/end with a hyphen.',
    });
  }

  if (RESERVED.has(clean)) {
    return Response.json({ available: false, message: 'This name is reserved' });
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', clean)
    .maybeSingle();

  return Response.json({ available: !data });
}
