import { Streamdown } from "streamdown";
import type { ReactNode } from "react";
import { FieldTermToken } from "./FieldTermToken";

type RichTextProps = {
  text: string;
  className?: string;
  termNotes?: Record<string, string>;
  navigableTermNotes?: Record<string, string>;
  ruleTermNotes?: Record<string, string>;
  combatConceptNotes?: Record<string, string>;
  onFieldTermClick?: () => void;
  onRuleTermClick?: (term: string) => void;
};

function toMarkdownishText(text: string) {
  return text
    .replace(/\\n/g, "\n")
    .replace(/<([^>\n]+)>/g, "**\\<$1\\>**")
    .replace(/\[([^\]\n]+)\]/g, "**[$1]**")
    .replace(/\r?\n/g, "  \n");
}

function plainText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(plainText).join("");
  }

  return "";
}

export function RichText({
  text,
  className,
  termNotes,
  navigableTermNotes,
  ruleTermNotes,
  combatConceptNotes,
  onFieldTermClick,
  onRuleTermClick,
}: RichTextProps) {
  return (
    <div className={className}>
      <Streamdown
        animated={false}
        components={{
          strong: ({ children }) => {
            const label = plainText(children);
            const term = label.match(/^<(.+)>$/)?.[1];
            const note = term ? termNotes?.[term] : undefined;
            const canNavigate = Boolean(term && navigableTermNotes?.[term]);
            const canNavigateRule = Boolean(
              term && (ruleTermNotes?.[term] || combatConceptNotes?.[term]),
            );

            if (term && note) {
              return (
                <FieldTermToken
                  note={note}
                  onNavigateField={
                    canNavigate
                      ? onFieldTermClick
                      : canNavigateRule
                        ? () => onRuleTermClick?.(term)
                        : undefined
                  }
                >
                  {children}
                </FieldTermToken>
              );
            }

            return <strong>{children}</strong>;
          },
        }}
        mode="static"
      >
        {toMarkdownishText(text)}
      </Streamdown>
    </div>
  );
}
