import { Badge } from "@/components/ui/badge";
import { sentimentLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Sentiment } from "@/types/hermes";

const STYLES: Record<Sentiment, string> = {
  bullish: "border-bullish/30 text-bullish",
  bearish: "border-bearish/30 text-bearish",
  neutral: "border-border text-neutral",
};

interface SentimentPillProps {
  sentiment: Sentiment;
  score?: number;
  className?: string;
}

export function SentimentPill({
  sentiment,
  score,
  className,
}: SentimentPillProps) {
  return (
    <Badge variant="outline" className={cn(STYLES[sentiment], className)}>
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: "currentColor" }}
      />
      {sentimentLabel(sentiment)}
      {typeof score === "number" && (
        <span className="font-mono text-[10px] opacity-70 tabular">
          {score > 0 ? `+${score}` : score}
        </span>
      )}
    </Badge>
  );
}
