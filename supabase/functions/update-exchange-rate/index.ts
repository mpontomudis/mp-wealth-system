import { handleCors } from '../_shared/cors.ts';
import { getServiceClient, jsonResponse, errorResponse } from '../_shared/supabase-client.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Validate API key
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== Deno.env.get('INGEST_API_KEY')) {
    return errorResponse('Unauthorized', 401);
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const supabase = getServiceClient();

  try {
    // Fetch USD/IDR rate from open.er-api.com (free, no auth)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const idrRate: number = data?.rates?.IDR;

    if (!idrRate || typeof idrRate !== 'number') {
      throw new Error('IDR rate not found in API response');
    }

    // Upsert into exchange_rates
    const rateDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { error: upsertError } = await supabase
      .from('exchange_rates')
      .upsert(
        {
          base_currency: 'USD',
          target_currency: 'IDR',
          rate: idrRate,
          rate_date: rateDate,
          source: 'open.er-api.com',
          is_active: true,
        },
        { onConflict: 'base_currency,target_currency,rate_date' }
      );

    if (upsertError) {
      throw new Error(`Upsert exchange_rate failed: ${upsertError.message}`);
    }

    await supabase.from('system_logs').insert({
      log_level: 'INFO',
      log_type: 'exchange_rate_updated',
      message: `USD/IDR rate updated: ${idrRate}`,
      metadata: { rate: idrRate, rate_date: rateDate, source: 'open.er-api.com' },
    });

    return jsonResponse({ success: true, rate: idrRate, date: rateDate });

  } catch (err) {
    await supabase.from('system_logs').insert({
      log_level: 'ERROR',
      log_type: 'exchange_rate_error',
      message: 'Failed to update exchange rate',
      metadata: { error: String(err) },
    }).catch(() => {});

    return errorResponse(`Failed to update exchange rate: ${String(err)}`, 500);
  }
});
