import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { listingDescription, address, neighborhood, tone } = await req.json();

    const toneGuide = {
      'Standard MLS': 'professional and warm, knowledgeable but approachable',
      'Luxury': 'polished and understated, speak to discerning buyers',
      'First-time buyer friendly': 'encouraging and clear, anticipate questions and ease nerves',
    };
    const toneInstruction = toneGuide[tone] || toneGuide['Standard MLS'];

    const prompt = `You are a real estate agent preparing for an open house. Write a set of talking-point scripts based on the listing below.

Listing:
"""
${listingDescription}
"""

Address: ${address || 'the property'}
Neighborhood: ${neighborhood || 'the area'}

Write scripts for exactly 4 moments during an open house:

1. The greeting — what to say when a visitor walks in (2-3 sentences, warm and inviting)
2. The walkthrough pitch — a 4-5 sentence narration to deliver while walking buyers through the home, hitting the key features naturally
3. The neighborhood close — 2-3 sentences about the neighborhood and lifestyle when wrapping up the tour
4. The follow-up prompt — what to say at the door when they're leaving to encourage them to reach out (2 sentences, not pushy)

Tone: ${toneInstruction}.

ABSOLUTE RULES:
- No em dashes (—)
- Never use: nestled, delve, certainly, absolutely, stunning, great
- No adjective stacking
- No semicolons
- Vary sentence length
- Write in first person as the agent speaking out loud

Return ONLY a valid JSON object, no markdown fences:
{
  "scripts": [
    { "moment": "The greeting", "script": "..." },
    { "moment": "The walkthrough pitch", "script": "..." },
    { "moment": "The neighborhood close", "script": "..." },
    { "moment": "The follow-up prompt", "script": "..." }
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
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