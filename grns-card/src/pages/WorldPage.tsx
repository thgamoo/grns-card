import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { WorldLink } from "../content/world";

type WorldPageProps = {
  activeDocIndex: number;
  links: WorldLink[];
  markdown: ReactNode;
  onSelectDoc: (index: number) => void;
  onTogglePrivateDocs: () => void;
  showPrivateDocs: boolean;
};

export function WorldPage({
  activeDocIndex,
  links,
  markdown,
  onSelectDoc,
  onTogglePrivateDocs,
  showPrivateDocs,
}: WorldPageProps) {
  return (
    <div className="world-view">
      <div className="world-head">
        <p className="eyebrow">world</p>
        <div className="world-title-row">
          <h2>괴력난신 세계서</h2>
          <button
            type="button"
            className={showPrivateDocs ? "world-private-toggle active" : "world-private-toggle"}
            aria-label={showPrivateDocs ? "작업 문서 숨기기" : "작업 문서 보기"}
            title={showPrivateDocs ? "작업 문서 숨기기" : "작업 문서 보기"}
            onClick={onTogglePrivateDocs}
          >
            {showPrivateDocs ? <EyeOff /> : <Eye />}
          </button>
        </div>
        <p>
          이곳에서는 지도, 팩션 관계, 연표, 단편 소설, 장소 데이터를 확인할 수
          있습니다.
        </p>
      </div>
      <div className="world-doc-layout">
        <nav className="world-doc-list" aria-label="세계관 문서 목록">
          {links.map((link, index) => (
            <button
              key={link.href}
              type="button"
              className={activeDocIndex === index ? "active" : ""}
              onClick={() => onSelectDoc(index)}
            >
              <strong>{link.title}</strong>
              <span>{link.body}</span>
            </button>
          ))}
        </nav>
        <article className="world-doc-reader">{markdown}</article>
      </div>
    </div>
  );
}
