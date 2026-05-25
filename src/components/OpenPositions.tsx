import type { LivePosition } from '../types';
import { Empty, MarketBadge, Panel, Pnl, SideBadge } from './common';
import { relativeTime } from '../lib/format';

export function OpenPositions({
  positions,
  lastTickAt,
}: {
  positions: LivePosition[];
  lastTickAt: string | null;
}) {
  const crypto = positions.filter((p) => p.market === 'CRYPTO').length;
  const bist = positions.filter((p) => p.market === 'BIST').length;

  return (
    <Panel
      title="Açık Pozisyonlar"
      subtitle={`${crypto} kripto · ${bist} BIST`}
      right={<span className="muted tick">son fiyat: {relativeTime(lastTickAt)}</span>}
    >
      {positions.length === 0 ? (
        <Empty>Açık pozisyon yok.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sembol</th>
                <th>Yön</th>
                <th className="num">Giriş</th>
                <th className="num">Güncel</th>
                <th className="num">P&L</th>
                <th>Strateji</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.trade_id}>
                  <td>
                    <div className="sym">
                      <MarketBadge market={p.market} />
                      <span className="sym__name">{p.symbol}</span>
                    </div>
                  </td>
                  <td>
                    <SideBadge side={p.side} />
                  </td>
                  <td className="num mono">{p.entry_price_display}</td>
                  <td className="num mono">
                    {p.current_price_display ?? <span className="muted">—</span>}
                  </td>
                  <td className="num">
                    {p.pnl_pct === null ? <span className="muted">bekliyor</span> : <Pnl value={p.pnl_pct} />}
                  </td>
                  <td className="muted strat">{p.strategy ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
