import type { Briefing, ConnState } from '../types';
import { cx, num, relativeTime, signedPct } from '../lib/format';

const CONN_LABEL: Record<ConnState, string> = {
  connecting: 'Bağlanıyor',
  connected: 'Canlı',
  disconnected: 'Bağlantı yok',
  unauthorized: 'Yetkisiz',
};

export function TopBar({
  conn,
  briefing,
  totalPnl,
  onSettings,
}: {
  conn: ConnState;
  briefing: Briefing | null;
  totalPnl: number | null;
  onSettings: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__mark">⊹</span>
        <div>
          <h1 className="topbar__title">HERMES</h1>
          <span className="topbar__sub">Command Center</span>
        </div>
      </div>

      <div className="topbar__market">
        {briefing ? (
          <>
            <Chip label="Genel" value={briefing.overall ?? '—'} />
            <Chip label="Lider" value={briefing.leader ?? '—'} />
            <Chip label="Kripto aggr" value={num(briefing.crypto_aggr)} />
            <Chip label="Hisse aggr" value={num(briefing.stock_aggr)} />
            <span className="topbar__brief-time">{relativeTime(briefing.timestamp)}</span>
          </>
        ) : (
          <span className="muted">Briefing bekleniyor…</span>
        )}
      </div>

      <div className="topbar__right">
        {totalPnl !== null && (
          <div className="topbar__pnl">
            <span className="muted">Açık P&L</span>
            <strong className={cx('pnl', totalPnl > 0 ? 'pnl--up' : totalPnl < 0 ? 'pnl--down' : 'pnl--flat')}>
              {signedPct(totalPnl)}
            </strong>
          </div>
        )}
        <span className={cx('conn', `conn--${conn}`)}>
          <span className="conn__dot" />
          {CONN_LABEL[conn]}
        </span>
        <button className="btn btn--icon" onClick={onSettings} aria-label="Ayarlar" title="Ayarlar">
          ⚙
        </button>
      </div>
    </header>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="chip">
      <span className="chip__label">{label}</span>
      <span className="chip__value">{value}</span>
    </span>
  );
}
