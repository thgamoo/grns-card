import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InkButtonProps = Omit<ComponentProps<typeof Button>, "variant" | "size"> & {
  tone?: "ink" | "paper";
  variant?: "primary" | "secondary" | "danger" | "pale";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

type InkButtonStyle = CSSProperties & Record<"--ink-button-bg-default", string>;

const buttonAssets: Record<NonNullable<InkButtonProps["variant"]>, string> = {
  primary: "button-primary.png",
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
        "ink-button",
        `ink-button-${resolvedVariant}`,
        `ink-button-${tone}`,
        `ink-button-${size}`,
        className,
      )}
      size="default"
      style={buttonStyle}
      type="button"
      variant="ghost"
      {...props}
    >
      <span>{children}</span>
    </Button>
  );
}
