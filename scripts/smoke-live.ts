import { createMarketService } from '../server/marketService';
import { createYahooSource } from '../server/yahoo/yahooClient';

/** Optional live check against Yahoo. Not part of CI: it needs network access and Yahoo can throttle. */
const symbols = (process.argv[2] ?? 'IBM,MSFT,ORCL,SAP,CRM').split(',');
const service = createMarketService({ source: createYahooSource() });

const { quotes, failed } = await service.getQuotes(symbols);
console.table(quotes.map(({ symbol, price, change, changePercent, currency }) => ({ symbol, price, change, changePercent, currency })));
if (failed.length) console.warn('Failed quotes:', failed);

for (const window of ['day', 'week', 'quarter'] as const) {
  const history = await service.getHistory(symbols[0], window);
  const first = history.points[0];
  const last = history.points[history.points.length - 1];
  console.log(`${symbols[0]} ${window}: ${history.points.length} points, ${first.close} -> ${last.close}`);
}
