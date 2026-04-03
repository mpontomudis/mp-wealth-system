import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Env helper — fails fast at cold-start, never mid-request
// Use SUPABASE_SERVICE_ROLE_KEY so inserts bypass Row Level Security
// ---------------------------------------------------------------------------
function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

const supabase = createClient(
  env('SUPABASE_URL'),
  env('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false } }
);

// ---------------------------------------------------------------------------
// Fonnte payload — supports v1 and v2 field names
// Full payload reference: https://docs.fonnte.com/webhook
// ---------------------------------------------------------------------------
interface FonntePayload {
  // Sender
  sender?: string;        // v1
  from?: string;          // v2

  // Message content
  message?: string;       // v1 text
  text?: string;          // v2 text

  // Message metadata
  id?: string;            // Fonnte message ID
  messageId?: string;
  type?: string;          // 'text' | 'image' | 'audio' | 'video' | 'document'
  timestamp?: string | number;
  date?: string | number;

  // Media
  url?: string;           // media URL if type != text
  mimeType?: string;
  mimetype?: string;

  // Device / account
  device?: string;

  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const body = req.body as FonntePayload;
    console.log('Incoming WA:', JSON.stringify(body, null, 2));

    // Normalise fields across Fonnte versions
    const sender       = (body?.sender      ?? body?.from        ?? '').trim();
    const message      = (body?.message     ?? body?.text        ?? '').trim();
    const whatsappId   = (body?.id          ?? body?.messageId   ?? '').trim();
    const messageType  = (body?.type                             ?? 'text').trim();
    const mediaUrl     = (body?.url                              ?? null);
    const mediaType    = (body?.mimeType    ?? body?.mimetype    ?? null);

    // Parse timestamp → ISO string; fall back to now()
    const rawTs      = body?.timestamp ?? body?.date;
    const receivedAt = rawTs
      ? new Date(typeof rawTs === 'number' ? rawTs * 1000 : rawTs).toISOString()
      : new Date().toISOString();

    console.log('Parsed:', { sender, message, whatsappId, messageType, mediaUrl });

    if (!sender || !message) {
      console.warn('WA webhook: empty sender or message — ignored');
      return res.status(400).json({ success: false, error: 'Missing sender or message' });
    }

    // Map to exact whatsapp_messages column names
    const { error } = await supabase.from('whatsapp_messages').insert({
      from_number:        sender,
      text_content:       message,
      whatsapp_id:        whatsappId   || null,
      message_type:       messageType,
      media_url:          mediaUrl,
      media_type:         mediaType,
      processing_status:  'pending',   // AI parsing will update this later
      received_at:        receivedAt,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`WA message stored — from: ${sender} | type: ${messageType}`);
    return res.status(200).json({ success: true });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('WA webhook unhandled error:', err);
    return res.status(500).json({ success: false, error: message });
  }
}
