import type { ReactNode } from "react";

import { InkModal } from "@/components/InkModal";
import { PaperModal } from "@/components/PaperModal";
import { cn } from "@/lib/utils";

type TutorialModalProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  panelClassName?: string;
  compact?: boolean;
};

export function TutorialModal({
  eyebrow,
  title,
  description,
  children,
  className,
  panelClassName,
  compact = false,
}: TutorialModalProps) {
  if (compact) {
    return (
      <PaperModal
        className={className}
        panelClassName={cn(
          "w-[min(430px,calc(100vw-32px))] min-h-[clamp(218px,30vw,272px)] gap-2.5 px-[clamp(46px,6vw,66px)] py-[clamp(40px,5vw,56px)] [&>h2]:text-[clamp(1.7rem,3.5vw,2.65rem)] [&_.paper-modal-description]:text-[clamp(0.9rem,1.55vw,1.05rem)]",
          panelClassName,
        )}
        eyebrow={eyebrow}
        title={title}
        description={description}
      >
        {children}
      </PaperModal>
    );
  }

  return (
    <InkModal
      className={className}
      panelClassName={cn("tutorial-ink-modal", panelClassName)}
      eyebrow={eyebrow}
      title={title}
      description={description}
    >
      {children}
    </InkModal>
  );
}
