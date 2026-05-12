import { getAnthropicClient } from '@/lib/anthropic';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bioInput, name, role, institution, paperTitles } = await request.json();

  if (!bioInput || typeof bioInput !== 'string') {
    return Response.json({ error: 'Missing bioInput' }, { status: 400 });
  }

  const anthropic = getAnthropicClient();

  const papersSection =
    paperTitles?.length > 0
      ? `\nTheir recent paper titles:\n${(paperTitles as string[]).slice(0, 15).map((t: string) => `- ${t}`).join('\n')}`
      : '';

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are helping a researcher create their academic personal website bio.

Researcher information:
- Name: ${name || 'Not provided'}
- Role: ${role || 'Researcher'}
- Institution: ${institution || 'Not provided'}
- Their research description (may be in Chinese or any language):
${bioInput}
${papersSection}

Please generate:
1. A professional English academic bio (2-3 paragraphs, written in first person, suitable for a personal academic website). If the input is in Chinese or another non-English language, translate and polish it into natural academic English. The tone should be professional but approachable.
2. A list of 3-6 concise research interest keywords or short phrases.

Respond ONLY with this exact JSON format, no other text:
{
  "bio_en": "First paragraph...\\n\\nSecond paragraph...\\n\\nThird paragraph...",
  "research_interests": ["keyword1", "keyword2", "keyword3"]
}`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (Claude may wrap in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json({
      bioEn: parsed.bio_en,
      researchInterests: parsed.research_interests,
    });
  } catch {
    return Response.json({ error: 'AI generation failed. Please try again.' }, { status: 500 });
  }
}
