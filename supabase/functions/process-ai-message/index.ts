import { handleCors } from '../_shared/cors.ts';
import { getServiceClient, jsonResponse, errorResponse } from '../_shared/supabase-client.ts';
import { parseTransactionFromText } from '../_shared/ai-parser.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  // Verify JWT — create a user-scoped client for auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse('Missing or invalid Authorization header', 401);
  }
  const token = authHeader.replace('Bearer ', '');

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) {
    return errorResponse('Unauthorized', 401);
  }

  let body: { whatsapp_message_id: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  if (!body.whatsapp_message_id) {
    return errorResponse('Missing required field: whatsapp_message_id', 400);
  }

  const supabase = getServiceClient();
  const ownerPhone = Deno.env.get('OWNER_PHONE_NUMBER') ?? '';

  try {
    // Fetch the message
    const { data: msg, error: fetchError } = await supabase
      .from('whatsapp_messages')
      .select('id, user_id, message_type, text_content, from_number')
      .eq('id', body.whatsapp_message_id)
      .single();

    if (fetchError || !msg) {
      return errorResponse('Message not found', 404);
    }

    // Access check: message must belong to the authenticated user OR be from the owner's phone
    const isOwner = msg.from_number === ownerPhone;
    const isOwnerUser = msg.user_id === user.id;
    if (!isOwner && !isOwnerUser) {
      return errorResponse('Forbidden', 403);
    }

    // Skip non-text messages
    if (msg.message_type !== 'text') {
      return jsonResponse({ skipped: true, reason: 'non-text message' });
    }

    const textContent = msg.text_content ?? '';
    if (!textContent.trim()) {
      return jsonResponse({ skipped: true, reason: 'empty text content' });
    }

    // Mark as processing
    await supabase
      .from('whatsapp_messages')
      .update({ processing_status: 'processing' })
      .eq('id', msg.id);

    // Call AI parser
    const { parsed, tokensUsed, processingTimeMs } = await parseTransactionFromText(textContent);
    const isValidTransaction = parsed.type !== null && parsed.confidence >= 0.7;

    // Insert ai_logs row
    const { data: aiLog, error: aiLogError } = await supabase
      .from('ai_logs')
      .insert({
        user_id: user.id,
        whatsapp_message_id: msg.id,
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

    if (aiLogError || !aiLog) {
      throw new Error(`Insert ai_log failed: ${aiLogError?.message}`);
    }

    // Mark message as done
    await supabase
      .from('whatsapp_messages')
      .update({ processing_status: 'done', processed_at: new Date().toISOString() })
      .eq('id', msg.id);

    return jsonResponse({
      success: true,
      ai_log_id: aiLog.id,
      parsed_data: isValidTransaction ? parsed : {},
      confidence_score: parsed.confidence,
    });

  } catch (err) {
    await supabase
      .from('whatsapp_messages')
      .update({ processing_status: 'failed', error_message: String(err) })
      .eq('id', body.whatsapp_message_id)
      .catch(() => {});

    await supabase.from('system_logs').insert({
      user_id: user.id,
      log_level: 'ERROR',
      log_type: 'ai_reprocess_error',
      message: 'Error reprocessing AI message',
      metadata: { whatsapp_message_id: body.whatsapp_message_id },
    }).catch(() => {});

    return errorResponse('Internal server error', 500);
  }
});
