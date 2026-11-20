import { createApp } from './app';
import { createMarketService } from './marketService';
import { createYahooSource } from './yahoo/yahooClient';

const port = Number(process.env.PORT ?? 3001);
const app = createApp(createMarketService({ source: createYahooSource() }));

app.listen(port, () => {
  console.log(`Market data API listening on http://localhost:${port}`);
});
