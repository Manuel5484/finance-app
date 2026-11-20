import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { MarketDataError } from '../src/types/market';
import type { ErrorCode } from '../src/types/market';
import type { MarketService } from './marketService';
import { parseSymbol, parseSymbols, parseWindow } from './validation';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  invalid_symbol: 400,
  not_found: 404,
  upstream: 502,
  network: 504,
};

const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof MarketDataError) {
    res.status(STATUS_BY_CODE[error.code]).json({ code: error.code, message: error.message, retryable: error.retryable });
    return;
  }
  console.error(error);
  res.status(500).json({ code: 'upstream', message: 'Unexpected server error', retryable: false });
};

export function createApp(service: MarketService) {
  const app = express();

  // Express 5 forwards rejected promises from async handlers to the error handler.
  app.get('/api/quotes', async (req, res) => {
    res.json(await service.getQuotes(parseSymbols(req.query.symbols)));
  });

  app.get('/api/history', async (req, res) => {
    res.json(await service.getHistory(parseSymbol(req.query.symbol), parseWindow(req.query.window)));
  });

  app.use(errorHandler);
  return app;
}
