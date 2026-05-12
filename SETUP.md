# ScholarCard MVP — Setup Guide

Tonight's goal: get the project running locally + deployed to Vercel + database connected.
Estimated time: **30–60 minutes**.

---

## Pre-flight checklist

Make sure you have:
- [ ] Personal MacBook / Windows machine (NOT a work computer)
- [ ] Personal Gmail / iCloud account
- [ ] Node.js 20+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Your GitHub account: https://github.com/YuanhuanDeng

---

## Step 1: Create the GitHub repo (5 min)

1. Go to https://github.com/new
2. **Repository name**: `scholarcard`
3. **Description**: "An academic identity generator for researchers — create your professional English research website in 3 minutes."
4. **Visibility**: Public
5. ✅ Add a README file
6. ✅ Add .gitignore → choose **Node**
7. ✅ Choose a license → **MIT**
8. Click **Create repository**

**⚠️ Critical for IP timestamp**: Note the time you click Create. This is your project's birthdate.

---

## Step 2: Clone and initialize (10 min)

Open your terminal:

```bash
# Pick a working directory
cd ~/Projects  # or wherever you keep code

# Clone
git clone https://github.com/YuanhuanDeng/scholarcard.git
cd scholarcard

# Initialize Next.js into the current directory
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --eslint

# When asked "Would you like to use Turbopack?" → Yes
# If it complains about non-empty directory, say Yes to overwrite
# When it asks about LICENSE/README, KEEP YOURS (do not overwrite)
```

---

## Step 3: Install dependencies (2 min)

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk
```

---

## Step 4: Copy the project files from this conversation (5 min)

Copy these files from the artifact files I just generated into your project:

| File | Destination |
|------|------------|
| `README.md` | `./README.md` (overwrite) |
| `.gitignore` | `./.gitignore` (overwrite) |
| `.env.example` | `./.env.example` |
| `middleware.ts` | `./middleware.ts` |
| `lib/supabase/client.ts` | `./lib/supabase/client.ts` |
| `lib/supabase/server.ts` | `./lib/supabase/server.ts` |
| `lib/types.ts` | `./lib/types.ts` |
| `app/page.tsx` | `./app/page.tsx` (overwrite) |
| `app/sites/[username]/page.tsx` | `./app/sites/[username]/page.tsx` (create dirs) |
| `supabase/schema.sql` | `./supabase/schema.sql` |

---

## Step 5: Set up Supabase (10 min)

1. Go to https://supabase.com → Sign in with GitHub
2. Create a new project:
   - **Name**: `scholarcard`
   - **Database password**: generate a strong one, save to your password manager
   - **Region**: `West US (North California)` (closest to you in San Jose)
   - **Pricing plan**: Free
3. Wait ~2 min for the project to provision
4. Once ready, go to **SQL Editor** (left sidebar)
5. Click **New query**
6. Paste the entire contents of `supabase/schema.sql`
7. Click **Run** (or `Cmd+Enter`). You should see "Success. No rows returned."
8. Go to **Settings → API**
9. Copy these three values somewhere safe:
   - **Project URL** (e.g. `https://abc123.supabase.co`)
   - **anon public** key
   - **service_role secret** key (⚠️ never put this in client code)

---

## Step 6: Set up Anthropic API (3 min)

1. Go to https://console.anthropic.com → Sign in
2. Top up your account with $5 (you'll use ~$1/month at MVP scale)
3. Go to **API Keys** → **Create Key**
4. Name it `scholarcard-dev`
5. Copy the key (you'll only see it once — save it)

---

## Step 7: Create .env.local (2 min)

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your actual values:

```
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_DOMAIN=scholarcard.app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Confirm `.env.local` is in your `.gitignore`** (it should be — never commit this file).

---

## Step 8: Run it locally (1 min)

```bash
npm run dev
```

Open http://localhost:3000 — you should see the placeholder landing page.

---

## Step 9: First commit (2 min)

```bash
git add .
git commit -m "Initial setup: Next.js + Supabase scaffold"
git push origin main
```

🎉 **This commit's timestamp is your IP evidence.** Note the date.

---

## Step 10: Deploy to Vercel (10 min)

1. Go to https://vercel.com → Sign in with GitHub
2. **Add New → Project**
3. Find `scholarcard` in the list → **Import**
4. **Framework Preset**: Next.js (auto-detected)
5. **Environment Variables**: paste all the values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_APP_DOMAIN` → `scholarcard.app` (or whatever you bought)
   - `NEXT_PUBLIC_APP_URL` → leave blank for now (Vercel will give you a URL)
6. Click **Deploy**

After ~2 min, you'll get a URL like `scholarcard-yuanhuan.vercel.app`. Verify it works.

---

## Step 11: Buy your domain (5 min)

**Recommended: `scholarcard.app`** ($15/year)

1. Go to https://www.namecheap.com or https://porkbun.com
2. Search `scholarcard.app`
3. Add to cart, checkout
4. **Use your personal credit card, billing address, and email** — not anything employer-related

Once purchased:
1. In Vercel project → **Settings → Domains**
2. Add `scholarcard.app` → Vercel shows you DNS records to add
3. Add `*.scholarcard.app` (wildcard) → Vercel shows another DNS record
4. Go to your domain registrar's DNS settings
5. Add the records Vercel asked for
6. Wait 5–60 min for DNS propagation
7. Test: visit https://scholarcard.app → should show your landing page
8. Test: visit https://anyname.scholarcard.app → should show 404 (no user yet, but the routing works!)

---

## Step 12: Manual sanity test (5 min)

Let's verify the database connection works by inserting a test profile manually:

1. Go to Supabase → **Authentication → Users → Add user**
2. Create a test user with your email
3. Note the user ID
4. Go to **Table Editor → profiles → Insert row**
5. Fill in:
   - `user_id`: the test user ID
   - `username`: `test`
   - `name_en`: `Test User`
   - `bio_en`: `This is a test profile.`
   - `published`: `true`
6. Save
7. Visit https://test.scholarcard.app — you should see the academic site rendered!

---

## ✅ You're done!

At this point you have:
- Public GitHub repo with timestamped commits (IP evidence ✅)
- Live website at scholarcard.app
- Wildcard subdomain routing working
- Database with RLS policies
- Working academic site renderer
- LLM API integrated and ready

---

## Next steps (separate session)

- Build the onboarding flow (signup → Scholar import → bio generation → publish)
- Hook up Anthropic Claude API for bio generation
- Build Semantic Scholar API integration for publications
- Replace landing page placeholder with the design from `scholarcard-mock.html`
- Set up "Looking for collaborators" matching logic (longer-term)

---

## Troubleshooting

**"Cannot find module '@/lib/supabase/server'"**
→ Make sure the file actually exists at `lib/supabase/server.ts` and check `tsconfig.json` has `"paths": { "@/*": ["./*"] }`.

**Middleware doesn't trigger on Vercel preview URLs**
→ That's expected — `*.vercel.app` is in the bypass list. Test with a real `.scholarcard.app` subdomain.

**Supabase auth error: "Invalid API key"**
→ Double-check you copied `NEXT_PUBLIC_SUPABASE_ANON_KEY`, not the service-role key. Restart `npm run dev` after editing `.env.local`.

**Wildcard subdomain doesn't work**
→ DNS can take up to an hour. Use `dig *.scholarcard.app` to check propagation. Verify Vercel domain settings show "Configured ✓" for both apex and wildcard.

---

*Last updated: May 11, 2026*
