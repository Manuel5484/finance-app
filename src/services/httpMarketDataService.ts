import { MarketDataError } from '../types/market';
import type { ErrorCode, History, QuotesResult } from '../types/market';
import type { MarketDataService } from './MarketDataService';

const CODES: ErrorCode[] = ['invalid_symbol', 'not_found', 'upstream', 'network'];

async function toError(response: Response): Promise<MarketDataError> {
  const body = (await response.json().catch(() => null)) as {
    code?: string;
    message?: string;
    retryable?: boolean;
  } | null;
  const fallback: ErrorCode =
    response.status === 400 ? 'invalid_symbol' : response.status === 404 ? 'not_found' : 'upstream';
  const code = CODES.find((c) => c === body?.code) ?? fallback;
  return new MarketDataError(
    code,
    body?.message ?? `Market data request failed (${response.status})`,
    body?.retryable ?? code === 'upstream',
  );
}

async function getJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new MarketDataError('network', 'Unable to reach the market data service', true);
  }
  if (!response.ok) throw await toError(response);
  return (await response.json()) as T;
}

/**
 * Talks to the backend proxy in server/, which wraps Yahoo Finance (Yahoo blocks
 * direct browser calls). Routes:
 *   GET {baseUrl}/api/quotes?symbols=IBM,MSFT
 *   GET {baseUrl}/api/history?symbol=IBM&window=week
 */
export function createHttpMarketDataService(baseUrl = ''): MarketDataService {
  return {
    getQuotes: (symbols) =>
      getJson<QuotesResult>(`${baseUrl}/api/quotes?symbols=${encodeURIComponent(symbols.join(','))}`),
    getHistory: (symbol, window) =>
      getJson<History>(
        `${baseUrl}/api/history?symbol=${encodeURIComponent(symbol)}&window=${window}`,
      ),
  };
}
