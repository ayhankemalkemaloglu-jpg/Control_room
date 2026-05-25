import { useMemo, useState } from 'react';
import { useHermes } from './hooks/useHermes';
import { TopBar } from './components/TopBar';
import { StatsPanel } from './components/StatsPanel';
import { OpenPositions } from './components/OpenPositions';
import { TradeHistory } from './components/TradeHistory';
import { Breakdown } from './components/Breakdown';
import { EventFeed } from './components/EventFeed';
import { Settings } from './components/Settings';

export default function App() {
  const hermes = useHermes();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const totalPnl = useMemo(() => {
    const withPnl = hermes.positions.filter((p) => p.pnl_pct !== null);
    if (withPnl.length === 0) return null;
    return withPnl.reduce((s, p) => s + (p.pnl_pct as number), 0);
  }, [hermes.positions]);

  const showBanner = hermes.conn === 'unauthorized' || hermes.conn === 'disconnected';

  return (
    <div className="app">
      <TopBar
        conn={hermes.conn}
        briefing={hermes.briefing}
        totalPnl={totalPnl}
        onSettings={() => setSettingsOpen(true)}
      />

      {showBanner && (
        <div className={`banner banner--${hermes.conn}`}>
          <span>
            {hermes.conn === 'unauthorized'
              ? 'Yetkisiz: AUTH_TOKEN hatalı veya eksik.'
              : 'Backend’e bağlanılamıyor.'}
            {hermes.error ? ` (${hermes.error})` : ''}
          </span>
          <button className="btn btn--ghost btn--sm" onClick={() => setSettingsOpen(true)}>
            Ayarları aç
          </button>
        </div>
      )}

      <main className="grid">
        <div className="grid__col grid__col--left">
          <StatsPanel stats={hermes.stats} window={hermes.window} onWindow={hermes.setWindow} />
          {hermes.stats && (
            <Breakdown bySymbol={hermes.stats.by_symbol} byStrategy={hermes.stats.by_strategy} />
          )}
        </div>

        <div className="grid__col grid__col--main">
          <OpenPositions positions={hermes.positions} lastTickAt={hermes.lastTickAt} />
          <TradeHistory trades={hermes.history} />
        </div>

        <div className="grid__col grid__col--right">
          <EventFeed events={hermes.events} />
        </div>
      </main>

      {settingsOpen && (
        <Settings onClose={() => setSettingsOpen(false)} onSaved={hermes.reconnect} />
      )}
    </div>
  );
}
