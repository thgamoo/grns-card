import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Map as MapIcon,
  ZoomIn,
} from "lucide-react";
import type { WorldLink } from "../content/world";

type WorldPageProps = {
  activeDocIndex: number;
  links: WorldLink[];
  onOpenStory: (index: number) => void;
  onOpenMap: (index: number) => void;
  onOpenLockedBook: () => void;
};

const BOOKS_PER_SHELF = 18;

export function WorldPage({
  activeDocIndex,
  links,
  onOpenStory,
  onOpenMap,
  onOpenLockedBook,
}: WorldPageProps) {
  const shelfPages = useMemo(() => {
    const pages: Array<Array<{ link: WorldLink; index: number }>> = [];
    links.forEach((link, index) => {
      const pageIndex = Math.floor(index / BOOKS_PER_SHELF);
      pages[pageIndex] ??= [];
      pages[pageIndex].push({ link, index });
    });
    return pages;
  }, [links]);
  const [activeShelfPage, setActiveShelfPage] = useState(0);
  const totalShelfPages = Math.max(shelfPages.length, 1);

  useEffect(() => {
    setActiveShelfPage((current) => Math.min(current, totalShelfPages - 1));
  }, [totalShelfPages]);

  const moveShelf = (direction: -1 | 1) => {
    setActiveShelfPage((current) =>
      Math.min(Math.max(current + direction, 0), totalShelfPages - 1),
    );
  };

  return (
    <div className="world-view">
      <div className="world-library" aria-label="세계관 도서관">
        <div className="world-library-perspective" aria-hidden="true" />
        <div className="world-library-controls">
          <button
            type="button"
            className="world-shelf-arrow"
            aria-label="이전 책장"
            title="이전 책장"
            onClick={() => moveShelf(-1)}
            disabled={activeShelfPage === 0}
          >
            <ChevronLeft />
          </button>
          <span className="world-shelf-count" aria-label="책장 번호">
            {activeShelfPage + 1}/{totalShelfPages}
          </span>
          <button
            type="button"
            className="world-shelf-arrow"
            aria-label="다음 책장"
            title="다음 책장"
            onClick={() => moveShelf(1)}
            disabled={activeShelfPage === totalShelfPages - 1}
          >
            <ChevronRight />
          </button>
        </div>
        <div
          className="world-shelf-window"
          style={{ "--active-shelf-page": activeShelfPage } as CSSProperties}
        >
          <div className="world-shelves">
            {shelfPages.map((page, pageIndex) => (
              <div
                className="world-shelf-page"
                key={`world-shelf-${pageIndex}`}
                aria-hidden={pageIndex !== activeShelfPage}
              >
                {page.map(({ link, index }) => (
                  <div
                    className={link.kind === "image" ? "world-shelves-item map-item" : "world-shelves-item"}
                    key={link.href}
                  >
                    <button
                      type="button"
                      className={`${activeDocIndex === index ? "active" : ""} ${
                        link.story ? "story-book" : "map-scroll"
                      } ${link.private ? "locked-book" : ""}`}
                      aria-label={link.private ? `${link.title} 잠김` : undefined}
                      onClick={() => {
                        if (link.private) {
                          onOpenLockedBook();
                          return;
                        }
                        if (link.story) {
                          onOpenStory(index);
                          return;
                        }
                        if (link.kind === "image") {
                          onOpenMap(index);
                        }
                      }}
                    >
                      <span className="world-doc-button-copy">
                        <strong>{link.title}</strong>
                        <span>{link.body}</span>
                      </span>
                      {link.story && (
                        link.private ? (
                          <LockKeyhole
                            className="world-doc-book-icon"
                            aria-hidden="true"
                          />
                        ) : (
                          <BookOpenText
                            className="world-doc-book-icon"
                            aria-hidden="true"
                          />
                        )
                      )}
                      {link.kind === "image" && (
                        <span className="world-map-icons" aria-hidden="true">
                          <MapIcon />
                          <ZoomIn />
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
