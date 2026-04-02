import { handleCors, corsHeaders } from '../_shared/cors.ts';
import { getServiceClient, jsonResponse } from '../_shared/supabase-client.ts';
import { parseTransactionFromText } from '../_shared/ai-parser.ts';

interface FonntePayload {
  id: string;
  from: string;
  message: string;
  type: string;
  pushname?: string;
  file?: string;
}

function mapMessageType(type: string): string {
  switch (type) {
    case 'text': return 'text';
    case 'image':
    case 'photo': return 'image';
    case 'audio':
    case 'ptt': return 'audio';
    case 'document': return 'document';
    default: return 'other';
  }
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // GET: Fonnte webhook verification
  if (req.method === 'GET') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  const supabase = getServiceClient();

  try {
    const body: FonntePayload = await req.json();
    const ownerPhone = Deno.env.get('OWNER_PHONE_NUMBER') ?? '';

    // Only process messages from the owner
    if (body.from !== ownerPhone) {
      return jsonResponse({ received: true });
    }

    const messageType = mapMessageType(body.type);
    const textContent = body.message ?? '';
    const mediaUrl = body.file ?? null;

    // Insert into whatsapp_messages
    const { data: msgRow, error: insertError } = await supabase
      .from('whatsapp_messages')
      .insert({
        whatsapp_id: body.id,
        from_number: body.from,
        message_type: messageType,
        text_content: textContent || null,
        media_url: mediaUrl,
        media_type: messageType !== 'text' ? body.type : null,
        processing_status: 'processing',
        received_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) throw new Error(`Insert whatsapp_message failed: ${insertError.message}`);

    const messageId = msgRow.id;

    // Only parse text messages with content
    if (messageType === 'text' && textContent.trim().length > 0) {
      try {
        const { parsed, tokensUsed, processingTimeMs } = await parseTransactionFromText(textContent);

        const isValidTransaction = parsed.type !== null && parsed.confidence >= 0.7;

        // Store AI result
        const { data: aiLog, error: aiLogError } = await supabase
          .from('ai_logs')
          .insert({
            whatsapp_message_id: messageId,
            input_type: 'text',
            input_content: textContent,
            ai_provider: 'anthropic',
            ai_model: 'claude-haiku-4-5',
            parsed_data: isValidTransaction ? parsed : {},
            confidence_score: parsed.confidence,
            is_validated: false,
            validation_result: isValidTransaction ? 'pending' : null,
            processing_time_ms: processingTimeMs,
            tokens_used: tokensUsed,
          })
          .select('id')
          .single();

        if (aiLogError) throw new Error(`Insert ai_log failed: ${aiLogError.message}`);

        await supabase
          .from('whatsapp_messages')
          .update({ processing_status: 'done', processed_at: new Date().toISOString() })
          .eq('id', messageId);

      } catch (aiError) {
        await supabase
          .from('whatsapp_messages')
          .update({ processing_status: 'failed', error_message: String(aiError) })
          .eq('id', messageId);

        await supabase.from('system_logs').insert({
          log_level: 'ERROR',
          log_type: 'ai_parse_error',
          message: 'AI parsing failed for whatsapp message',
          metadata: { whatsapp_message_id: messageId },
        });
      }
    } else {
      // Non-text or empty — mark as skipped
      await supabase
        .from('whatsapp_messages')
        .update({ processing_status: 'skipped' })
        .eq('id', messageId);
    }

    return jsonResponse({ received: true });

  } catch (err) {
    await supabase.from('system_logs').insert({
      log_level: 'ERROR',
      log_type: 'webhook_error',
      message: 'Unhandled error in whatsapp-webhook',
      metadata: { error: String(err) },
    }).catch(() => {});

    // Always return 200 to prevent Fonnte retries
    return jsonResponse({ received: true });
  }
});
