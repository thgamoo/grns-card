import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaperButtonProps = Omit<ComponentProps<typeof Button>, "variant"> & {
  children: ReactNode;
  contentClassName?: string;
  variant?: "secondary" | "ghost" | "primary" | "destructive";
};

type PaperButtonStyle = CSSProperties &
  Record<"--button-bg-image" | "--button-bg-filter", string>;

const buttonAssets = {
  destructive: "button-destructive.png",
  ghost: "button-secondary.png",
  primary: "button-primary.png",
  secondary: "button-secondary.png",
};

export function PaperButton({
  className,
  contentClassName,
  children,
  style,
  type = "button",
  variant = "secondary",
  ...props
}: PaperButtonProps) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const assetPath = `${base}/docs/card-assets/ui/buttons/${buttonAssets[variant]}`;
  const buttonStyle = {
    "--button-bg-image": `url("${assetPath}")`,
    "--button-bg-filter":
      variant === "ghost"
        ? "invert(1) opacity(0.46) saturate(0.72) contrast(0.96)"
        : "none",
    ...(style as CSSProperties | undefined),
  } as PaperButtonStyle;

  return (
    <Button
      className={cn(
        "paper-button relative isolate inline-flex h-[var(--paper-button-height,52px)] min-h-0 min-w-0 items-center justify-center border-0 bg-transparent px-[var(--paper-button-padding-x,28px)] text-center text-[clamp(0.82rem,1.4vw,0.98rem)] font-black leading-none text-[#15130f] drop-shadow-[0_12px_18px_rgba(30,26,18,0.18)] transition-[filter,transform] duration-150 ease-out before:pointer-events-none before:absolute before:-inset-y-[9px] before:-inset-x-[14px] before:z-[-1] before:bg-[image:var(--button-bg-image)] before:bg-[length:100%_100%] before:bg-center before:bg-no-repeat before:[filter:var(--button-bg-filter)] before:content-[''] hover:-translate-y-px hover:drop-shadow-[0_14px_22px_rgba(30,26,18,0.22)] focus-visible:-translate-y-px focus-visible:drop-shadow-[0_14px_22px_rgba(30,26,18,0.22)] focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[rgba(17,17,17,0.72)] active:translate-y-px max-[760px]:h-12 max-[760px]:px-6",
        variant === "ghost" && "text-[#fff8ea] drop-shadow-[0_10px_16px_rgba(0,0,0,0.2)]",
        className,
      )}
      variant="unstyled"
      style={buttonStyle}
      type={type}
      {...props}
    >
      <span className={cn("relative inline-flex items-center justify-center whitespace-nowrap", contentClassName)}>
        {children}
      </span>
    </Button>
  );
}
