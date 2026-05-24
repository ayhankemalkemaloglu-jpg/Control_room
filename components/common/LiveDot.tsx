import { cn } from "@/lib/utils";

interface LiveDotProps {
  label?: boolean;
  className?: string;
}

/** Champagne-gold pulse indicator used in each panel corner. */
export function LiveDot({ label = true, className }: LiveDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="live-dot size-1.5 rounded-full bg-gold" />
      {label && (
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Live
        </span>
      )}
    </span>
  );
}
