import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { createDefaultService } from './services';
import type { MarketDataService } from './services';

export default function App({ service }: { service?: MarketDataService }) {
  const [defaultService] = useState(createDefaultService);
  return (
    <AppShell>
      <DashboardPage service={service ?? defaultService} />
    </AppShell>
  );
}
