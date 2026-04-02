import Anthropic from 'https://esm.sh/@anthropic-ai/sdk';

export interface ParsedTransaction {
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | null;
  currency: 'IDR' | 'USD';
  description: string;
  confidence: number;
}

export async function parseTransactionFromText(text: string): Promise<{
  parsed: ParsedTransaction;
  tokensUsed: number;
  processingTimeMs: number;
}> {
  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
  const startTime = Date.now();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    system: `You are a financial transaction parser for an Indonesian personal finance app. 
Extract transaction details from WhatsApp messages. The user writes in Indonesian or English.
Return ONLY valid JSON, no markdown, no explanation.`,
    messages: [
      {
        role: 'user',
        content: `Parse this message and return JSON with this exact shape:
{"amount": <number>, "type": "INCOME"|"EXPENSE"|"TRANSFER"|null, "currency": "IDR"|"USD", "description": "<short English description>", "confidence": <0.0-1.0>}

Rules:
- amount: numeric value only (no currency symbol). For IDR, 500ribu = 500000, 1jt = 1000000, 1.5jt = 1500000
- type: INCOME for receiving money, EXPENSE for spending, TRANSFER for moving between accounts, null if not financial
- currency: IDR unless USD is explicit
- confidence: how certain you are this is a financial transaction (0.0 = not financial, 1.0 = very certain)

Message: "${text.replace(/"/g, '\\"')}"`,
      },
    ],
  });

  const processingTimeMs = Date.now() - startTime;
  const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}';
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  let parsed: ParsedTransaction;
  try {
    parsed = JSON.parse(rawText) as ParsedTransaction;
    // Normalize missing fields
    if (!parsed.currency) parsed.currency = 'IDR';
    if (!parsed.confidence) parsed.confidence = 0;
    if (!parsed.amount) parsed.amount = 0;
  } catch {
    parsed = { amount: 0, type: null, currency: 'IDR', description: '', confidence: 0 };
  }

  return { parsed, tokensUsed, processingTimeMs };
}
