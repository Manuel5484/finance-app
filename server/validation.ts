import { MarketDataError } from '../src/types/market';
import type { WindowId } from '../src/types/market';
import { WINDOW_SPECS } from './windows';

export const MAX_SYMBOLS = 10;

// Letters, digits and the punctuation Yahoo uses in tickers (BRK-B, ^GSPC, SAP.DE, EURUSD=X).
const SYMBOL_PATTERN = /^[A-Z0-9^][A-Z0-9.\-=^]{0,14}$/;

export function parseSymbol(raw: unknown): string {
  const symbol = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!SYMBOL_PATTERN.test(symbol)) {
    throw new MarketDataError('invalid_symbol', 'Enter a valid ticker symbol, for example IBM');
  }
  return symbol;
}

export function parseSymbols(raw: unknown): string[] {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new MarketDataError('invalid_symbol', 'At least one symbol is required');
  }
  const symbols = [...new Set(raw.split(',').map(parseSymbol))];
  if (symbols.length > MAX_SYMBOLS) {
    throw new MarketDataError('invalid_symbol', `At most ${MAX_SYMBOLS} symbols per request`);
  }
  return symbols;
}

export function parseWindow(raw: unknown): WindowId {
  if (typeof raw === 'string' && Object.hasOwn(WINDOW_SPECS, raw)) return raw as WindowId;
  throw new MarketDataError('invalid_symbol', `window must be one of: ${Object.keys(WINDOW_SPECS).join(', ')}`);
}
