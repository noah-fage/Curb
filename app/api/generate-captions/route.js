import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { listingDescription, tone } = await req.json();

    const toneGuide = {
      'Standard MLS': 'professional and grounded, clear and direct',
      'Luxury': 'elevated and understated, aspirational without being showy',
      'First-time buyer friendly': 'warm, excited, accessible',
    };
    const toneInstruction = toneGuide[tone] || toneGuide['Standard MLS'];

    const prompt = `You are a real estate agent writing social media captions for a property listing.

The listing:
"""
${listingDescription}
"""

Write exactly 5 captions — one for each platform below. Each should feel native to that platform.

Platforms:
1. Instagram — visual, emotional, 2-3 short paragraphs, 3-5 relevant hashtags at the end
2. Facebook — conversational, slightly longer, speaks to buyers and their lifestyle, no hashtags
3. LinkedIn — professional angle, investment value or neighborhood context, brief
4. X (Twitter) — punchy, under 240 characters, no hashtags
5. Nextdoor — hyper-local, neighborly tone, mentions the neighborhood specifically

Tone: ${toneInstruction}.

ABSOLUTE RULES:
- No em dashes (—). Use a comma or period instead.
- Never use: nestled, delve, certainly, absolutely, stunning, great
- No adjective stacking (two or more adjectives modifying the same noun)
- No semicolons
- No bullet points — prose only
- Vary sentence length. Short punchy sentences mixed with longer ones.

Return ONLY a valid JSON object, no markdown fences, no commentary:
{
  "captions": [
    { "platform": "Instagram", "content": "..." },
    { "platform": "Facebook", "content": "..." },
    { "platform": "LinkedIn", "content": "..." },
    { "platform": "X", "content": "..." },
    { "platform": "Nextdoor", "content": "..." }
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/```$/m, '').trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}