# ScholarCard

> An academic identity generator for researchers — create your professional English research website in 3 minutes.

## What is this?

ScholarCard is a web application that helps researchers (particularly Chinese / international scholars) generate clean, professional, English-language academic personal websites without writing code or wrestling with template repositories.

**The core flow:**
1. User pastes their Google Scholar or Semantic Scholar URL
2. User describes their research in their preferred language (Chinese, English, etc.)
3. An LLM generates a polished English bio and extracts research keywords
4. User picks a subdomain (e.g. `yourname.scholarcard.app`)
5. A complete academic personal website is published and immediately accessible

The longer-term vision is to layer a research collaboration discovery feature on top of the personal-website utility — connecting researchers with overlapping interests who are actively looking for collaborators.

## Project status

🚧 **Early development** — pre-launch MVP. Not yet open to the public.

## Why this exists

Existing academic website builders (Owlstown, Faculty.bio, al-folio) are designed for native English speakers and assume the user is comfortable writing their own English research bio. For non-native-English researchers — particularly Chinese students, postdocs, and early-career faculty studying abroad — the bottleneck is rarely the website mechanics; it's writing a credible English research bio and structuring publications correctly.

ScholarCard removes that bottleneck by letting users input in their native language and using an LLM to produce polished English output.

## Tech stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **LLM**: Anthropic Claude API (bio generation, keyword extraction)
- **Publications data**: Semantic Scholar Graph API
- **Hosting**: Vercel (wildcard subdomain routing)

## Scope and boundaries

This project is an **independent personal side project**, started in May 2026 and developed during personal time. It is unrelated to any employer's business, products, or infrastructure. Specifically:

- This project is **not related to financial services, payments, fintech, capital platforms, or trading systems** in any form
- This project does **not** use any proprietary code, datasets, or infrastructure from any employer
- All development is done on personal hardware, with personal accounts, on personal networks
- The intellectual property is owned solely by the author

## License

MIT — see [LICENSE](./LICENSE)

## Author

[Yuanhuan Deng](https://github.com/YuanhuanDeng) — independent developer

---

*Project started: May 2026*
