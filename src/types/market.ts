export type WindowId = 'day' | 'week' | 'quarter';

export interface Company {
  symbol: string;
  name: string;
  color: string;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  /** epoch ms of the latest data point */
  asOf: number;
}

export interface PricePoint {
  /** epoch ms */
  t: number;
  close: number;
}

export interface History {
  symbol: string;
  window: WindowId;
  points: PricePoint[];
}

export type ErrorCode = 'invalid_symbol' | 'not_found' | 'upstream' | 'network';

export interface QuoteFailure {
  symbol: string;
  code: ErrorCode;
  message: string;
}

/** Quotes that loaded, plus the symbols that did not, so one bad symbol never blanks the summary. */
export interface QuotesResult {
  quotes: Quote[];
  failed: QuoteFailure[];
}

export class MarketDataError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;

  constructor(code: ErrorCode, message: string, retryable = false) {
    super(message);
    this.name = 'MarketDataError';
    this.code = code;
    this.retryable = retryable;
  }
}
