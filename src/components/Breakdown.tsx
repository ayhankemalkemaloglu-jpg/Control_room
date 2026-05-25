import { useState } from 'react';
import type { GroupStat } from '../types';
import { Empty, Panel, Pnl } from './common';
import { cx, pct } from '../lib/format';

function MiniBar({ win, loss }: { win: number; loss: number }) {
  const total = win + loss;
  const w = total ? (win / total) * 100 : 0;
  return (
    <div className="minibar" title={`${win}W / ${loss}L`}>
      <div className="minibar__win" style={{ width: `${w}%` }} />
    </div>
  );
}

function GroupTable({ rows }: { rows: GroupStat[] }) {
  const withClosed = rows.filter((r) => r.closed_count > 0);
  if (withClosed.length === 0) return <Empty>Kapanan işlem yok.</Empty>;
  return (
    <div className="table-wrap">
      <table className="table table--compact">
        <thead>
          <tr>
            <th>Anahtar</th>
            <th className="num">W/L</th>
            <th>Dağılım</th>
            <th className="num">Win</th>
            <th className="num">Lose</th>
            <th className="num">P&L</th>
          </tr>
        </thead>
        <tbody>
          {withClosed.map((r) => (
            <tr key={r.key}>
              <td className="sym__name">{r.key}</td>
              <td className="num mono muted">
                {r.win_count}/{r.loss_count}
              </td>
              <td className="bar-cell">
                <MiniBar win={r.win_count} loss={r.loss_count} />
              </td>
              <td className="num pnl--up">{pct(r.win_rate)}</td>
              <td className="num pnl--down">{pct(r.loss_rate)}</td>
              <td className="num">
                <Pnl value={r.total_pnl_pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Breakdown({
  bySymbol,
  byStrategy,
}: {
  bySymbol: GroupStat[];
  byStrategy: GroupStat[];
}) {
  const [tab, setTab] = useState<'strategy' | 'symbol'>('strategy');
  return (
    <Panel
      title="Kırılım"
      right={
        <div className="segmented">
          <button
            className={cx('segmented__item', tab === 'strategy' && 'is-active')}
            onClick={() => setTab('strategy')}
          >
            Strateji
          </button>
          <button
            className={cx('segmented__item', tab === 'symbol' && 'is-active')}
            onClick={() => setTab('symbol')}
          >
            Sembol
          </button>
        </div>
      }
    >
      <GroupTable rows={tab === 'strategy' ? byStrategy : bySymbol} />
    </Panel>
  );
}
