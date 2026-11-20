import type { WindowId } from '../types/market';

export interface TimeWindowConfig {
  id: WindowId;
  label: string;
  title: string;
}

export const TIME_WINDOWS: TimeWindowConfig[] = [
  { id: 'day', label: 'Current day', title: 'Today: % change since open' },
  { id: 'week', label: 'Last 7 days', title: '7-day trend: % change' },
  { id: 'quarter', label: 'Last quarter', title: 'Quarter trend: % change' },
];

export const DEFAULT_WINDOW: WindowId = 'day';
