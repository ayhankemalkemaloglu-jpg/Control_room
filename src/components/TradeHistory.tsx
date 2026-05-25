import type { Trade } from '../types';
import { Empty, MarketBadge, Panel, Pnl, SideBadge } from './common';
import { holdLabel, relativeTime } from '../lib/format';

export function TradeHistory({ trades }: { trades: Trade[] }) {
  const closed = trades.filter((t) => t.status === 'CLOSED' || t.status === 'CLOSED_NO_EXIT');

  return (
    <Panel title="İşlem Geçmişi" subtitle="Son kapanan işlemler">
      {closed.length === 0 ? (
        <Empty>Henüz kapanan işlem yok.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sembol</th>
                <th>Yön</th>
                <th className="num">Giriş</th>
                <th className="num">Çıkış</th>
                <th className="num">P&L</th>
                <th className="num">Süre</th>
                <th className="num">Kapandı</th>
              </tr>
            </thead>
            <tbody>
              {closed.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="sym">
                      <MarketBadge market={t.market} />
                      <span className="sym__name">{t.symbol}</span>
                    </div>
                  </td>
                  <td>
                    <SideBadge side={t.side} />
                  </td>
                  <td className="num mono">{t.entry_price_display}</td>
                  <td className="num mono">
                    {t.exit_price_display ?? <span className="muted">—</span>}
                  </td>
                  <td className="num">
                    {t.pnl_pct === null ? (
                      <span className="muted">fiyat yok</span>
                    ) : (
                      <Pnl value={t.pnl_pct} />
                    )}
                  </td>
                  <td className="num muted mono">{holdLabel(t.hold_minutes)}</td>
                  <td className="num muted">{relativeTime(t.closed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
