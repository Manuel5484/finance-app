import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <header className="app__header">
        <h1>Market Dashboard</h1>
        <p className="muted">IBM vs. competitors</p>
      </header>
      <main>{children}</main>
    </div>
  );
}
