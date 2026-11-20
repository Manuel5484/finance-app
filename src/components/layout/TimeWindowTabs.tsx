import { TIME_WINDOWS } from '../../config/timeWindows';
import type { WindowId } from '../../types/market';

interface TimeWindowTabsProps {
  value: WindowId;
  onChange: (window: WindowId) => void;
}

export function TimeWindowTabs({ value, onChange }: TimeWindowTabsProps) {
  return (
    <div role="tablist" aria-label="Time window" className="tabs">
      {TIME_WINDOWS.map((w) => (
        <button
          key={w.id}
          type="button"
          role="tab"
          aria-selected={value === w.id}
          className={value === w.id ? 'tab tab--active' : 'tab'}
          onClick={() => onChange(w.id)}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
