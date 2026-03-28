import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "formal and polished, but not stiff — grounded and confident",
  conversational: "warm and approachable, like a trusted friend in real estate",
  luxury: "elevated and understated — less is more, every word earns its place",
  energetic: "upbeat and direct, short punchy sentences, genuine enthusiasm",
};

export async function POST(req: NextRequest) {
  const { listingDescription, tone } = await req.json();

  if (!listingDescription || !tone) {
    return NextResponse.json(
      { error: "Missing listingDescription or tone" },
      { status: 400 }
    );
  }

  const toneGuide = TONE_INSTRUCTIONS[tone] ?? "natural and professional";

  const prompt = `You are a real estate agent writing follow-up emails to a buyer who attended a showing.

The listing they viewed:
"""
${listingDescription}
"""

Write exactly 3 follow-up emails: one sent the day of or day after the showing (Day 1), one sent 3 days later (Day 3), and one sent 7 days later (Day 7). Each email should feel distinct — don't repeat yourself across them. Day 1 is warm and immediate. Day 3 checks in more gently and surfaces a detail or angle they might not have considered. Day 7 creates soft urgency without pressure tactics.

Tone: ${toneGuide}.

ABSOLUTE RULES — violating any of these is a failure:
- No em dashes (—) anywhere. Use a comma, a period, or rewrite the sentence.
- Never use the words: nestled, delve, certainly, absolutely
- No adjective stacking (two or more adjectives in a row modifying the same noun)
- No semicolons
- No bullet points or numbered lists — prose only
- Vary sentence length throughout. Mix short punchy sentences with longer flowing ones. Never write three sentences of the same length in a row.
- Each email must have a subject line.

Return ONLY a valid JSON object with this exact shape, no markdown fences, no commentary:
{
  "emails": [
    {
      "day": 1,
      "label": "Day 1 — Same Day / Next Day",
      "subject": "...",
      "body": "..."
    },
    {
      "day": 3,
      "label": "Day 3 — Following Up",
      "subject": "...",
      "body": "..."
    },
    {
      "day": 7,
      "label": "Day 7 — Checking In",
      "subject": "...",
      "body": "..."
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    // Strip accidental markdown fences if model adds them
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/```$/m, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Email generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate emails" },
      { status: 500 }
    );
  }
}