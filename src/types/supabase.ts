// src/types/supabase.ts
// ============================================================
// MP Wealth System — Supabase Database Types
// Matches: database/schema.sql v2.0.0
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type AccountType        = "LIVE" | "DEMO";
export type AccountStatus      = "ONLINE" | "IDLE" | "OFFLINE" | "NEVER_SYNCED";
export type DataSource         = "EA" | "MetaApi" | "Manual";
export type TradeType          = "BUY" | "SELL";
export type CategoryType       = "income" | "expense";
export type TransactionType    = "income" | "expense" | "transfer";
export type TransactionSource  = "manual" | "whatsapp" | "ai" | "bulk_upload";
export type AssetType          = "cash" | "bank" | "trading" | "investment" | "crypto";
export type BudgetPeriod       = "daily" | "weekly" | "monthly" | "yearly";
export type MessageType        = "text" | "image" | "audio" | "video" | "document";
export type ProcessingStatus   = "pending" | "processing" | "completed" | "failed";
export type ValidationResult   = "approved" | "rejected" | "modified";
export type LogLevel           = "INFO" | "WARNING" | "ERROR" | "DEBUG";
export type ThemeMode          = "light" | "dark" | "auto";

// ─── Helper Types ─────────────────────────────────────────────

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// ─── RPC Return Types ─────────────────────────────────────────

export type PortfolioTotalRow = {
  total_equity_usd:  number;
  total_equity_idr:  number;
  total_balance_usd: number;
  total_balance_idr: number;
  total_profit_usd:  number;
  total_profit_idr:  number;
  exchange_rate:     number;
  last_updated:      string | null;
};

export type MonthlySummaryRow = {
  total_income_idr:  number;
  total_expense_idr: number;
  total_income_usd:  number;
  total_expense_usd: number;
  net_cashflow_idr:  number;
  net_cashflow_usd:  number;
};

// ─── Database ─────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {

      // ── broker_profiles ───────────────────────────────────
      broker_profiles: {
        Row: {
          id:           string;
          broker_name:  string;
          broker_code:  string;
          api_endpoint: string | null;
          logo_url:     string | null;
          is_active:    boolean;
          timezone:     string;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:          string;
          broker_name:  string;
          broker_code:  string;
          api_endpoint?: string | null;
          logo_url?:     string | null;
          is_active?:    boolean;
          timezone?:     string;
          created_at?:   string;
          updated_at?:   string;
        };
        Update: {
          id?:          string;
          broker_name?: string;
          broker_code?: string;
          api_endpoint?: string | null;
          logo_url?:     string | null;
          is_active?:    boolean;
          timezone?:     string;
          created_at?:   string;
          updated_at?:   string;
        };
        Relationships: [];
      };

      // ── trading_accounts ──────────────────────────────────
      trading_accounts: {
        Row: {
          id:               string;
          broker_id:        string;
          user_id:          string;
          account_number:   string;
          account_name:     string | null;
          account_type:     AccountType;
          server_name:      string | null;
          base_currency:    string;
          leverage:         number;
          initial_deposit:  number;
          is_active:        boolean;
          last_sync_at:     string | null;
          deleted_at:       string | null;
          created_at:       string;
          updated_at:       string;
        };
        Insert: {
          id?:              string;
          broker_id:        string;
          user_id:          string;
          account_number:   string;
          account_name?:    string | null;
          account_type?:    AccountType;
          server_name?:     string | null;
          base_currency?:   string;
          leverage?:        number;
          initial_deposit?: number;
          is_active?:       boolean;
          last_sync_at?:    string | null;
          deleted_at?:      string | null;
          created_at?:      string;
          updated_at?:      string;
        };
        Update: {
          id?:              string;
          broker_id?:       string;
          user_id?:         string;
          account_number?:  string;
          account_name?:    string | null;
          account_type?:    AccountType;
          server_name?:     string | null;
          base_currency?:   string;
          leverage?:        number;
          initial_deposit?: number;
          is_active?:       boolean;
          last_sync_at?:    string | null;
          deleted_at?:      string | null;
          created_at?:      string;
          updated_at?:      string;
        };
        Relationships: [
          {
            foreignKeyName: "trading_accounts_broker_id_fkey";
            columns: ["broker_id"];
            referencedRelation: "broker_profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── account_metrics_snapshots ─────────────────────────
      account_metrics_snapshots: {
        Row: {
          id:              string;
          account_id:      string;
          balance:         number;
          equity:          number;
          floating_profit: number;
          margin:          number;
          free_margin:     number;
          margin_level:    number;
          open_positions:  number;
          total_lots:      number;
          snapshot_time:   string;
          data_source:     DataSource;
          is_valid:        boolean;
          created_at:      string;
        };
        Insert: {
          id?:              string;
          account_id:       string;
          balance:          number;
          equity:           number;
          floating_profit?: number;
          margin?:          number;
          free_margin?:     number;
          margin_level?:    number;
          open_positions?:  number;
          total_lots?:      number;
          snapshot_time?:   string;
          data_source?:     DataSource;
          is_valid?:        boolean;
          created_at?:      string;
        };
        Update: {
          id?:              string;
          account_id?:      string;
          balance?:         number;
          equity?:          number;
          floating_profit?: number;
          margin?:          number;
          free_margin?:     number;
          margin_level?:    number;
          open_positions?:  number;
          total_lots?:      number;
          snapshot_time?:   string;
          data_source?:     DataSource;
          is_valid?:        boolean;
          created_at?:      string;
        };
        Relationships: [
          {
            foreignKeyName: "account_metrics_snapshots_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "trading_accounts";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── trade_history ─────────────────────────────────────
      trade_history: {
        Row: {
          id:              string;
          account_id:      string;
          ticket_number:   number;
          symbol:          string;
          trade_type:      TradeType;
          lot_size:        number;
          open_price:      number;
          close_price:     number | null;
          stop_loss:       number | null;
          take_profit:     number | null;
          open_time:       string;
          close_time:      string | null;
          profit:          number | null;
          commission:      number;
          swap:            number;
          net_profit:      number | null;
          ea_magic_number: number | null;
          comment:         string | null;
          is_closed:       boolean;
          created_at:      string;
        };
        Insert: {
          id?:              string;
          account_id:       string;
          ticket_number:    number;
          symbol:           string;
          trade_type:       TradeType;
          lot_size:         number;
          open_price:       number;
          close_price?:     number | null;
          stop_loss?:       number | null;
          take_profit?:     number | null;
          open_time:        string;
          close_time?:      string | null;
          profit?:          number | null;
          commission?:      number;
          swap?:            number;
          net_profit?:      number | null;
          ea_magic_number?: number | null;
          comment?:         string | null;
          is_closed?:       boolean;
          created_at?:      string;
        };
        Update: {
          id?:              string;
          account_id?:      string;
          ticket_number?:   number;
          symbol?:          string;
          trade_type?:      TradeType;
          lot_size?:        number;
          open_price?:      number;
          close_price?:     number | null;
          stop_loss?:       number | null;
          take_profit?:     number | null;
          open_time?:       string;
          close_time?:      string | null;
          profit?:          number | null;
          commission?:      number;
          swap?:            number;
          net_profit?:      number | null;
          ea_magic_number?: number | null;
          comment?:         string | null;
          is_closed?:       boolean;
          created_at?:      string;
        };
        Relationships: [
          {
            foreignKeyName: "trade_history_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "trading_accounts";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── daily_summaries ───────────────────────────────────
      daily_summaries: {
        Row: {
          id:                string;
          account_id:        string;
          summary_date:      string;
          opening_balance:   number | null;
          closing_balance:   number | null;
          opening_equity:    number | null;
          closing_equity:    number | null;
          daily_profit:      number;
          daily_profit_pct:  number;
          max_equity:        number | null;
          min_equity:        number | null;
          max_drawdown:      number | null;
          max_drawdown_pct:  number | null;
          total_trades:      number;
          winning_trades:    number;
          losing_trades:     number;
          total_lots:        number;
          created_at:        string;
        };
        Insert: {
          id?:               string;
          account_id:        string;
          summary_date:      string;
          opening_balance?:  number | null;
          closing_balance?:  number | null;
          opening_equity?:   number | null;
          closing_equity?:   number | null;
          daily_profit?:     number;
          daily_profit_pct?: number;
          max_equity?:       number | null;
          min_equity?:       number | null;
          max_drawdown?:     number | null;
          max_drawdown_pct?: number | null;
          total_trades?:     number;
          winning_trades?:   number;
          losing_trades?:    number;
          total_lots?:       number;
          created_at?:       string;
        };
        Update: {
          id?:               string;
          account_id?:       string;
          summary_date?:     string;
          opening_balance?:  number | null;
          closing_balance?:  number | null;
          opening_equity?:   number | null;
          closing_equity?:   number | null;
          daily_profit?:     number;
          daily_profit_pct?: number;
          max_equity?:       number | null;
          min_equity?:       number | null;
          max_drawdown?:     number | null;
          max_drawdown_pct?: number | null;
          total_trades?:     number;
          winning_trades?:   number;
          losing_trades?:    number;
          total_lots?:       number;
          created_at?:       string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_summaries_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "trading_accounts";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── categories ────────────────────────────────────────
      categories: {
        Row: {
          id:                 string;
          user_id:            string;
          name:               string;
          type:               CategoryType;
          color:              string;
          icon:               string | null;
          parent_category_id: string | null;
          is_active:          boolean;
          deleted_at:         string | null;
          created_at:         string;
          updated_at:         string;
        };
        Insert: {
          id?:                string;
          user_id:            string;
          name:               string;
          type:               CategoryType;
          color?:             string;
          icon?:              string | null;
          parent_category_id?: string | null;
          is_active?:         boolean;
          deleted_at?:        string | null;
          created_at?:        string;
          updated_at?:        string;
        };
        Update: {
          id?:                string;
          user_id?:           string;
          name?:              string;
          type?:              CategoryType;
          color?:             string;
          icon?:              string | null;
          parent_category_id?: string | null;
          is_active?:         boolean;
          deleted_at?:        string | null;
          created_at?:        string;
          updated_at?:        string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey";
            columns: ["parent_category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── transactions ──────────────────────────────────────
      transactions: {
        Row: {
          id:                  string;
          user_id:             string;
          category_id:         string | null;
          type:                TransactionType;
          amount:              number;
          currency:            string;
          amount_usd:          number | null;
          description:         string | null;
          notes:               string | null;
          source:              TransactionSource;
          whatsapp_message_id: string | null;
          ai_log_id:           string | null;
          transaction_date:    string;
          deleted_at:          string | null;
          created_at:          string;
          updated_at:          string;
          search_vector:       string | null;
        };
        Insert: {
          id?:                  string;
          user_id:              string;
          category_id?:         string | null;
          type:                 TransactionType;
          amount:               number;
          currency?:            string;
          amount_usd?:          number | null;
          description?:         string | null;
          notes?:               string | null;
          source?:              TransactionSource;
          whatsapp_message_id?: string | null;
          ai_log_id?:           string | null;
          transaction_date?:    string;
          deleted_at?:          string | null;
          created_at?:          string;
          updated_at?:          string;
          search_vector?:       string | null;
        };
        Update: {
          id?:                  string;
          user_id?:             string;
          category_id?:         string | null;
          type?:                TransactionType;
          amount?:              number;
          currency?:            string;
          amount_usd?:          number | null;
          description?:         string | null;
          notes?:               string | null;
          source?:              TransactionSource;
          whatsapp_message_id?: string | null;
          ai_log_id?:           string | null;
          transaction_date?:    string;
          deleted_at?:          string | null;
          created_at?:          string;
          updated_at?:          string;
          search_vector?:       string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_whatsapp_message_id_fkey";
            columns: ["whatsapp_message_id"];
            referencedRelation: "whatsapp_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_ai_log_id_fkey";
            columns: ["ai_log_id"];
            referencedRelation: "ai_logs";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── assets ────────────────────────────────────────────
      assets: {
        Row: {
          id:                 string;
          user_id:            string;
          name:               string;
          type:               AssetType;
          balance:            number;
          currency:           string;
          balance_usd:        number | null;
          account_number:     string | null;
          institution:        string | null;
          trading_account_id: string | null;
          is_active:          boolean;
          deleted_at:         string | null;
          last_updated:       string;
          created_at:         string;
          updated_at:         string;
        };
        Insert: {
          id?:                 string;
          user_id:             string;
          name:                string;
          type:                AssetType;
          balance?:            number;
          currency?:           string;
          balance_usd?:        number | null;
          account_number?:     string | null;
          institution?:        string | null;
          trading_account_id?: string | null;
          is_active?:          boolean;
          deleted_at?:         string | null;
          last_updated?:       string;
          created_at?:         string;
          updated_at?:         string;
        };
        Update: {
          id?:                 string;
          user_id?:            string;
          name?:               string;
          type?:               AssetType;
          balance?:            number;
          currency?:           string;
          balance_usd?:        number | null;
          account_number?:     string | null;
          institution?:        string | null;
          trading_account_id?: string | null;
          is_active?:          boolean;
          deleted_at?:         string | null;
          last_updated?:       string;
          created_at?:         string;
          updated_at?:         string;
        };
        Relationships: [
          {
            foreignKeyName: "assets_trading_account_id_fkey";
            columns: ["trading_account_id"];
            referencedRelation: "trading_accounts";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── budgets ───────────────────────────────────────────
      budgets: {
        Row: {
          id:          string;
          user_id:     string;
          category_id: string | null;
          amount:      number;
          period:      BudgetPeriod;
          start_date:  string;
          end_date:    string | null;
          is_active:   boolean;
          deleted_at:  string | null;
          created_at:  string;
          updated_at:  string;
        };
        Insert: {
          id?:          string;
          user_id:      string;
          category_id?: string | null;
          amount:       number;
          period?:      BudgetPeriod;
          start_date:   string;
          end_date?:    string | null;
          is_active?:   boolean;
          deleted_at?:  string | null;
          created_at?:  string;
          updated_at?:  string;
        };
        Update: {
          id?:          string;
          user_id?:     string;
          category_id?: string | null;
          amount?:      number;
          period?:      BudgetPeriod;
          start_date?:  string;
          end_date?:    string | null;
          is_active?:   boolean;
          deleted_at?:  string | null;
          created_at?:  string;
          updated_at?:  string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── whatsapp_messages ─────────────────────────────────
      whatsapp_messages: {
        Row: {
          id:                string;
          user_id:           string | null;
          whatsapp_id:       string | null;
          from_number:       string;
          message_type:      MessageType;
          text_content:      string | null;
          media_url:         string | null;
          media_type:        string | null;
          processing_status: ProcessingStatus;
          error_message:     string | null;
          received_at:       string;
          processed_at:      string | null;
          created_at:        string;
        };
        Insert: {
          id?:                string;
          user_id?:           string | null;
          whatsapp_id?:       string | null;
          from_number:        string;
          message_type:       MessageType;
          text_content?:      string | null;
          media_url?:         string | null;
          media_type?:        string | null;
          processing_status?: ProcessingStatus;
          error_message?:     string | null;
          received_at?:       string;
          processed_at?:      string | null;
          created_at?:        string;
        };
        Update: {
          id?:                string;
          user_id?:           string | null;
          whatsapp_id?:       string | null;
          from_number?:       string;
          message_type?:      MessageType;
          text_content?:      string | null;
          media_url?:         string | null;
          media_type?:        string | null;
          processing_status?: ProcessingStatus;
          error_message?:     string | null;
          received_at?:       string;
          processed_at?:      string | null;
          created_at?:        string;
        };
        Relationships: [];
      };

      // ── ai_logs ───────────────────────────────────────────
      ai_logs: {
        Row: {
          id:                   string;
          user_id:              string | null;
          whatsapp_message_id:  string | null;
          input_type:           string;
          input_content:        string | null;
          ai_provider:          string;
          ai_model:             string | null;
          parsed_data:          Record<string, unknown>;
          confidence_score:     number | null;
          is_validated:         boolean;
          validation_result:    ValidationResult | null;
          processing_time_ms:   number | null;
          tokens_used:          number | null;
          created_at:           string;
          validated_at:         string | null;
        };
        Insert: {
          id?:                   string;
          user_id?:              string | null;
          whatsapp_message_id?:  string | null;
          input_type:            string;
          input_content?:        string | null;
          ai_provider?:          string;
          ai_model?:             string | null;
          parsed_data?:          Record<string, unknown>;
          confidence_score?:     number | null;
          is_validated?:         boolean;
          validation_result?:    ValidationResult | null;
          processing_time_ms?:   number | null;
          tokens_used?:          number | null;
          created_at?:           string;
          validated_at?:         string | null;
        };
        Update: {
          id?:                   string;
          user_id?:              string | null;
          whatsapp_message_id?:  string | null;
          input_type?:           string;
          input_content?:        string | null;
          ai_provider?:          string;
          ai_model?:             string | null;
          parsed_data?:          Record<string, unknown>;
          confidence_score?:     number | null;
          is_validated?:         boolean;
          validation_result?:    ValidationResult | null;
          processing_time_ms?:   number | null;
          tokens_used?:          number | null;
          created_at?:           string;
          validated_at?:         string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_logs_whatsapp_message_id_fkey";
            columns: ["whatsapp_message_id"];
            referencedRelation: "whatsapp_messages";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── ocr_results ───────────────────────────────────────
      ocr_results: {
        Row: {
          id:                  string;
          ai_log_id:           string;
          whatsapp_message_id: string | null;
          ocr_provider:        string;
          raw_text:            string | null;
          structured_data:     Record<string, unknown> | null;
          image_url:           string | null;
          image_size_bytes:    number | null;
          processing_time_ms:  number | null;
          confidence_score:    number | null;
          created_at:          string;
        };
        Insert: {
          id?:                  string;
          ai_log_id:            string;
          whatsapp_message_id?: string | null;
          ocr_provider?:        string;
          raw_text?:            string | null;
          structured_data?:     Record<string, unknown> | null;
          image_url?:           string | null;
          image_size_bytes?:    number | null;
          processing_time_ms?:  number | null;
          confidence_score?:    number | null;
          created_at?:          string;
        };
        Update: {
          id?:                  string;
          ai_log_id?:           string;
          whatsapp_message_id?: string | null;
          ocr_provider?:        string;
          raw_text?:            string | null;
          structured_data?:     Record<string, unknown> | null;
          image_url?:           string | null;
          image_size_bytes?:    number | null;
          processing_time_ms?:  number | null;
          confidence_score?:    number | null;
          created_at?:          string;
        };
        Relationships: [
          {
            foreignKeyName: "ocr_results_ai_log_id_fkey";
            columns: ["ai_log_id"];
            referencedRelation: "ai_logs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ocr_results_whatsapp_message_id_fkey";
            columns: ["whatsapp_message_id"];
            referencedRelation: "whatsapp_messages";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── exchange_rates ────────────────────────────────────
      exchange_rates: {
        Row: {
          id:              string;
          base_currency:   string;
          target_currency: string;
          rate:            number;
          rate_date:       string;
          source:          string;
          is_active:       boolean;
          created_at:      string;
        };
        Insert: {
          id?:              string;
          base_currency?:   string;
          target_currency?: string;
          rate:             number;
          rate_date?:       string;
          source?:          string;
          is_active?:       boolean;
          created_at?:      string;
        };
        Update: {
          id?:              string;
          base_currency?:   string;
          target_currency?: string;
          rate?:            number;
          rate_date?:       string;
          source?:          string;
          is_active?:       boolean;
          created_at?:      string;
        };
        Relationships: [];
      };

      // ── system_logs ───────────────────────────────────────
      system_logs: {
        Row: {
          id:         string;
          user_id:    string | null;
          account_id: string | null;
          log_level:  LogLevel;
          log_type:   string;
          message:    string;
          metadata:   Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?:         string;
          user_id?:    string | null;
          account_id?: string | null;
          log_level:   LogLevel;
          log_type:    string;
          message:     string;
          metadata?:   Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?:         string;
          user_id?:    string | null;
          account_id?: string | null;
          log_level?:  LogLevel;
          log_type?:   string;
          message?:    string;
          metadata?:   Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "system_logs_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "trading_accounts";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── user_preferences ──────────────────────────────────
      user_preferences: {
        Row: {
          id:                       string;
          user_id:                  string;
          default_currency:         string;
          show_usd:                 boolean;
          show_idr:                 boolean;
          theme:                    ThemeMode;
          whatsapp_number:          string | null;
          whatsapp_auto_confirm:    boolean;
          notify_trading_updates:   boolean;
          notify_large_expenses:    boolean;
          large_expense_threshold:  number;
          created_at:               string;
          updated_at:               string;
        };
        Insert: {
          id?:                       string;
          user_id:                   string;
          default_currency?:         string;
          show_usd?:                 boolean;
          show_idr?:                 boolean;
          theme?:                    ThemeMode;
          whatsapp_number?:          string | null;
          whatsapp_auto_confirm?:    boolean;
          notify_trading_updates?:   boolean;
          notify_large_expenses?:    boolean;
          large_expense_threshold?:  number;
          created_at?:               string;
          updated_at?:               string;
        };
        Update: {
          id?:                       string;
          user_id?:                  string;
          default_currency?:         string;
          show_usd?:                 boolean;
          show_idr?:                 boolean;
          theme?:                    ThemeMode;
          whatsapp_number?:          string | null;
          whatsapp_auto_confirm?:    boolean;
          notify_trading_updates?:   boolean;
          notify_large_expenses?:    boolean;
          large_expense_threshold?:  number;
          created_at?:               string;
          updated_at?:               string;
        };
        Relationships: [];
      };

    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_portfolio_total: {
        Args: { p_user_id: string };
        Returns: PortfolioTotalRow[];
      };
      get_monthly_summary: {
        Args: { p_user_id: string; p_year: number; p_month: number };
        Returns: MonthlySummaryRow[];
      };
    };
    Enums: {
      account_type:       AccountType;
      account_status:     AccountStatus;
      data_source:        DataSource;
      trade_type:         TradeType;
      category_type:      CategoryType;
      transaction_type:   TransactionType;
      transaction_source: TransactionSource;
      asset_type:         AssetType;
      budget_period:      BudgetPeriod;
      message_type:       MessageType;
      processing_status:  ProcessingStatus;
      validation_result:  ValidationResult;
      log_level:          LogLevel;
      theme_mode:         ThemeMode;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
