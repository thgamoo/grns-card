import { type ReactNode } from "react";
import { BookOpenText, Gamepad2, Map } from "lucide-react";
import { MissingCallout } from "../components/MissingCallout";
import { RichText } from "../components/RichText";
import { cn } from "../lib/utils";
import {
  keywordHighlightLabel,
  keywordHighlightStyle,
} from "../content/keywordHighlights";
import {
  battleCases,
  cardPartTerms,
  combatConceptId,
  combatConceptNotes,
  combatConcepts,
  keywordRules,
  phases,
  ruleTermNotes,
  ruleTermId,
  ruleTerms,
  ruleCopy,
  warPrepSections,
} from "../content/rules";
import { fieldTermNotes } from "../content/field";

type RulesPageProps = {
  rulebook: ReactNode;
  sampleCard: ReactNode;
  showRulebook: boolean;
  onSelectKeyword: (keyword: string) => void;
  onSelectRuleTerm: (term: string) => void;
  onToggleRulebook: () => void;
  onNavigateField: () => void;
  onNavigateTutorial: () => void;
  renderInlineText: (text: string) => ReactNode;
};

const rulesViewClassName =
  "grid gap-[clamp(14px,2.6vw,28px)] overflow-auto bg-transparent p-[clamp(16px,4vw,54px)] text-[var(--ink)] max-[760px]:p-3.5 max-[400px]:p-2.5 max-[400px]:[&_h2]:text-[1.7rem] max-[400px]:[&_h2]:leading-[1.12] max-[400px]:[&_h3]:text-[1.05rem] max-[400px]:[&_h3]:leading-[1.24] [&_strong]:font-black";
const rulesSectionClassName =
  "relative overflow-hidden rounded-lg border border-[rgba(20,18,15,0.22)] bg-[rgba(255,253,247,0.68)] p-[clamp(24px,5vw,64px)] shadow-[0_18px_48px_rgba(35,30,20,0.09)] backdrop-blur-lg max-[760px]:px-3.5 max-[760px]:py-[22px] max-[400px]:px-[11px] max-[400px]:py-[18px]";
const rulesHeroClassName =
  "grid min-h-[min(620px,calc(100svh-136px))] content-center gap-[18px] border-transparent bg-transparent !p-0 shadow-none backdrop-blur-none isolate max-[400px]:gap-3 [&>*]:relative [&>*]:z-[3] [&>*]:max-w-[760px]";
const sectionHeadClassName = "mb-4 grid gap-1 max-[400px]:mb-2.5 max-[400px]:gap-0.5";
const sectionIntroClassName =
  "mt-4 max-w-[880px] break-keep text-[clamp(1.02rem,1.45vw,1.14rem)] italic leading-[1.68] text-[#2f2b26] max-[400px]:mt-2.5 max-[400px]:text-[0.92rem] max-[400px]:leading-[1.55] [&_p]:mb-[0.9rem] [&_p]:mt-0 [&_p:last-child]:mb-0 max-[400px]:[&_p]:mb-[0.58rem]";
const ruleSectionIntroClassName = cn(sectionIntroClassName, "mb-6 max-[400px]:mb-4");
const linkGridClassName =
  "mt-4 grid grid-cols-[repeat(2,minmax(0,17.5rem))] gap-5 max-[760px]:grid-cols-1 max-[400px]:gap-2";
const glassButtonClassName =
  "inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-lg border border-[rgba(20,18,15,0.32)] bg-[rgba(255,253,247,0.34)] px-4 text-[var(--ink)] no-underline shadow-[0_14px_34px_rgba(30,26,18,0.12)] backdrop-blur-[10px] text-[0.94rem] font-black hover:border-[rgba(20,18,15,0.5)] hover:bg-[rgba(255,253,247,0.54)] focus-visible:border-[rgba(20,18,15,0.5)] focus-visible:bg-[rgba(255,253,247,0.54)] max-[400px]:min-h-10 max-[400px]:px-3 max-[400px]:text-[0.88rem] [&_svg]:size-[18px]";
const heroActionButtonClassName =
  "inline-flex h-12 w-full max-w-70 items-center justify-center gap-3 rounded-lg border border-[rgba(20,18,15,0.32)] bg-[rgba(255,253,247,0.34)] px-6 text-[1rem] font-black text-[var(--ink)] shadow-[0_14px_34px_rgba(30,26,18,0.12)] backdrop-blur-[10px] hover:border-[rgba(20,18,15,0.5)] hover:bg-[rgba(255,253,247,0.54)] focus-visible:border-[rgba(20,18,15,0.5)] focus-visible:bg-[rgba(255,253,247,0.54)] max-[400px]:gap-2 [&_svg]:size-5";
const rulebookReaderClassName =
  "max-w-[920px] border border-[var(--line)] bg-[var(--paper)] p-[clamp(16px,3vw,28px)]";
const cardLayoutGuideClassName =
  "mt-7 grid grid-cols-2 items-start gap-[clamp(20px,4vw,44px)] max-[760px]:grid-cols-1 max-[400px]:mt-[18px] max-[400px]:gap-4 min-[761px]:items-stretch";
const annotatedCardClassName =
  "sticky top-24 grid w-[min(100%,500px)] justify-self-center border border-[rgba(20,18,15,0.22)] bg-transparent p-[22px] [--guide-scale:1.35] max-[760px]:relative max-[760px]:top-auto max-[760px]:[--guide-scale:1.2] max-[760px]:p-4 max-[400px]:[--guide-scale:1.05] max-[400px]:p-2.5 min-[761px]:h-full min-[761px]:place-items-center min-[761px]:self-stretch [&_.card-art_span]:text-[calc(14mm*var(--guide-scale))] [&_.card-art]:mx-[calc(2.2mm*var(--guide-scale))] [&_.card-art]:ml-[calc(6.4mm*var(--guide-scale))] [&_.card-art]:my-0 [&_.card-bottom]:gap-[calc(1.4mm*var(--guide-scale))] [&_.card-bottom]:p-[calc(2.2mm*var(--guide-scale))] [&_.card-bottom]:pl-[calc(6.4mm*var(--guide-scale))] [&_.card-cost]:w-[calc(7mm*var(--guide-scale))] [&_.card-cost]:text-[calc(3.4mm*var(--guide-scale))] [&_.card-effect]:text-[calc(2.45mm*var(--guide-scale))] [&_.card-mark]:bottom-[calc(1.6mm*var(--guide-scale))] [&_.card-mark]:right-[calc(2.2mm*var(--guide-scale))] [&_.card-mark]:text-[calc(6mm*var(--guide-scale))] [&_.card-meta_span]:px-[calc(1mm*var(--guide-scale))] [&_.card-meta_span]:py-[calc(0.7mm*var(--guide-scale))] [&_.card-meta_span]:text-[calc(2.25mm*var(--guide-scale))] [&_.card-meta]:gap-[calc(1mm*var(--guide-scale))] [&_.card-name.name-extra-long]:text-[calc(2.9mm*var(--guide-scale))] [&_.card-name.name-long]:text-[calc(3.25mm*var(--guide-scale))] [&_.card-name.name-compact]:text-[calc(3.25mm*var(--guide-scale))] [&_.card-name.name-small]:text-[calc(3.55mm*var(--guide-scale))] [&_.card-name]:text-[calc(4.2mm*var(--guide-scale))] [&_.card-power]:w-[calc(7mm*var(--guide-scale))] [&_.card-power]:text-[calc(3.4mm*var(--guide-scale))] [&_.card-serial]:text-[calc(2.2mm*var(--guide-scale))] [&_.card-stripe]:w-[calc(4.7mm*var(--guide-scale))] [&_.card-tile]:mx-auto [&_.card-tile]:h-[calc(var(--card-height)*var(--guide-scale))] [&_.card-tile]:w-[min(100%,calc(var(--card-width)*var(--guide-scale)))] [&_.card-tile]:cursor-default [&_.card-tile]:grid-rows-[calc(11mm*var(--guide-scale))_calc(34mm*var(--guide-scale))_calc(43mm*var(--guide-scale))] [&_.card-top]:gap-[calc(2.4mm*var(--guide-scale))] [&_.card-top]:p-[calc(2.2mm*var(--guide-scale))] [&_.card-top]:pl-[calc(6.4mm*var(--guide-scale))]";
const calloutBaseClassName =
  "absolute z-[3] grid aspect-square w-[30px] place-items-center rounded-full border-2 border-[var(--line)] bg-[var(--paper)] font-black text-[var(--ink)] after:absolute after:w-7 after:border-t-2 after:border-[var(--line)] after:content-['']";
const calloutClassNames = {
  cost: "left-3 top-[22%] after:left-7 after:top-3.5 after:w-[82px]",
  power: "right-3 top-[22%] after:right-7 after:top-3.5 after:w-[59px]",
  art: "right-2 top-[40%] after:right-7 after:top-3.5 after:w-[63px]",
  race: "bottom-[30px] left-3 after:left-7 after:top-3.5 after:w-20",
  effect: "right-2.5 top-[70%] after:right-7 after:top-3.5 after:w-[72px]",
  mark: "bottom-[30px] right-4 after:right-7 after:top-3.5 after:w-[59px]",
};
const termGridClassName =
  "grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] max-[760px]:grid-cols-1 [&_article]:grid [&_article]:grid-cols-[auto_1fr] [&_article]:gap-x-2.5 [&_article]:gap-y-1 [&_article]:bg-[var(--paper)] [&_article]:p-3 max-[400px]:[&_article]:grid-cols-[26px_1fr] max-[400px]:[&_article]:gap-x-2 max-[400px]:[&_article]:gap-y-[3px] max-[400px]:[&_article]:p-[9px] [&_article.wide]:col-span-full [&_article>div]:grid [&_article>div]:aspect-square [&_article>div]:w-[30px] [&_article>div]:place-items-center [&_article>div]:rounded-full [&_article>div]:border [&_article>div]:border-[var(--line)] [&_article>div]:font-black [&_h3]:self-center [&_h3]:text-[1.08rem] max-[400px]:[&_h3]:text-[0.98rem] [&_p]:col-start-2 [&_p]:text-[0.9rem] [&_p]:leading-[1.58] [&_p]:text-[#333333] max-[760px]:[&_p]:col-span-full max-[400px]:[&_p]:text-[0.82rem] max-[400px]:[&_p]:leading-[1.45]";
const termInlineLinkClassName =
  "font-black text-[#1d4ed8] underline underline-offset-[3px] hover:text-[#153eaa] focus-visible:text-[#153eaa]";
const ruleChapterFlowClassName =
  "grid max-w-[940px] gap-0 border-t border-[var(--line)] [&_article]:border-b [&_article]:border-[var(--line)] [&_article]:bg-transparent [&_article]:py-[clamp(18px,3vw,28px)] max-[400px]:[&_article]:py-3.5 [&_h3]:mb-2.5 max-[400px]:[&_h3]:mb-[7px] [&_li]:mt-2 [&_li]:leading-[1.7] [&_li]:text-[#333333] max-[400px]:[&_li]:mt-[5px] max-[400px]:[&_li]:text-[0.9rem] max-[400px]:[&_li]:leading-[1.5] [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-5 max-[400px]:[&_ol]:pl-[1.1rem] [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-5 max-[400px]:[&_ul]:pl-[1.1rem]";
const phaseListClassName =
  "grid max-w-[940px] gap-0 border-t border-[var(--line)] bg-transparent [&_article]:grid [&_article]:grid-cols-[auto_minmax(0,1fr)] [&_article]:gap-3.5 [&_article]:border-b [&_article]:border-[var(--line)] [&_article]:bg-transparent [&_article]:py-[clamp(16px,3vw,24px)] max-[760px]:[&_article]:grid-cols-1 max-[400px]:[&_article]:py-3.5 [&_article>span]:grid [&_article>span]:aspect-square [&_article>span]:w-[30px] [&_article>span]:place-items-center [&_article>span]:rounded-full [&_article>span]:border [&_article>span]:border-[var(--line)] [&_article>span]:font-black max-[400px]:[&_article>span]:w-[26px] max-[400px]:[&_article>span]:text-[0.82rem] [&_h3]:mb-2.5 max-[400px]:[&_h3]:mb-[7px] [&_li]:mt-2 [&_li]:leading-[1.7] [&_li]:text-[#333333] max-[400px]:[&_li]:mt-[5px] max-[400px]:[&_li]:text-[0.9rem] max-[400px]:[&_li]:leading-[1.5] [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 max-[400px]:[&_ol]:mt-2.5 max-[400px]:[&_ol]:pl-[1.1rem] [&_p]:leading-[1.75] [&_p]:text-[#333333] max-[400px]:[&_p]:text-[0.9rem] max-[400px]:[&_p]:leading-[1.52]";
const orderedListClassName =
  "mt-4 list-decimal pl-5 max-[400px]:mt-2.5 max-[400px]:pl-[1.1rem] [&_li]:mt-2 [&_li]:leading-[1.7] [&_li]:text-[#333333] max-[400px]:[&_li]:mt-[5px] max-[400px]:[&_li]:text-[0.9rem] max-[400px]:[&_li]:leading-[1.5]";
const unorderedListClassName =
  "mt-4 list-disc pl-5 max-[400px]:mt-2.5 max-[400px]:pl-[1.1rem] [&_li]:mt-2 [&_li]:leading-[1.7] [&_li]:text-[#333333] max-[400px]:[&_li]:mt-[5px] max-[400px]:[&_li]:text-[0.9rem] max-[400px]:[&_li]:leading-[1.5]";
const definitionListClassName =
  "mt-[18px] grid max-w-[940px] gap-0 border-t border-[var(--line)] bg-transparent max-[400px]:mt-3 [&_div]:grid [&_div]:grid-cols-[110px_minmax(0,1fr)] [&_div]:gap-3 [&_div]:border-b [&_div]:border-[var(--line)] [&_div]:bg-transparent [&_div]:py-3.5 max-[760px]:[&_div]:grid-cols-1 max-[400px]:[&_div]:gap-[5px] max-[400px]:[&_div]:p-[9px] [&_dt]:font-black [&_dd]:m-0 max-[400px]:[&_dd]:text-[0.9rem] max-[400px]:[&_dd]:leading-[1.52] [&_dd_p]:m-0 [&_dd_p+p]:mt-[0.72rem] max-[400px]:[&_dd_p+p]:mt-[0.45rem]";
const keywordChipListClassName =
  "mt-[22px] flex flex-wrap gap-2 max-[400px]:mt-3.5 max-[400px]:gap-1.5 [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:rounded-full [&_button]:border [&_button]:border-[var(--line)] [&_button]:bg-[var(--paper)] [&_button]:px-3.5 [&_button]:py-2 [&_button]:font-extrabold [&_button]:text-[var(--ink)] max-[400px]:[&_button]:px-2.5 max-[400px]:[&_button]:py-1.5 max-[400px]:[&_button]:text-[0.82rem] [&_button:hover]:bg-[var(--ink)] [&_button:hover]:text-[var(--paper)] [&_button:focus-visible]:bg-[var(--ink)] [&_button:focus-visible]:text-[var(--paper)] [&_strong]:font-black";
const keywordNewBadgeClassName =
  "ml-[7px] rounded-full bg-[#f0d35a] px-1.5 py-[3px] text-[0.68rem] font-black uppercase leading-none text-[#14110c]";
const keywordDescriptionListClassName =
  "mt-6 grid max-w-[880px] gap-2.5 max-[400px]:mt-4 max-[400px]:gap-[7px] [&_p]:m-0 [&_p]:leading-[1.75] [&_p]:text-[#333333] max-[400px]:[&_p]:text-[0.9rem] max-[400px]:[&_p]:leading-[1.52] [&_strong]:font-black [&_strong]:text-[var(--ink)]";
const otherKeywordsClassName =
  "mt-[22px] border-t border-[var(--line)] pt-[18px] max-[400px]:mt-4 [&_h3]:mb-2.5 max-[400px]:[&_h3]:mb-[7px] [&_dl]:mt-3.5 [&_dl]:grid [&_dl]:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] [&_dl]:gap-px [&_dl]:border [&_dl]:border-[var(--line)] [&_dl]:bg-[var(--line)] max-[400px]:[&_dl]:gap-2 [&_dl_div]:min-w-0 [&_dl_div]:bg-[var(--paper-soft)] [&_dl_div]:p-3 max-[400px]:[&_dl_div]:p-[9px] [&_dt]:mb-1.5 [&_dt]:font-black [&_dt]:text-[var(--ink)] [&_dd]:m-0 [&_dd]:text-[0.92rem] [&_dd]:leading-[1.65] [&_dd]:text-[#333333] max-[400px]:[&_dd]:text-[0.9rem] max-[400px]:[&_dd]:leading-[1.52]";

function KeywordHighlight({ keyword }: { keyword: string }) {
  return (
    <span className="font-black" style={keywordHighlightStyle(keyword)}>
      {keywordHighlightLabel(keyword)}
    </span>
  );
}

function renderKeywordRuleText(
  text: string,
  renderInlineText: (text: string) => ReactNode,
) {
  return text.split(/(\[[^\]]+\])/g).map((part, index) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <KeywordHighlight key={`${part}-${index}`} keyword={part} />
    ) : (
      <span key={`${part}-${index}`}>{renderInlineText(part)}</span>
    ),
  );
}

export function RulesPage({
  rulebook,
  sampleCard,
  showRulebook,
  onSelectKeyword,
  onSelectRuleTerm,
  onToggleRulebook,
  onNavigateField,
  onNavigateTutorial,
  renderInlineText,
}: RulesPageProps) {
  const termNotes = {
    ...combatConceptNotes,
    ...ruleTermNotes,
    ...fieldTermNotes,
  };
  const richTextFieldProps = {
    termNotes,
    navigableTermNotes: fieldTermNotes,
    ruleTermNotes,
    combatConceptNotes,
    onFieldTermClick: onNavigateField,
    onRuleTermClick: onSelectRuleTerm,
  };

  return (
    <div className={rulesViewClassName}>
      <section className={cn(rulesSectionClassName, rulesHeroClassName)}>
        <p className="eyebrow">{ruleCopy.hero.eyebrow}</p>
        <h2>{ruleCopy.hero.title}</h2>
        <RichText
          className={sectionIntroClassName}
          text={ruleCopy.hero.intro}
          {...richTextFieldProps}
        />
        <div className={linkGridClassName}>
          <button
            className={heroActionButtonClassName}
            type="button"
            onClick={onToggleRulebook}
          >
            <BookOpenText />
            룰북
          </button>
          <button
            className={heroActionButtonClassName}
            type="button"
            onClick={onNavigateTutorial}
          >
            <Gamepad2 />
            튜토리얼
          </button>
        </div>
        {showRulebook && (
          <aside
            className={rulebookReaderClassName}
            id="rulebook-reader"
            aria-label="룰북"
          >
            {rulebook}
            <MissingCallout />
          </aside>
        )}
      </section>

      <section className={rulesSectionClassName}>
        <div className={sectionHeadClassName}>
          <p className="eyebrow">{ruleCopy.cardLayout.eyebrow}</p>
          <h2>{ruleCopy.cardLayout.title}</h2>
        </div>
        {ruleCopy.cardLayout.intro && (
          <RichText
            className={sectionIntroClassName}
            text={ruleCopy.cardLayout.intro}
            {...richTextFieldProps}
          />
        )}
        <div className={cardLayoutGuideClassName}>
          {sampleCard && (
            <div className={annotatedCardClassName}>
              {sampleCard}
              <span className={cn(calloutBaseClassName, calloutClassNames.cost)}>1</span>
              <span className={cn(calloutBaseClassName, calloutClassNames.power)}>2</span>
              <span className={cn(calloutBaseClassName, calloutClassNames.art)}>3</span>
              <span className={cn(calloutBaseClassName, calloutClassNames.race)}>4</span>
              <span className={cn(calloutBaseClassName, calloutClassNames.effect)}>5</span>
              <span className={cn(calloutBaseClassName, calloutClassNames.mark)}>6</span>
            </div>
          )}
          <div className={termGridClassName}>
            {cardPartTerms.map((term) => (
              <article key={term.id} className={term.id === 5 ? "wide" : ""}>
                <div>{term.id}</div>
                <h3>{term.title}</h3>
                <p>
                  {renderInlineText(term.body)}
                  {term.link && (
                    <>
                      {" "}
                      <a className={termInlineLinkClassName} href={term.link.href}>
                        {term.link.text}
                      </a>{" "}
                      섹션 참고
                    </>
                  )}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={cn(rulesSectionClassName, "grid gap-4")}>
        <div className={sectionHeadClassName}>
          <p className="eyebrow">field layout</p>
          <h2>필드 구성</h2>
        </div>
        <button
          className={glassButtonClassName}
          type="button"
          onClick={onNavigateField}
          aria-label="필드 보기"
        >
          <Map />
          필드 보기
        </button>
      </section>

      <section className={rulesSectionClassName}>
        <div className={sectionHeadClassName}>
          <p className="eyebrow">{ruleCopy.setup.eyebrow}</p>
          <h2>{ruleCopy.setup.title}</h2>
        </div>
        {ruleCopy.setup.intro && (
          <RichText
            className={ruleSectionIntroClassName}
            text={ruleCopy.setup.intro}
            {...richTextFieldProps}
          />
        )}
        <div className={ruleChapterFlowClassName}>
          {warPrepSections.map((section, index) => (
            <article key={section.title}>
              <h3>
                {index + 1}. {section.title}
              </h3>
              {index < 2 ? (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{renderInlineText(item)}</li>
                  ))}
                </ul>
              ) : (
                <ol>
                  {section.items.map((item) => (
                    <li key={item}>{renderInlineText(item)}</li>
                  ))}
                </ol>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className={rulesSectionClassName}>
        <div className={sectionHeadClassName}>
          <p className="eyebrow">{ruleCopy.turnPhases.eyebrow}</p>
          <h2>{ruleCopy.turnPhases.title}</h2>
        </div>
        {ruleCopy.turnPhases.intro && (
          <RichText
            className={ruleSectionIntroClassName}
            text={ruleCopy.turnPhases.intro}
            {...richTextFieldProps}
          />
        )}
        <div className={phaseListClassName}>
          {phases.map((phase, index) => (
            <article key={phase.title}>
              <span>{index + 1}</span>
              <div>
                <h3>{phase.title}</h3>
                <p>{renderInlineText(phase.body)}</p>
                {phase.actions && (
                  <ol>
                    {phase.actions.map((action) => (
                      <li key={action}>{renderInlineText(action)}</li>
                    ))}
                  </ol>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={rulesSectionClassName} id="combat-resolution">
        <p className="eyebrow">{ruleCopy.combat.eyebrow}</p>
        <h2>{ruleCopy.combat.title}</h2>
        {ruleCopy.combat.intro && (
          <RichText
            className={sectionIntroClassName}
            text={ruleCopy.combat.intro}
            {...richTextFieldProps}
          />
        )}
        <div className={ruleChapterFlowClassName}>
          {battleCases.map((battleCase, index) => (
            <article key={battleCase.title}>
              <h3>
                {index + 1}. {battleCase.title}
              </h3>
              <ol>
                {battleCase.steps.map((step) => (
                  <li key={step}>{renderInlineText(step)}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className={rulesSectionClassName} id="scout-sacrifice">
        <div className={sectionHeadClassName}>
          <p className="eyebrow">{ruleCopy.scoutSacrifice.eyebrow}</p>
          <h2>{ruleCopy.scoutSacrifice.title}</h2>
        </div>
        {ruleCopy.scoutSacrifice.intro && (
          <p className={sectionIntroClassName}>
            {renderInlineText(ruleCopy.scoutSacrifice.intro)}
          </p>
        )}
        <ol className={orderedListClassName}>
          {ruleCopy.scoutSacrifice.steps.map((step) => (
            <li key={step}>{renderInlineText(step)}</li>
          ))}
        </ol>
      </section>

      <section className={rulesSectionClassName} id="bypass-attack">
        <div className={sectionHeadClassName}>
          <p className="eyebrow">{ruleCopy.bypassAttack.eyebrow}</p>
          <h2>{ruleCopy.bypassAttack.title}</h2>
        </div>
        {ruleCopy.bypassAttack.intro && (
          <p className={sectionIntroClassName}>
            {renderInlineText(ruleCopy.bypassAttack.intro)}
          </p>
        )}
        <ul className={unorderedListClassName}>
          {ruleCopy.bypassAttack.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong> - {renderInlineText(item.body)}
            </li>
          ))}
        </ul>
      </section>

      <section className={rulesSectionClassName} id="combat-control">
        <div className={sectionHeadClassName}>
          <p className="eyebrow">{ruleCopy.control.eyebrow}</p>
          <h2>{ruleCopy.control.title}</h2>
        </div>
        {ruleCopy.control.intro && (
          <p className={sectionIntroClassName}>
            {renderInlineText(ruleCopy.control.intro)}
          </p>
        )}
        <dl className={definitionListClassName}>
          {combatConcepts.map((term) => (
            <div id={combatConceptId(term.term)} key={term.term}>
              <dt>{term.term}</dt>
              <dd>
                {term.body.split(/\n{2,}/).map((paragraph) => (
                  <p key={paragraph}>{renderInlineText(paragraph)}</p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={rulesSectionClassName} id="retreat-resolution">
        <p className="eyebrow">{ruleCopy.retreat.eyebrow}</p>
        <h2>{ruleCopy.retreat.title}</h2>
        {ruleCopy.retreat.intro && (
          <div className={sectionIntroClassName}>
            {ruleCopy.retreat.intro.split(/\n\s*/).map((paragraph) => (
              <p key={paragraph}>{renderInlineText(paragraph.trim())}</p>
            ))}
          </div>
        )}
        <dl className={definitionListClassName}>
          {ruleCopy.retreat.terms.map((term) => (
            <div key={term.keyword}>
              <dt>{term.keyword}</dt>
              <dd>{renderInlineText(term.body)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={rulesSectionClassName} id="forced-conscription">
        <div className={sectionHeadClassName}>
          <p className="eyebrow">{ruleCopy.forcedConscription.eyebrow}</p>
          <h2>{ruleCopy.forcedConscription.title}</h2>
        </div>
        <p className={sectionIntroClassName}>
          {renderInlineText(ruleCopy.forcedConscription.body)}
        </p>
      </section>

      <section className={rulesSectionClassName}>
        <div className={sectionHeadClassName}>
          <p className="eyebrow">{ruleCopy.keywords.eyebrow}</p>
          <h2 id="keyword">{ruleCopy.keywords.title}</h2>
        </div>
        {ruleCopy.keywords.intro && (
          <RichText
            className={sectionIntroClassName}
            text={ruleCopy.keywords.intro}
            {...richTextFieldProps}
          />
        )}
        <div className={keywordChipListClassName}>
          {keywordRules.map(([keyword, , badge]) => (
            <button
              key={keyword}
              type="button"
              onClick={() => onSelectKeyword(keyword)}
            >
              <KeywordHighlight keyword={keyword} />
              {badge === "new" && (
                <span className={keywordNewBadgeClassName}>new</span>
              )}
            </button>
          ))}
        </div>
        <div className={keywordDescriptionListClassName}>
          {keywordRules.map(([keyword, body]) => (
            <p key={keyword}>
              <KeywordHighlight keyword={keyword} /> -{" "}
              {renderKeywordRuleText(body, renderInlineText)}
            </p>
          ))}
        </div>
        <div className={otherKeywordsClassName}>
          <h3>{ruleCopy.keywords.otherTitle}</h3>
          <dl>
            {ruleTerms.map((term) => (
              <div
                id={
                  ["전투", "퇴각", "퇴출"].includes(term.term)
                    ? undefined
                    : ruleTermId(term.term)
                }
                key={term.term}
              >
                <dt>&lt;{term.term}&gt;</dt>
                <dd>{term.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
