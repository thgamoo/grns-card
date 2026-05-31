import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PaperModalProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  panelClassName?: string;
};

type PaperModalStyle = CSSProperties & Record<"--paper-modal-bg", string>;

export function PaperModal({
  eyebrow,
  title,
  description,
  children,
  className,
  panelClassName,
}: PaperModalProps) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const style = {
    "--paper-modal-bg": `url("${base}/docs/card-assets/ui/modals/paper-modal-secondary.png")`,
  } as PaperModalStyle;

  return (
    <div className={cn("paper-modal-overlay", className)}>
      <section
        className={cn("paper-modal-panel", panelClassName)}
        role="dialog"
        aria-modal="true"
        style={style}
      >
        {eyebrow && <p className="paper-modal-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="paper-modal-description">{description}</p>}
        {children && <div className="paper-modal-actions">{children}</div>}
      </section>
    </div>
  );
}
