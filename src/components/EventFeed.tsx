import type { FeedEvent } from '../hooks/useHermes';
import { Empty, Panel } from './common';
import { cx, relativeTime } from '../lib/format';

const DOT: Record<FeedEvent['tone'], string> = {
  up: '▲',
  down: '▼',
  warn: '!',
  neutral: '•',
};

export function EventFeed({ events }: { events: FeedEvent[] }) {
  return (
    <Panel title="Canlı Akış" subtitle="Açılış / kapanış / risk">
      {events.length === 0 ? (
        <Empty>Olay bekleniyor…</Empty>
      ) : (
        <ul className="feed">
          {events.map((e) => (
            <li key={e.id} className={cx('feed__item', `feed__item--${e.tone}`)}>
              <span className="feed__dot">{DOT[e.tone]}</span>
              <span className="feed__sym">{e.symbol}</span>
              <span className="feed__text">{e.text}</span>
              <span className="feed__time">{relativeTime(e.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
