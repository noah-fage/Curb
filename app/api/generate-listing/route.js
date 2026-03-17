import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = 'edge';

export async function POST(req) {
  try {
    const body = await req.json();
    const { address, beds, baths, sqft, feat1, feat2, feat3, neighborhood, tone } = body;

    const prompt = buildListingPrompt({ address, beds, baths, sqft, feat1, feat2, feat3, neighborhood, tone });

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function buildListingPrompt({ address, beds, baths, sqft, feat1, feat2, feat3, neighborhood, tone }) {
  const features = [feat1, feat2, feat3].filter(Boolean).join(', ');
  const specs = [
    beds && `${beds} bed`,
    baths && `${baths} bath`,
    sqft && `${Number(sqft).toLocaleString()} sq ft`,
  ].filter(Boolean).join(', ');

  const toneGuide = {
    'Standard MLS': 'Professional, factual, neutral MLS tone. Clear, precise language. No marketing hyperbole.',
    'Luxury': 'Elevated, sophisticated, aspirational tone. Refined vocabulary. Evoke lifestyle and exclusivity. Speak to discerning buyers.',
    'First-time buyer friendly': 'Warm, welcoming, accessible tone. Highlight value, livability, excitement of homeownership. Avoid jargon.',
  };

  return `You are an expert real estate copywriter for top-producing agents. Write a property listing description that is MLS-ready.

PROPERTY DETAILS:
- Address: ${address || 'Not provided'}
- Specs: ${specs || 'Not specified'}
- Key Features: ${features || 'Not specified'}
- Neighborhood: ${neighborhood || 'Not specified'}
- Tone: ${tone || 'Standard MLS'}

TONE GUIDE: ${toneGuide[tone] || toneGuide['Standard MLS']}

REQUIREMENTS:
- Length: 150–200 words exactly
- Start with a strong, evocative hook sentence (not the address)
- Weave in the key features naturally — do not just list them
- Reference the neighborhood's character
- Close with a subtle call to action
- NO clichés: do not use "won't last long", "motivated seller", "gem", "stunning", "dream home"
- Output ONLY the listing description. No titles, no preamble, no word count note.`;
}
