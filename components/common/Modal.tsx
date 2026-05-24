"use client";

import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Lightweight centered overlay with backdrop + Esc/click-out to close. */
export function Modal({ open, onClose, title, className, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "glass relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[12px] border border-border",
          className,
        )}
      >
        {title && (
          <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="min-w-0">{title}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="rounded px-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              ✕
            </button>
          </header>
        )}
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
