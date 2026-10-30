// Shared building blocks for the secondary pages, so they carry the same
// Family-Hub-style navy glass look as the Overview (tokens live in globals.css).

export const PAGE = 'mx-auto w-full max-w-[1180px] px-4 pb-10 pt-[18px] md:px-8 md:pb-16 md:pt-7';
export const PANEL = 'glass rounded-2xl p-5 md:p-6';
export const INPUT =
  'rounded-xl border border-panel-line bg-panel-surface2 px-3 py-2 text-sm text-panel-ink placeholder:text-panel-faint focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-accent-soft';
export const LABEL = 'flex flex-col gap-1.5 text-[13px] font-medium text-panel-inkMuted';
export const BTN_PRIMARY = 'btn-glow rounded-xl px-4 py-2 text-sm font-semibold transition-[filter] hover:brightness-110';
export const BTN_GHOST =
  'rounded-xl border border-panel-line px-4 py-2 text-sm font-semibold text-panel-inkMuted transition-colors hover:bg-panel-tint hover:text-panel-ink';
export const ERROR_TEXT = 'text-sm text-status-over-ink';

type Props = {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode; // right-hand slot (e.g. the month selector)
};

export function PageHeader({ title, subtitle, children }: Props) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[clamp(1.6rem,4.6vw,2.15rem)] font-semibold leading-[1.15] tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="mt-2 max-w-[62ch] text-base text-panel-inkMuted text-pretty">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
