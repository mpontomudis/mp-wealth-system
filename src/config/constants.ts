// src/config/constants.ts

// ─── App Config ──────────────────────────────────────────────

export const APP_CONFIG = {
  appName: 'MP Wealth System',
  version: '2.0.0',
  defaultCurrency: 'IDR',
  defaultTheme: 'dark',
  owner: 'Marlon Pontomudis',
  timezone: 'Asia/Jayapura', // WIT — GMT+9
} as const;

// ─── Routes ──────────────────────────────────────────────────

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  TRADING: '/trading',
  WEALTH: '/wealth',
  TRANSACTIONS: '/transactions',
  ASSETS: '/assets',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

// ─── Pagination ──────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const EQUITY_CHART_DAYS = 30;
export const TRADE_HISTORY_LIMIT = 50;

// ─── Currency ────────────────────────────────────────────────

export const CURRENCIES = ['IDR', 'USD'] as const;
export type SupportedCurrency = (typeof CURRENCIES)[number];
export const FALLBACK_EXCHANGE_RATE = 16_000; // IDR per 1 USD

// ─── Brokers ─────────────────────────────────────────────────

export const BROKERS = [
  { code: 'EXNESS',  label: 'Exness',     color: '#00b386' },
  { code: 'TICKMILL',label: 'Tickmill',   color: '#e63e2a' },
  { code: 'ICM',     label: 'IC Markets', color: '#0066cc' },
  { code: 'XM',      label: 'XM',         color: '#ff6600' },
  { code: 'MIFX',    label: 'MiFX',       color: '#8b5cf6' },
] as const;

export type BrokerCode = (typeof BROKERS)[number]['code'];

export function getBrokerColor(brokerCode?: string | null): string {
  return BROKERS.find((b) => b.code === brokerCode)?.color ?? '#0A1F44';
}

// ─── Default Categories ──────────────────────────────────────

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary',            icon: 'briefcase',    color: '#10b981' },
  { name: 'Trading Profit',    icon: 'trending-up',  color: '#3b82f6' },
  { name: 'Business Income',   icon: 'store',        color: '#f59e0b' },
  { name: 'Investment Returns',icon: 'bar-chart-2',  color: '#8b5cf6' },
  { name: 'Other Income',      icon: 'plus-circle',  color: '#64748b' },
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining',     icon: 'utensils',     color: '#ef4444' },
  { name: 'Transportation',    icon: 'car',          color: '#f97316' },
  { name: 'Shopping',          icon: 'shopping-bag', color: '#ec4899' },
  { name: 'Entertainment',     icon: 'film',         color: '#a855f7' },
  { name: 'Healthcare',        icon: 'heart',        color: '#14b8a6' },
  { name: 'Education',         icon: 'book-open',    color: '#6366f1' },
  { name: 'Bills & Utilities', icon: 'zap',          color: '#eab308' },
  { name: 'Other Expenses',    icon: 'more-horizontal', color: '#64748b' },
] as const;

// ─── AI ──────────────────────────────────────────────────────

export const AI_CONFIDENCE_THRESHOLD = 0.8;
export const AI_MODEL = 'claude-sonnet-4-20250514';

// ─── Realtime ────────────────────────────────────────────────

export const METRICS_REFRESH_INTERVAL_MS = 5 * 60 * 1_000; // 5 minutes
