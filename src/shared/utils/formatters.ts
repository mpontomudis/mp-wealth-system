// src/shared/utils/formatters.ts
import type { SupportedCurrency } from '@/config/constants';

// ─── Guards ──────────────────────────────────────────────────

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
}

// ─── IDR Formatter ───────────────────────────────────────────

/**
 * Format a number as Indonesian Rupiah.
 * @example formatIDR(15000) → "Rp 15.000"
 * @example formatIDR(1500000.5) → "Rp 1.500.001"
 */
export function formatIDR(amount: number | null | undefined): string {
  if (!isValidNumber(amount)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── USD Formatter ───────────────────────────────────────────

/**
 * Format a number as US Dollar.
 * @example formatUSD(1500) → "$1,500.00"
 * @example formatUSD(0.5) → "$0.50"
 */
export function formatUSD(amount: number | null | undefined): string {
  if (!isValidNumber(amount)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Dynamic Currency Formatter ──────────────────────────────

/**
 * Format amount based on currency code.
 * @example formatCurrency(50000, 'IDR') → "Rp 50.000"
 * @example formatCurrency(100.5, 'USD') → "$100.50"
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: SupportedCurrency | string
): string {
  if (!isValidNumber(amount)) {
    return currency === 'USD' ? '$0.00' : 'Rp 0';
  }

  switch (currency) {
    case 'USD':
      return formatUSD(amount);
    case 'IDR':
      return formatIDR(amount);
    default:
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
  }
}

// ─── Date Formatters ─────────────────────────────────────────

const DATE_FORMAT_LONG = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATE_FORMAT_SHORT = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATETIME_FORMAT = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const TIME_FORMAT = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

type DateFormatVariant = 'long' | 'short' | 'datetime' | 'time' | 'relative';

/**
 * Format a date string or Date object.
 * @param value - ISO date string or Date instance
 * @param variant - 'long' (12 Oct 2026) | 'short' (12/10/2026) | 'datetime' (12/10/2026 14:30) | 'time' (14:30) | 'relative'
 */
export function formatDate(
  value: string | Date | null | undefined,
  variant: DateFormatVariant = 'long'
): string {
  if (value === null || value === undefined || value === '') return '-';

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) return '-';

  switch (variant) {
    case 'long':
      return DATE_FORMAT_LONG.format(date);
    case 'short':
      return DATE_FORMAT_SHORT.format(date);
    case 'datetime':
      return DATETIME_FORMAT.format(date);
    case 'time':
      return TIME_FORMAT.format(date);
    case 'relative':
      return formatRelativeDate(date);
    default:
      return DATE_FORMAT_LONG.format(date);
  }
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1_000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return DATE_FORMAT_SHORT.format(date);
}

// ─── Percentage Formatter ────────────────────────────────────

/**
 * Format a number as a percentage string.
 * @example formatPercentage(5.25) → "5.25%"
 * @example formatPercentage(100) → "100.00%"
 * @example formatPercentage(null) → "-"
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals = 2
): string {
  if (!isValidNumber(value)) return '-';

  return `${value.toFixed(decimals)}%`;
}

// ─── Number Formatter ────────────────────────────────────────

/**
 * Format a plain number with thousand separators.
 * @example formatNumber(1500000) → "1,500,000"
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 0
): string {
  if (!isValidNumber(value)) return '0';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// ─── Lot Size Formatter ──────────────────────────────────────

/**
 * Format trading lot size (always 2 decimal places).
 * @example formatLots(0.1) → "0.10"
 */
export function formatLots(lots: number | null | undefined): string {
  if (!isValidNumber(lots)) return '0.00';
  return lots.toFixed(2);
}

// ─── Profit/Loss Formatter ───────────────────────────────────

/**
 * Format P/L with sign prefix.
 * @example formatPL(500, 'USD') → "+$500.00"
 * @example formatPL(-200, 'IDR') → "-Rp 200"
 */
export function formatPL(
  amount: number | null | undefined,
  currency: SupportedCurrency | string = 'USD'
): string {
  if (!isValidNumber(amount)) return '-';
  const sign = amount >= 0 ? '+' : '';
  return `${sign}${formatCurrency(amount, currency)}`;
}
