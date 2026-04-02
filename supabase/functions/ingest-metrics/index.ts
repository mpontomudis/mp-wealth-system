import { handleCors } from '../_shared/cors.ts';
import { getServiceClient, jsonResponse, errorResponse } from '../_shared/supabase-client.ts';

interface IngestPayload {
  account_number: string;
  broker_code: string;
  balance: number;
  equity: number;
  floating_profit: number;
  margin: number;
  free_margin: number;
  margin_level: number;
  open_positions: number;
  total_lots: number;
  snapshot_time: string;
}

const REQUIRED_NUMERIC_FIELDS: (keyof IngestPayload)[] = [
  'balance', 'equity', 'floating_profit', 'margin',
  'free_margin', 'margin_level', 'open_positions', 'total_lots',
];

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = getServiceClient();

  // Validate API key
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== Deno.env.get('INGEST_API_KEY')) {
    return errorResponse('Unauthorized', 401);
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  let body: IngestPayload;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  // Validate required string fields
  if (!body.account_number || !body.broker_code) {
    return errorResponse('Missing required fields: account_number, broker_code', 400);
  }

  // Validate numeric fields
  for (const field of REQUIRED_NUMERIC_FIELDS) {
    if (typeof body[field] !== 'number') {
      return errorResponse(`Field "${field}" must be a number`, 400);
    }
  }

  try {
    // Look up broker
    const { data: broker, error: brokerError } = await supabase
      .from('broker_profiles')
      .select('id')
      .eq('broker_code', body.broker_code)
      .eq('is_active', true)
      .single();

    if (brokerError || !broker) {
      await logSystemError(supabase, 'broker_not_found', `Broker not found: ${body.broker_code}`);
      return errorResponse(`Broker not found: ${body.broker_code}`, 404);
    }

    // Look up trading account
    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('id')
      .eq('account_number', body.account_number)
      .eq('broker_id', broker.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (accountError || !account) {
      await logSystemError(supabase, 'account_not_found',
        `Account not found: ${body.account_number} (broker: ${body.broker_code})`);
      return errorResponse(`Account not found: ${body.account_number}`, 404);
    }

    const accountId = account.id;

    // Insert snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('account_metrics_snapshots')
      .insert({
        account_id: accountId,
        balance: body.balance,
        equity: body.equity,
        floating_profit: body.floating_profit,
        margin: body.margin,
        free_margin: body.free_margin,
        margin_level: body.margin_level,
        open_positions: body.open_positions,
        total_lots: body.total_lots,
        snapshot_time: body.snapshot_time ?? new Date().toISOString(),
        data_source: 'EA',
        is_valid: true,
      })
      .select('id')
      .single();

    if (snapshotError || !snapshot) {
      throw new Error(`Insert snapshot failed: ${snapshotError?.message}`);
    }

    // Update last_sync_at
    await supabase
      .from('trading_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', accountId);

    // Log success
    await supabase.from('system_logs').insert({
      account_id: accountId,
      log_level: 'INFO',
      log_type: 'metrics_ingested',
      message: `Metrics ingested for account ${body.account_number}`,
      metadata: { snapshot_id: snapshot.id, broker_code: body.broker_code },
    });

    return jsonResponse({ success: true, account_id: accountId, snapshot_id: snapshot.id });

  } catch (err) {
    await logSystemError(supabase, 'ingest_error', `Ingest error: ${String(err)}`);
    return errorResponse('Internal server error', 500);
  }
});

async function logSystemError(supabase: ReturnType<typeof getServiceClient>, logType: string, message: string) {
  await supabase.from('system_logs').insert({
    log_level: 'ERROR',
    log_type: logType,
    message,
  }).catch(() => {});
}
