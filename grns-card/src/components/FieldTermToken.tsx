import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type FieldTermTokenProps = {
  children: ReactNode;
  note: string;
  onNavigateField?: () => void;
};

function isTouchTooltipMode() {
  return (
    window.innerWidth <= 760 ||
    window.matchMedia("(hover: none), (pointer: coarse)").matches
  );
}

export function FieldTermToken({
  children,
  note,
  onNavigateField,
}: FieldTermTokenProps) {
  const tokenRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);

  const alignTooltip = () => {
    window.requestAnimationFrame(() => {
      const tooltip = tokenRef.current?.querySelector(".field-term-tooltip");
      if (!tooltip) return;

      const margin = 12;
      const rect = tooltip.getBoundingClientRect();
      let nextShift = 0;

      if (rect.left < margin) {
        nextShift = margin - rect.left;
      } else if (rect.right > window.innerWidth - margin) {
        nextShift = window.innerWidth - margin - rect.right;
      }

      setShift(nextShift);
    });
  };

  return (
    <button
      ref={tokenRef}
      className="field-term-token"
      type="button"
      title={note}
      data-open={open ? "true" : undefined}
      style={{ "--tooltip-shift": `${shift}px` } as CSSProperties}
      onBlur={() => setOpen(false)}
      onClick={(event) => {
        if (isTouchTooltipMode()) {
          event.preventDefault();
          setOpen((current) => !current);
          alignTooltip();
          return;
        }

        onNavigateField?.();
      }}
      onFocus={alignTooltip}
      onMouseEnter={alignTooltip}
    >
      <strong>{children}</strong>
      <span className="field-term-tooltip" role="tooltip">
        {note}
      </span>
    </button>
  );
}
