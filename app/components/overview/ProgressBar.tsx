import type { BudgetStatus } from '@/lib/statusColor';
import { FILL_CLASS } from './format';

type Props = {
  ratio: number;
  status: BudgetStatus | 'debt';
  // Fraction of the month elapsed (0-1); draws a tick where an even pace would be.
  pace?: number | null;
  size?: 'sm' | 'md';
  intro?: boolean;
  className?: string;
};

export function ProgressBar({ ratio, status, pace = null, size = 'md', intro = false, className = '' }: Props) {
  const fill = status === 'debt' ? 'bg-gradient-to-r from-accent-strong to-status-debt-bar shadow-glow-accent' : FILL_CLASS[status];
  return (
    <span
      aria-hidden="true"
      className={`relative block rounded-full bg-panel-track ${size === 'sm' ? 'h-2' : 'h-3'} ${className}`}
    >
      <span
        className={`absolute inset-y-0 left-0 rounded-full ${fill} ${intro ? 'grow-x' : ''}`}
        style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }}
      />
      {pace != null && (
        <i className="absolute -inset-y-1 -ml-px w-0.5 rounded bg-panel-ink" style={{ left: `${pace * 100}%` }} />
      )}
    </span>
  );
}
