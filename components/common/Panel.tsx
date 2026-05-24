import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LiveDot } from "./LiveDot";

interface PanelProps {
  title: string;
  eyebrow?: string;
  live?: boolean;
  headerRight?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Glass-morphism surface with a titled header and a LIVE indicator. */
export function Panel({
  title,
  eyebrow,
  live = true,
  headerRight,
  className,
  bodyClassName,
  children,
}: PanelProps) {
  return (
    <section
      className={cn(
        "glass flex flex-col overflow-hidden rounded-[12px] border border-border",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-0.5">
          {eyebrow && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </span>
          )}
          <h2 className="font-display text-sm font-medium text-foreground">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {headerRight}
          {live && <LiveDot />}
        </div>
      </header>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
