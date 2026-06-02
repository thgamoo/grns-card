import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PaperModalProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  childrenClassName?: string;
  panelClassName?: string;
};

type PaperModalStyle = CSSProperties & Record<"--paper-modal-bg", string>;

export function PaperModal({
  eyebrow,
  title,
  description,
  children,
  className,
  childrenClassName,
  panelClassName,
}: PaperModalProps) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const style = {
    "--paper-modal-bg": `url("${base}/docs/card-assets/ui/modals/paper-modal-secondary.png")`,
  } as PaperModalStyle;

  return (
    <div
      className={cn(
        "absolute inset-0 z-[12] grid place-items-center bg-[rgba(17,17,17,0.46)] p-5 backdrop-blur-[1.5px]",
        className,
      )}
    >
      <section
        className={cn(
          "relative isolate grid min-h-0 w-[min(520px,calc(100vw-32px))] content-center gap-3 border-0 bg-[image:var(--paper-modal-bg)] bg-[length:100%_100%] bg-center bg-no-repeat px-[clamp(48px,7vw,74px)] py-[clamp(42px,6vw,62px)] text-center text-[#14110d] drop-shadow-[0_20px_46px_rgba(0,0,0,0.34)]",
          panelClassName,
        )}
        role="dialog"
        aria-modal="true"
        style={style}
      >
        {eyebrow && (
          <p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[rgba(20,17,13,0.58)]">
            {eyebrow}
          </p>
        )}
        <h2 className="m-0 font-['Gowun_Batang'] text-[clamp(1.9rem,4vw,2.85rem)] font-black leading-[1.08]">
          {title}
        </h2>
        {description && (
          <p className="mx-auto my-0 max-w-[34rem] break-keep text-[clamp(0.95rem,1.6vw,1.08rem)] font-extrabold leading-[1.55] text-[rgba(20,17,13,0.78)]">
            {description}
          </p>
        )}
        {children && (
          <div className={cn("mt-1 flex justify-center", childrenClassName)}>
            {children}
          </div>
        )}
      </section>
    </div>
  );
}
