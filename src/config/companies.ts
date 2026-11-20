import type { Company } from '../types/market';

/** IBM plus up to four competitors. Add or swap entries here to change the dashboard. */
export const MAX_COMPANIES = 5;

export const COMPANIES: Company[] = [
  { symbol: 'IBM', name: 'IBM', color: '#0f62fe' },
  { symbol: 'MSFT', name: 'Microsoft', color: '#198038' },
  { symbol: 'ORCL', name: 'Oracle', color: '#da1e28' },
  { symbol: 'SAP', name: 'SAP', color: '#8a3ffc' },
  { symbol: 'CRM', name: 'Salesforce', color: '#b28600' },
].slice(0, MAX_COMPANIES);
