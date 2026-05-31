import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type InkModalProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  panelClassName?: string;
};

export function InkModal({
  eyebrow,
  title,
  description,
  children,
  className,
  panelClassName,
}: InkModalProps) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const style = {
    "--ink-modal-bg": `url("${base}/docs/card-assets/ui/grns-ink-modal-panel-20260531-v2.png")`,
  } as CSSProperties;

  return (
    <div className={cn("ink-modal-overlay", className)}>
      <section
        className={cn("ink-modal-panel", panelClassName)}
        role="dialog"
        aria-modal="true"
        style={style}
      >
        {eyebrow && <p className="ink-modal-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="ink-modal-description">{description}</p>}
        {children && <div className="ink-modal-actions">{children}</div>}
      </section>
    </div>
  );
}
