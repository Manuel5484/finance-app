import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpMarketDataService } from './httpMarketDataService';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('createHttpMarketDataService', () => {
  it('requests quotes and history from the proxy routes', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ quotes: [], failed: [] })).mockResolvedValueOnce(json({ symbol: 'IBM', window: 'week', points: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const service = createHttpMarketDataService();

    await service.getQuotes(['IBM', 'MSFT']);
    await service.getHistory('IBM', 'week');

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/quotes?symbols=IBM%2CMSFT');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/history?symbol=IBM&window=week');
  });

  it('turns the typed error body into a MarketDataError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ code: 'not_found', message: 'Symbol not found', retryable: false }, 404)));
    await expect(createHttpMarketDataService().getHistory('ZZZZ', 'day')).rejects.toMatchObject({
      name: 'MarketDataError',
      code: 'not_found',
      message: 'Symbol not found',
      retryable: false,
    });
  });

  it('reports network failures as retryable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed to fetch')));
    await expect(createHttpMarketDataService().getQuotes(['IBM'])).rejects.toMatchObject({ code: 'network', retryable: true });
  });
});
