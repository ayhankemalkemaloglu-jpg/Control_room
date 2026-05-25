import type { StatsWindow, TradeStats } from '../types';
import { Panel, Pnl } from './common';
import { cx, num, pct } from '../lib/format';

const WINDOWS: StatsWindow[] = ['24h', '7d', '30d', 'all'];

function WindowSelector({
  value,
  onChange,
}: {
  value: StatsWindow;
  onChange: (w: StatsWindow) => void;
}) {
  return (
    <div className="segmented" role="tablist" aria-label="Zaman aralığı">
      {WINDOWS.map((w) => (
        <button
          key={w}
          role="tab"
          aria-selected={w === value}
          className={cx('segmented__item', w === value && 'is-active')}
          onClick={() => onChange(w)}
        >
          {w}
        </button>
      ))}
    </div>
  );
}

function WinLossBar({ win, loss }: { win: number; loss: number }) {
  const total = win + loss;
  const winPct = total ? (win / total) * 100 : 0;
  const lossPct = total ? (loss / total) * 100 : 0;
  return (
    <div className="wlbar" aria-hidden>
      <div className="wlbar__win" style={{ width: `${winPct}%` }} />
      <div className="wlbar__loss" style={{ width: `${lossPct}%` }} />
      {total === 0 && <div className="wlbar__empty" />}
    </div>
  );
}

function Metric({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="metric">
      <div className="metric__label">{label}</div>
      <div className="metric__value">{children}</div>
      {hint && <div className="metric__hint">{hint}</div>}
    </div>
  );
}

export function StatsPanel({
  stats,
  window,
  onWindow,
}: {
  stats: TradeStats | null;
  window: StatsWindow;
  onWindow: (w: StatsWindow) => void;
}) {
  return (
    <Panel
      title="Performans"
      subtitle="Kapanan işlemler (P&L bilinen)"
      right={<WindowSelector value={window} onChange={onWindow} />}
    >
      {!stats ? (
        <div className="stats__hero">
          <div className="rate rate--win skeleton-text">—</div>
        </div>
      ) : (
        <>
          <div className="stats__hero">
            <div className="rate rate--win">
              <span className="rate__num">{pct(stats.win_rate)}</span>
              <span className="rate__label">Win rate</span>
              <span className="rate__count">{stats.win_count} kazanç</span>
            </div>
            <div className="rate rate--loss">
              <span className="rate__num">{pct(stats.loss_rate)}</span>
              <span className="rate__label">Lose rate</span>
              <span className="rate__count">{stats.loss_count} kayıp</span>
            </div>
          </div>

          <WinLossBar win={stats.win_count} loss={stats.loss_count} />

          <div className="metrics">
            <Metric label="Toplam P&L" hint={`${stats.closed_count} kapandı`}>
              <Pnl value={stats.total_pnl_pct} />
            </Metric>
            <Metric label="Ort. P&L">
              <Pnl value={stats.avg_pnl_pct} />
            </Metric>
            <Metric label="Profit factor" hint="brüt kâr / brüt zarar">
              {stats.profit_factor === null ? '∞' : num(stats.profit_factor)}
            </Metric>
            <Metric label="W/L oranı">
              {stats.win_loss_ratio === null ? '∞' : num(stats.win_loss_ratio)}
            </Metric>
            <Metric label="Açık" hint="şu an">
              {stats.open_count}
            </Metric>
            <Metric label="Toplam işlem">{stats.total_trades}</Metric>
          </div>
        </>
      )}
    </Panel>
  );
}
