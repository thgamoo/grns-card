import { type ReactNode } from "react";
import { BookOpenText, Gamepad2, Map } from "lucide-react";
import rulesGuideImage from "../assets/grns-ink-rules-guide-spirit.png";
import { MissingCallout } from "../components/MissingCallout";
import { RichText } from "../components/RichText";
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
    <div className="rules-view">
      <section className="rules-section rules-hero">
        <div className="rules-hero-art" aria-hidden="true">
          <img src={rulesGuideImage} alt="" />
        </div>
        <p className="eyebrow">{ruleCopy.hero.eyebrow}</p>
        <h2>{ruleCopy.hero.title}</h2>
        <RichText
          className="section-intro"
          text={ruleCopy.hero.intro}
          {...richTextFieldProps}
        />
        <div className="rules-link-grid">
          <button type="button" onClick={onToggleRulebook}>
            <BookOpenText />
            룰북
          </button>
          <button type="button" onClick={onNavigateTutorial}>
            <Gamepad2 />
            튜토리얼
          </button>
        </div>
        {showRulebook && (
          <aside
            className="rulebook-reader"
            id="rulebook-reader"
            aria-label="룰북"
          >
            {rulebook}
            <MissingCallout />
          </aside>
        )}
      </section>

      <section className="rules-section">
        <div className="rules-section-head">
          <p className="eyebrow">{ruleCopy.cardLayout.eyebrow}</p>
          <h2>{ruleCopy.cardLayout.title}</h2>
        </div>
        {ruleCopy.cardLayout.intro && (
          <RichText
            className="section-intro"
            text={ruleCopy.cardLayout.intro}
            {...richTextFieldProps}
          />
        )}
        <div className="card-layout-guide">
          {sampleCard && (
            <div className="annotated-card">
              {sampleCard}
              <span className="callout callout-cost">1</span>
              <span className="callout callout-power">2</span>
              <span className="callout callout-art">3</span>
              <span className="callout callout-race">4</span>
              <span className="callout callout-effect">5</span>
              <span className="callout callout-mark">6</span>
            </div>
          )}
          <div className="term-grid">
            {cardPartTerms.map((term) => (
              <article key={term.id} className={term.id === 5 ? "wide" : ""}>
                <div>{term.id}</div>
                <h3>{term.title}</h3>
                <p>
                  {renderInlineText(term.body)}
                  {term.link && (
                    <>
                      {" "}
                      <a className="term-inline-link" href={term.link.href}>
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

      <section className="rules-section field-preview-guide">
        <div className="rules-section-head">
          <p className="eyebrow">field layout</p>
          <h2>필드 구성</h2>
        </div>
        <button
          className="field-view-button"
          type="button"
          onClick={onNavigateField}
          aria-label="필드 보기"
        >
          <Map />
          필드 보기
        </button>
      </section>

      <section className="rules-section">
        <div className="rules-section-head">
          <p className="eyebrow">{ruleCopy.setup.eyebrow}</p>
          <h2>{ruleCopy.setup.title}</h2>
        </div>
        {ruleCopy.setup.intro && (
          <RichText
            className="section-intro rule-section-intro"
            text={ruleCopy.setup.intro}
            {...richTextFieldProps}
          />
        )}
        <div className="rule-chapter-flow">
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

      <section className="rules-section">
        <div className="rules-section-head">
          <p className="eyebrow">{ruleCopy.turnPhases.eyebrow}</p>
          <h2>{ruleCopy.turnPhases.title}</h2>
        </div>
        {ruleCopy.turnPhases.intro && (
          <RichText
            className="section-intro rule-section-intro"
            text={ruleCopy.turnPhases.intro}
            {...richTextFieldProps}
          />
        )}
        <div className="phase-list">
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

      <section className="rules-section combat-rules" id="combat-resolution">
        <p className="eyebrow">{ruleCopy.combat.eyebrow}</p>
        <h2>{ruleCopy.combat.title}</h2>
        {ruleCopy.combat.intro && (
          <RichText
            className="section-intro"
            text={ruleCopy.combat.intro}
            {...richTextFieldProps}
          />
        )}
        <div className="rule-chapter-flow combat-case-list">
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

      <section className="rules-section" id="scout-sacrifice">
        <div className="rules-section-head">
          <p className="eyebrow">{ruleCopy.scoutSacrifice.eyebrow}</p>
          <h2>{ruleCopy.scoutSacrifice.title}</h2>
        </div>
        {ruleCopy.scoutSacrifice.intro && (
          <p className="section-intro">
            {renderInlineText(ruleCopy.scoutSacrifice.intro)}
          </p>
        )}
        <ol className="rules-ordered-list">
          {ruleCopy.scoutSacrifice.steps.map((step) => (
            <li key={step}>{renderInlineText(step)}</li>
          ))}
        </ol>
      </section>

      <section className="rules-section" id="bypass-attack">
        <div className="rules-section-head">
          <p className="eyebrow">{ruleCopy.bypassAttack.eyebrow}</p>
          <h2>{ruleCopy.bypassAttack.title}</h2>
        </div>
        {ruleCopy.bypassAttack.intro && (
          <p className="section-intro">
            {renderInlineText(ruleCopy.bypassAttack.intro)}
          </p>
        )}
        <ul className="rules-unordered-list">
          {ruleCopy.bypassAttack.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong> - {renderInlineText(item.body)}
            </li>
          ))}
        </ul>
      </section>

      <section className="rules-section control-rules" id="combat-control">
        <div className="rules-section-head">
          <p className="eyebrow">{ruleCopy.control.eyebrow}</p>
          <h2>{ruleCopy.control.title}</h2>
        </div>
        {ruleCopy.control.intro && (
          <p className="section-intro">
            {renderInlineText(ruleCopy.control.intro)}
          </p>
        )}
        <dl className="rules-definition-list">
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

      <section className="rules-section" id="retreat-resolution">
        <p className="eyebrow">{ruleCopy.retreat.eyebrow}</p>
        <h2>{ruleCopy.retreat.title}</h2>
        {ruleCopy.retreat.intro && (
          <div className="section-intro">
            {ruleCopy.retreat.intro.split(/\n\s*/).map((paragraph) => (
              <p key={paragraph}>{renderInlineText(paragraph.trim())}</p>
            ))}
          </div>
        )}
        <dl className="rules-definition-list">
          {ruleCopy.retreat.terms.map((term) => (
            <div key={term.keyword}>
              <dt>{term.keyword}</dt>
              <dd>{renderInlineText(term.body)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rules-section" id="forced-conscription">
        <div className="rules-section-head">
          <p className="eyebrow">{ruleCopy.forcedConscription.eyebrow}</p>
          <h2>{ruleCopy.forcedConscription.title}</h2>
        </div>
        <p className="section-intro">
          {renderInlineText(ruleCopy.forcedConscription.body)}
        </p>
      </section>

      <section className="rules-section">
        <div className="rules-section-head">
          <p className="eyebrow">{ruleCopy.keywords.eyebrow}</p>
          <h2>{ruleCopy.keywords.title}</h2>
        </div>
        {ruleCopy.keywords.intro && (
          <RichText
            className="section-intro"
            text={ruleCopy.keywords.intro}
            {...richTextFieldProps}
          />
        )}
        <div className="keyword-chip-list">
          {keywordRules.map(([keyword, , badge]) => (
            <button
              key={keyword}
              type="button"
              onClick={() => onSelectKeyword(keyword)}
            >
              <strong>{keyword}</strong>
              {badge === "new" && (
                <span className="keyword-new-badge">new</span>
              )}
            </button>
          ))}
        </div>
        <div className="keyword-description-list">
          {keywordRules.map(([keyword, body]) => (
            <p key={keyword}>
              <strong>{keyword}</strong> - {renderInlineText(body)}
            </p>
          ))}
        </div>
        <div className="other-keywords">
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
