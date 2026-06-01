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
    <div
      className={cn(
        "absolute inset-0 z-[12] grid place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(196,223,238,0.14),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.72),rgba(0,0,0,0.62))] p-[18px] backdrop-blur-[3px] backdrop-saturate-90",
        className,
      )}
    >
      <section
        className={cn(
          "relative isolate grid min-h-[clamp(292px,38vw,360px)] w-[min(640px,calc(100vw-32px))] translate-y-[-1px] content-center gap-[clamp(10px,1.8vw,16px)] overflow-visible border-0 bg-[image:var(--ink-modal-bg)] bg-[length:100%_100%] bg-center bg-no-repeat px-[clamp(58px,8vw,92px)] py-[clamp(54px,7vw,76px)] pb-[clamp(50px,6vw,70px)] text-center text-[#11100e] drop-shadow-[0_28px_58px_rgba(0,0,0,0.48)]",
          panelClassName,
        )}
        role="dialog"
        aria-modal="true"
        style={style}
      >
        {eyebrow && (
          <p className="relative z-[1] m-[2px_0_0] text-xs font-black uppercase tracking-[0.08em] text-[rgba(17,16,14,0.7)]">
            {eyebrow}
          </p>
        )}
        <h2 className="relative z-[1] m-0 font-['Gowun_Batang'] text-[clamp(2.35rem,5vw,4.05rem)] font-black leading-[1.04] tracking-normal [text-shadow:0_1px_0_rgba(255,255,255,0.62)]">
          {title}
        </h2>
        {description && (
          <p className="relative z-[1] m-0 text-[clamp(1rem,2vw,1.28rem)] font-[850] leading-normal text-[rgba(17,16,14,0.75)]">
            {description}
          </p>
        )}
        {children && <div className="z-[1] flex justify-center">{children}</div>}
      </section>
    </div>
  );
}
