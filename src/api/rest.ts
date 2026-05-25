import { getApiBase, getAuthToken } from '../config';
import type { Briefing, Health, StatsWindow, Trade, TradeStats } from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getJson<T>(path: string, auth = true): Promise<T> {
  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = `Bearer ${getAuthToken()}`;

  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, { headers });
  } catch (err) {
    throw new ApiError((err as Error).message || 'network error', 0);
  }
  if (res.status === 401) throw new ApiError('unauthorized', 401);
  if (!res.ok) throw new ApiError(`request failed (${res.status})`, res.status);
  return (await res.json()) as T;
}

export function getHealth(): Promise<Health> {
  return getJson<Health>('/health', false);
}

export async function getStats(window: StatsWindow): Promise<TradeStats> {
  const data = await getJson<{ ok: boolean; stats: TradeStats }>(`/trades/stats?window=${window}`);
  return data.stats;
}

export async function getOpenTrades(): Promise<Trade[]> {
  const data = await getJson<{ ok: boolean; trades: Trade[] }>('/trades?status=OPEN&limit=200');
  return data.trades;
}

export async function getRecentTrades(limit = 50): Promise<Trade[]> {
  const data = await getJson<{ ok: boolean; trades: Trade[] }>(`/trades?limit=${limit}`);
  return data.trades;
}

export async function getLatestBriefing(): Promise<Briefing | null> {
  const data = await getJson<{ ok: boolean; briefings: Briefing[] }>('/briefings?limit=1');
  return data.briefings[0] ?? null;
}
