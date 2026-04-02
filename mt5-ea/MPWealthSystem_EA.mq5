//+------------------------------------------------------------------+
//|                                          MPWealthSystem_EA.mq5  |
//|                                           MP Wealth System v2.0  |
//|                                           Marlon Pontomudis      |
//+------------------------------------------------------------------+
//  Purpose : Push MT5 account metrics to Supabase Edge Function
//            (ingest-metrics) on a configurable timer interval.
//
//  Endpoint: POST https://<project>.supabase.co/functions/v1/ingest-metrics
//  Auth    : x-api-key header
//  Payload : JSON — see BuildMetricsJSON()
//
//  Setup   : Tools > Options > Expert Advisors > Allow WebRequest
//            Add your Supabase functions URL to the whitelist.
//+------------------------------------------------------------------+
#property copyright "Marlon Pontomudis — MP Wealth System"
#property version   "2.0.0"
#property strict

//+------------------------------------------------------------------+
//| Input Parameters                                                  |
//+------------------------------------------------------------------+
input group "=== Connection ==="
input string IngestURL         = "https://YOUR_PROJECT.supabase.co/functions/v1/ingest-metrics";
input string ApiKey            = "your-ingest-api-key-here";

input group "=== Account Identity ==="
input string BrokerCode        = "EXNESS";   // EXNESS | TICKMILL | ICM | XM | MIFX

input group "=== Timing ==="
input int    PushIntervalMin   = 5;          // Push interval (minutes), min 1
input bool   PushOnInit        = true;       // Push immediately when EA starts

input group "=== Notifications ==="
input bool   EnableAlerts      = true;       // MT5 alert on HTTP errors
input bool   EnablePushNotify  = false;      // MT5 push notification on errors

//+------------------------------------------------------------------+
//| Global state                                                      |
//+------------------------------------------------------------------+
datetime g_lastPushTime     = 0;
int      g_successCount     = 0;
int      g_failCount        = 0;
bool     g_initDone         = false;

//+------------------------------------------------------------------+
//| OnInit                                                            |
//+------------------------------------------------------------------+
int OnInit()
  {
   //--- Validate inputs
   if(StringLen(IngestURL) < 20 || StringFind(IngestURL, "http") != 0)
     {
      Alert("MPWealthSystem EA: IngestURL is invalid. Check EA settings.");
      return(INIT_PARAMETERS_INCORRECT);
     }
   if(StringLen(ApiKey) < 8)
     {
      Alert("MPWealthSystem EA: ApiKey is too short. Check EA settings.");
      return(INIT_PARAMETERS_INCORRECT);
     }
   if(StringLen(BrokerCode) < 2)
     {
      Alert("MPWealthSystem EA: BrokerCode is required (e.g. EXNESS).");
      return(INIT_PARAMETERS_INCORRECT);
     }

   //--- Set timer (minimum 60 seconds)
   int intervalSec = MathMax(PushIntervalMin, 1) * 60;
   EventSetTimer(intervalSec);

   //--- Push immediately if configured
   if(PushOnInit)
      PushMetrics("init");

   g_initDone = true;

   PrintFormat("MPWealthSystem EA started. Account: %s | Broker: %s | Interval: %d min",
               IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)),
               BrokerCode,
               PushIntervalMin);
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| OnDeinit                                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
   PrintFormat("MPWealthSystem EA stopped. Reason: %d | Pushed: %d ok / %d fail",
               reason, g_successCount, g_failCount);
  }

//+------------------------------------------------------------------+
//| OnTimer — called every PushIntervalMin minutes                    |
//+------------------------------------------------------------------+
void OnTimer()
  {
   PushMetrics("timer");
  }

//+------------------------------------------------------------------+
//| PushMetrics — collects metrics and POSTs to edge function        |
//+------------------------------------------------------------------+
void PushMetrics(const string trigger)
  {
   //--- Skip if terminal not connected
   if(!TerminalInfoInteger(TERMINAL_CONNECTED))
     {
      Print("MPWealthSystem: Terminal not connected, skipping push.");
      return;
     }

   //--- Collect account metrics
   string accountNumber  = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   double balance        = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity         = AccountInfoDouble(ACCOUNT_EQUITY);
   double floatingProfit = AccountInfoDouble(ACCOUNT_PROFIT);
   double margin         = AccountInfoDouble(ACCOUNT_MARGIN);
   double freeMargin     = AccountInfoDouble(ACCOUNT_FREEMARGIN);
   double marginLevel    = (margin > 0) ? AccountInfoDouble(ACCOUNT_MARGIN_LEVEL) : 0;
   int    openPositions  = (int)PositionsTotal();
   double totalLots      = CalcTotalLots();
   string snapshotTime   = GetISO8601TimeGMT();

   //--- Build JSON payload
   string json = BuildMetricsJSON(
                    accountNumber, balance, equity, floatingProfit,
                    margin, freeMargin, marginLevel,
                    openPositions, totalLots, snapshotTime);

   //--- POST to edge function
   int httpCode = PostJSON(IngestURL, ApiKey, json);

   if(httpCode == 200)
     {
      g_successCount++;
      g_lastPushTime = TimeCurrent();
      PrintFormat("MPWealthSystem: Push OK [%s] B=%.2f E=%.2f FP=%.2f Pos=%d Lots=%.2f",
                  trigger, balance, equity, floatingProfit, openPositions, totalLots);
     }
   else
     {
      g_failCount++;
      string msg = StringFormat(
                      "MPWealthSystem: Push FAILED [%s] HTTP=%d | Account=%s Broker=%s",
                      trigger, httpCode, accountNumber, BrokerCode);
      Print(msg);
      if(EnableAlerts)
         Alert(msg);
      if(EnablePushNotify)
         SendNotification(msg);
     }
  }

//+------------------------------------------------------------------+
//| CalcTotalLots — sums volume across all open positions             |
//+------------------------------------------------------------------+
double CalcTotalLots()
  {
   double total = 0.0;
   int count = (int)PositionsTotal();
   for(int i = 0; i < count; i++)
     {
      if(PositionGetSymbol(i) != "")
         total += PositionGetDouble(POSITION_VOLUME);
     }
   return(NormalizeDouble(total, 2));
  }

//+------------------------------------------------------------------+
//| BuildMetricsJSON — constructs the JSON payload string             |
//+------------------------------------------------------------------+
string BuildMetricsJSON(
   const string accountNumber,
   const double balance,
   const double equity,
   const double floatingProfit,
   const double margin,
   const double freeMargin,
   const double marginLevel,
   const int    openPositions,
   const double totalLots,
   const string snapshotTime)
  {
   string json = "{";
   json += "\"account_number\":\"" + accountNumber + "\",";
   json += "\"broker_code\":\""    + BrokerCode    + "\",";
   json += "\"balance\":"          + DoubleToString(balance,        2) + ",";
   json += "\"equity\":"           + DoubleToString(equity,         2) + ",";
   json += "\"floating_profit\":"  + DoubleToString(floatingProfit, 2) + ",";
   json += "\"margin\":"           + DoubleToString(margin,         2) + ",";
   json += "\"free_margin\":"      + DoubleToString(freeMargin,     2) + ",";
   json += "\"margin_level\":"     + DoubleToString(marginLevel,    2) + ",";
   json += "\"open_positions\":"   + IntegerToString(openPositions)    + ",";
   json += "\"total_lots\":"       + DoubleToString(totalLots,      2) + ",";
   json += "\"snapshot_time\":\""  + snapshotTime                      + "\"";
   json += "}";
   return(json);
  }

//+------------------------------------------------------------------+
//| PostJSON — sends an HTTP POST with JSON body                      |
//|  Returns: HTTP status code (200 = success), -1 on WinInet error  |
//+------------------------------------------------------------------+
int PostJSON(const string url, const string apiKey, const string body)
  {
   string headers = "Content-Type: application/json\r\nx-api-key: " + apiKey;

   //--- Convert string body to byte array (UTF-8, no null terminator)
   char requestData[];
   int  bodyLen = StringToCharArray(body, requestData, 0, WHOLE_ARRAY, CP_UTF8) - 1;
   if(bodyLen <= 0)
     {
      Print("MPWealthSystem: Failed to encode request body.");
      return(-1);
     }
   ArrayResize(requestData, bodyLen);

   char responseData[];
   string responseHeaders;

   ResetLastError();
   int httpCode = WebRequest(
                     "POST",
                     url,
                     headers,
                     10000,        // timeout ms
                     requestData,
                     responseData,
                     responseHeaders);

   if(httpCode == -1)
     {
      int err = GetLastError();
      PrintFormat("MPWealthSystem: WebRequest error %d. Ensure URL is whitelisted in MT5 > Options > Expert Advisors.", err);
     }

   return(httpCode);
  }

//+------------------------------------------------------------------+
//| GetISO8601TimeGMT — returns current GMT time in ISO 8601 format  |
//|  e.g. "2025-04-02T08:40:00Z"                                     |
//+------------------------------------------------------------------+
string GetISO8601TimeGMT()
  {
   MqlDateTime dt;
   TimeToStruct(TimeGMT(), dt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                       dt.year, dt.mon, dt.day,
                       dt.hour, dt.min, dt.sec);
  }

//+------------------------------------------------------------------+
//| OnTick — not used for logic; EA is timer-driven                   |
//+------------------------------------------------------------------+
void OnTick() { }

//+------------------------------------------------------------------+
//| OnChartEvent — show status on double-click                        |
//+------------------------------------------------------------------+
void OnChartEvent(const int id,
                  const long   &lparam,
                  const double &dparam,
                  const string &sparam)
  {
   if(id == CHARTEVENT_CLICK)
     {
      string lastPush = (g_lastPushTime > 0)
                        ? TimeToString(g_lastPushTime, TIME_DATE | TIME_MINUTES)
                        : "never";
      PrintFormat("MPWealthSystem Status | OK: %d | Fail: %d | Last push: %s",
                  g_successCount, g_failCount, lastPush);
     }
  }
//+------------------------------------------------------------------+
