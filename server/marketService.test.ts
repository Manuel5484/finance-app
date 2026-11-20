// @vitest-environment node
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarketDataError } from '../src/types/market';
import { createApp } from './app';
import { createMarketService } from './marketService';
import type { RawChart, RawQuote } from './yahoo/normalize';
import type { YahooSource } from './yahoo/yahooClient';

const NOW = Date.parse('2025-01-03T20:00:00Z');

function fakeSource(overrides: Partial<YahooSource> = {}): YahooSource & { quote: ReturnType<typeof vi.fn>; chart: ReturnType<typeof vi.fn> } {
  const chart: RawChart = {
    meta: { exchangeTimezoneName: 'America/New_York' },
    quotes: [
      { date: new Date('2025-01-03T15:00:00Z'), close: 100 },
      { date: new Date('2025-01-03T15:05:00Z'), close: 101 },
    ],
  };
  return {
    quote: vi.fn(async (symbols: string[]): Promise<RawQuote[]> =>
      symbols.filter((s) => s !== 'NOPE').map((symbol) => ({ symbol, regularMarketPrice: 100 })),
    ),
    chart: vi.fn(async () => chart),
    ...overrides,
  } as never;
}

let server: Server | undefined;
afterEach(() => server?.close());

async function start(source: YahooSource) {
  const app = createApp(createMarketService({ source, now: () => NOW }));
  server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  return (path: string) => fetch(`http://127.0.0.1:${port}${path}`);
}

describe('GET /api/quotes', () => {
  it('returns normalized quotes and reports symbols that are missing', async () => {
    const get = await start(fakeSource());
    const res = await get('/api/quotes?symbols=ibm,msft,nope');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.quotes.map((q: { symbol: string }) => q.symbol)).toEqual(['IBM', 'MSFT']);
    expect(body.failed).toEqual([expect.objectContaining({ symbol: 'NOPE', code: 'not_found' })]);
  });

  it('rejects missing or malformed symbols with 400', async () => {
    const get = await start(fakeSource());
    expect((await get('/api/quotes')).status).toBe(400);
    expect((await get('/api/quotes?symbols=IBM,<script>')).status).toBe(400);
  });

  it('serves repeat requests from the cache', async () => {
    const source = fakeSource();
    const get = await start(source);
    await get('/api/quotes?symbols=IBM,MSFT');
    await get('/api/quotes?symbols=MSFT,IBM');
    expect(source.quote).toHaveBeenCalledTimes(1);
  });

  it('maps upstream failures to 502 with a typed body', async () => {
    const get = await start(
      fakeSource({ quote: async () => { throw new MarketDataError('upstream', 'down', true); } }),
    );
    const res = await get('/api/quotes?symbols=IBM');
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ code: 'upstream', message: 'down', retryable: true });
  });

  it('returns a generic 500 for unexpected errors without leaking details', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const get = await start(fakeSource({ quote: async () => { throw new Error('secret db password'); } }));
    const res = await get('/api/quotes?symbols=IBM');
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain('secret');
    expect(JSON.parse(text)).toMatchObject({ code: 'upstream', message: 'Unexpected server error' });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('reports a quote with no price as failed instead of failing the whole request', async () => {
    const get = await start(
      fakeSource({
        quote: async () => [{ symbol: 'IBM', regularMarketPrice: 100 }, { symbol: 'SAP' }],
      }),
    );
    const body = await (await get('/api/quotes?symbols=IBM,SAP')).json();
    expect(body.quotes.map((q: { symbol: string }) => q.symbol)).toEqual(['IBM']);
    expect(body.failed).toEqual([expect.objectContaining({ symbol: 'SAP', code: 'upstream' })]);
  });
});

describe('GET /api/history', () => {
  it('returns normalized history for a window and requests the right interval', async () => {
    const source = fakeSource();
    const get = await start(source);
    const res = await get('/api/history?symbol=ibm&window=quarter');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ symbol: 'IBM', window: 'quarter', points: [{ close: 100 }, { close: 101 }] });
    expect(source.chart).toHaveBeenCalledWith('IBM', expect.objectContaining({ interval: '1d' }));
  });

  it('rejects an unknown window and an invalid symbol with 400', async () => {
    const get = await start(fakeSource());
    expect((await get('/api/history?symbol=IBM&window=year')).status).toBe(400);
    expect((await get('/api/history?symbol=&window=day')).status).toBe(400);
  });

  it('returns 404 for a symbol without data', async () => {
    const get = await start(
      fakeSource({ chart: async () => { throw new MarketDataError('not_found', 'Symbol not found'); } }),
    );
    expect((await get('/api/history?symbol=ZZZZ&window=week')).status).toBe(404);
  });
});
