import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { listingDescription, address, beds, baths, sqft, neighborhood, tone } = await req.json();

    const prompt = `You are a real estate agent writing a CMA (Comparative Market Analysis) narrative for a seller presentation.

Property details:
- Address: ${address || 'Not provided'}
- Beds/baths: ${beds || '?'}bd / ${baths || '?'}ba
- Square footage: ${sqft || 'Not provided'} sq ft
- Neighborhood: ${neighborhood || 'Not provided'}

Listing description already written:
"""
${listingDescription}
"""

Write a CMA narrative in three paragraphs:

Paragraph 1 — Property positioning. How this home fits in the current market based on its specs and neighborhood. What type of buyer it appeals to.

Paragraph 2 — Pricing context. Discuss what factors support the pricing (location, features, condition implied by the listing). Do not invent specific comp prices. Speak in general market terms.

Paragraph 3 — Recommended approach. How the agent should position this listing to attract serious buyers quickly. Any timing or presentation considerations.

Tone: professional, confident, and grounded. Written for a seller who wants to understand their market position.

ABSOLUTE RULES:
- No em dashes (—). Use a comma or period instead.
- Never use: nestled, delve, certainly, absolutely, stunning, great
- No adjective stacking
- No semicolons
- No bullet points — three clean paragraphs only
- Vary sentence length

Return ONLY the narrative text. No titles, no headers, no preamble.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('');

    return new Response(JSON.stringify({ narrative: text.trim() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}