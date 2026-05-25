import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket } from '../api/socket';
import { ApiError, getLatestBriefing, getOpenTrades, getRecentTrades, getStats } from '../api/rest';
import type {
  Briefing,
  ConnState,
  LivePosition,
  PnlUpdate,
  StatsWindow,
  Trade,
  TradeStats,
} from '../types';

export interface FeedEvent {
  id: string;
  kind: 'open' | 'close' | 'risk';
  at: string;
  symbol: string;
  text: string;
  tone: 'up' | 'down' | 'warn' | 'neutral';
}

function tradeToPosition(t: Trade): LivePosition {
  return {
    trade_id: t.id,
    symbol: t.symbol,
    side: t.side,
    market: t.market,
    entry_price: t.entry_price,
    entry_price_display: t.entry_price_display,
    current_price: null,
    current_price_display: null,
    pnl_pct: null,
    strategy: t.strategy,
  };
}

export interface HermesState {
  conn: ConnState;
  error: string | null;
  window: StatsWindow;
  setWindow: (w: StatsWindow) => void;
  stats: TradeStats | null;
  positions: LivePosition[];
  history: Trade[];
  briefing: Briefing | null;
  events: FeedEvent[];
  lastTickAt: string | null;
  reconnect: () => void;
}

export function useHermes(): HermesState {
  const [conn, setConn] = useState<ConnState>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [window, setWindow] = useState<StatsWindow>('24h');
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [history, setHistory] = useState<Trade[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [lastTickAt, setLastTickAt] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const windowRef = useRef(window);
  windowRef.current = window;

  const handleError = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      setConn('unauthorized');
      setError('Yetkisiz — AUTH_TOKEN hatalı veya eksik.');
    } else {
      setError((e as Error).message || 'Bağlantı hatası');
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setStats(await getStats(windowRef.current));
    } catch (e) {
      handleError(e);
    }
  }, [handleError]);

  const pushEvent = useCallback((ev: Omit<FeedEvent, 'id'>) => {
    setEvents((prev) => [{ ...ev, id: `${ev.at}-${ev.symbol}-${ev.kind}-${Math.random()}` }, ...prev].slice(0, 40));
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const [s, open, recent, brief] = await Promise.all([
        getStats(windowRef.current),
        getOpenTrades(),
        getRecentTrades(60),
        getLatestBriefing(),
      ]);
      setStats(s);
      setPositions((prev) => {
        // Keep any live prices we've already received for still-open trades.
        const live = new Map(prev.map((p) => [p.trade_id, p]));
        return open.map((t) => live.get(t.id) ?? tradeToPosition(t));
      });
      setHistory(recent);
      setBriefing(brief);
      setError(null);
    } catch (e) {
      handleError(e);
    }
  }, [handleError]);

  // Refetch stats when the window changes.
  useEffect(() => {
    void refreshStats();
  }, [window, refreshStats]);

  // Socket lifecycle. `nonce` lets Settings force a reconnect with new creds.
  useEffect(() => {
    let socket: Socket;
    try {
      socket = connectSocket();
    } catch (e) {
      handleError(e);
      return;
    }
    setConn('connecting');

    socket.on('connect', () => {
      setConn('connected');
      void refreshAll();
    });
    socket.on('connect_error', (err: Error) => {
      setConn(err.message === 'unauthorized' ? 'unauthorized' : 'disconnected');
      setError(err.message === 'unauthorized' ? 'Yetkisiz — AUTH_TOKEN hatalı.' : err.message);
    });
    socket.on('disconnect', () => setConn('disconnected'));

    socket.on('pnl:update', (p: PnlUpdate) => {
      setPositions(p.positions);
      setLastTickAt(p.at);
    });
    socket.on('briefing:new', () => {
      void getLatestBriefing().then(setBriefing).catch(handleError);
    });
    socket.on('trade:open', (t: Trade) => {
      pushEvent({
        kind: 'open',
        at: t.opened_at,
        symbol: t.symbol,
        text: `${t.side} açıldı @ ${t.entry_price_display}`,
        tone: 'neutral',
      });
      void refreshStats();
    });
    socket.on('trade:close', (t: Trade) => {
      setHistory((prev) => [t, ...prev.filter((x) => x.id !== t.id)].slice(0, 80));
      const up = (t.pnl_pct ?? 0) > 0;
      pushEvent({
        kind: 'close',
        at: t.closed_at ?? t.opened_at,
        symbol: t.symbol,
        text:
          t.pnl_pct === null
            ? 'kapandı (fiyat yok)'
            : `kapandı ${up ? '+' : ''}${t.pnl_pct.toFixed(2)}%`,
        tone: t.pnl_pct === null ? 'warn' : up ? 'up' : 'down',
      });
      void refreshStats();
    });
    socket.on('risk:breach', (r: { symbol: string; reason: string }) => {
      pushEvent({
        kind: 'risk',
        at: new Date().toISOString(),
        symbol: r.symbol,
        text: `risk: ${r.reason}`,
        tone: 'warn',
      });
    });
    socket.on('stats:update', () => void refreshStats());

    return () => {
      socket.removeAllListeners();
      socket.close();
    };
  }, [nonce, refreshAll, refreshStats, pushEvent, handleError]);

  const reconnect = useCallback(() => setNonce((n) => n + 1), []);

  return {
    conn,
    error,
    window,
    setWindow,
    stats,
    positions,
    history,
    briefing,
    events,
    lastTickAt,
    reconnect,
  };
}
