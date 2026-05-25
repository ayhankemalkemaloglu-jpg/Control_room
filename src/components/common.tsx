import type { ReactNode } from 'react';
import type { Market } from '../types';
import { cx, signedPct } from '../lib/format';

export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('panel', className)}>
      {(title || right) && (
        <header className="panel__head">
          <div>
            {title && <h2 className="panel__title">{title}</h2>}
            {subtitle && <p className="panel__subtitle">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function MarketBadge({ market }: { market: Market }) {
  return (
    <span className={cx('badge', market === 'BIST' ? 'badge--bist' : 'badge--crypto')}>
      {market}
    </span>
  );
}

export function SideBadge({ side }: { side: string }) {
  const long = side.toUpperCase() === 'LONG';
  return (
    <span className={cx('side', long ? 'side--long' : 'side--short')}>{side.toUpperCase()}</span>
  );
}

/** Colored P&L percentage. `value` is already in percent units. */
export function Pnl({ value, className }: { value: number | null | undefined; className?: string }) {
  const tone =
    value === null || value === undefined || value === 0 ? 'flat' : value > 0 ? 'up' : 'down';
  return <span className={cx('pnl', `pnl--${tone}`, className)}>{signedPct(value)}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
