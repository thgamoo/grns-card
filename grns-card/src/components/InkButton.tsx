import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InkButtonProps = Omit<ComponentProps<typeof Button>, "variant" | "size"> & {
  tone?: "ink" | "paper";
  variant?: "primary" | "selected" | "secondary" | "danger" | "pale";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

type InkButtonStyle = CSSProperties & Record<"--ink-button-bg-default", string>;

const sizeClassName: Record<NonNullable<InkButtonProps["size"]>, string> = {
  sm: "h-9 px-5",
  md: "h-[52px] px-7",
  lg: "h-16 px-9",
};

const buttonAssets: Record<NonNullable<InkButtonProps["variant"]>, string> = {
  primary: "button-primary.png",
  selected: "button-primary-selected.png",
  secondary: "button-secondary.png",
  danger: "button-destructive.png",
  pale: "button-ghost.png",
};

export function InkButton({
  className,
  tone = "ink",
  variant,
  size = "md",
  children,
  style,
  ...props
}: InkButtonProps) {
  const resolvedVariant = variant ?? (tone === "paper" ? "secondary" : "primary");
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const assetPath = `${base}/docs/card-assets/ui/buttons`;
  const buttonStyle = {
    "--ink-button-bg-default": `url("${assetPath}/${buttonAssets[resolvedVariant]}")`,
    ...(style as CSSProperties | undefined),
  } as InkButtonStyle;

  return (
    <Button
      className={cn(
        "group relative isolate inline-grid min-h-0 min-w-0 w-[var(--ink-button-width,auto)] shrink-0 select-none place-items-center rounded border border-transparent bg-transparent text-center font-black leading-none whitespace-nowrap text-[#f8f1df] outline-none transition-[filter,transform] duration-150 hover:-translate-y-px hover:bg-transparent hover:text-[#f8f1df] focus-visible:-translate-y-px focus-visible:bg-transparent focus-visible:text-[#f8f1df] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(246,228,168,0.85)] active:translate-y-px aria-expanded:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-[rgba(255,250,238,0.56)] disabled:opacity-50",
        sizeClassName[size],
        className,
      )}
      size="default"
      style={buttonStyle}
      type="button"
      variant="unstyled"
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-x-[-14px] inset-y-[-9px] -z-[1] bg-[image:var(--ink-button-bg-default)] bg-[length:100%_100%] bg-center bg-no-repeat transition-[filter,opacity,transform] duration-150 [filter:saturate(0.92)_contrast(1.08)] group-hover:scale-[1.018] group-hover:[filter:saturate(1.05)_contrast(1.16)_brightness(1.05)] group-focus-visible:scale-[1.018] group-focus-visible:[filter:saturate(1.05)_contrast(1.16)_brightness(1.05)] group-active:scale-[0.992] group-active:[filter:saturate(0.86)_contrast(1.2)_brightness(0.88)] group-disabled:opacity-55 group-disabled:[filter:saturate(0.1)_contrast(0.8)_brightness(1.38)]"
        aria-hidden="true"
      />
      <span className="relative inline-flex min-w-0 items-center justify-center whitespace-nowrap text-[clamp(0.82rem,1.4vw,0.98rem)] text-inherit [text-shadow:0_1px_1px_rgba(0,0,0,0.7)]">
        {children}
      </span>
    </Button>
  );
}
