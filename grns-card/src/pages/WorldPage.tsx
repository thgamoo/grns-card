import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import { WorldLibraryScene } from "../components/WorldLibraryScene";
import type { WorldLink } from "../content/world";

type WorldPageProps = {
  activeDocIndex: number;
  links: WorldLink[];
  onOpenStory: (index: number) => void;
  onOpenMap: (index: number) => void;
  onOpenLockedBook: () => void;
  sealedBooksUnlocked: boolean;
};

const DESKTOP_COLUMNS = 6;
const MOBILE_COLUMNS = 2;
const SHELF_ROWS = 3;

export function WorldPage({
  activeDocIndex,
  links,
  onOpenStory,
  onOpenMap,
  onOpenLockedBook,
  sealedBooksUnlocked,
}: WorldPageProps) {
  const [isMobileShelf, setIsMobileShelf] = useState(false);
  const columnCount = isMobileShelf ? MOBILE_COLUMNS : DESKTOP_COLUMNS;
  const booksPerShelf = columnCount * SHELF_ROWS;
  const shelfPages = useMemo(() => {
    const pages: Array<Array<{ link: WorldLink; index: number }>> = [];
    links.forEach((link, index) => {
      const pageIndex = Math.floor(index / booksPerShelf);
      pages[pageIndex] ??= [];
      pages[pageIndex].push({ link, index });
    });
    return pages;
  }, [booksPerShelf, links]);
  const [activeShelfPage, setActiveShelfPage] = useState(0);
  const [hoveredWorldIndex, setHoveredWorldIndex] = useState<number | null>(null);
  const totalShelfPages = Math.max(shelfPages.length, 1);
  const clampedShelfPage = Math.min(activeShelfPage, totalShelfPages - 1);
  const activeShelfItems = shelfPages[clampedShelfPage] ?? [];
  const visibleShelfItems = sealedBooksUnlocked
    ? activeShelfItems.map(({ link, index }) => ({
        index,
        link: { ...link, private: false },
      }))
    : activeShelfItems;

  useEffect(() => {
    const syncShelfSize = () => {
      setIsMobileShelf(window.matchMedia("(max-width: 760px)").matches);
    };
    syncShelfSize();
    window.addEventListener("resize", syncShelfSize);
    return () => window.removeEventListener("resize", syncShelfSize);
  }, []);

  const moveShelf = (direction: -1 | 1) => {
    setActiveShelfPage((current) =>
      Math.min(Math.max(current + direction, 0), totalShelfPages - 1),
    );
  };

  return (
    <div className="world-view">
      <div className="world-library" aria-label="세계관 도서관">
        <WorldLibraryScene
          columnCount={columnCount}
          hoveredIndex={hoveredWorldIndex}
          items={visibleShelfItems}
        />
        <span className="world-shelf-count" aria-label="책장 번호">
          {clampedShelfPage + 1}/{totalShelfPages}
        </span>
        <button
          type="button"
          className="world-shelf-edge-button left"
          aria-label="이전 책장"
          title="이전 책장"
          onClick={() => moveShelf(-1)}
          disabled={clampedShelfPage === 0}
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          className="world-shelf-edge-button right"
          aria-label="다음 책장"
          title="다음 책장"
          onClick={() => moveShelf(1)}
          disabled={clampedShelfPage === totalShelfPages - 1}
        >
          <ChevronRight />
        </button>
        <div
          className="world-book-hotspots"
          style={{ "--world-shelf-columns": columnCount } as CSSProperties}
        >
          {activeShelfItems.map(({ link, index }, slot) => {
            const isLocked = Boolean(link.private && !sealedBooksUnlocked);
            const isTopShelf = Math.floor(slot / columnCount) === 0;
            return (
              <button
              type="button"
              className={`${activeDocIndex === index ? "active" : ""} ${
                link.story ? "story-book" : "map-scroll"
              } ${isLocked ? "locked-book" : ""} ${isTopShelf ? "top-shelf-hotspot" : ""}`}
              aria-label={isLocked ? `${link.title} 잠김` : undefined}
              key={link.href}
              onBlur={() => setHoveredWorldIndex(null)}
              onClick={() => {
                if (isLocked) {
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
              onFocus={() => setHoveredWorldIndex(index)}
              onMouseEnter={() => setHoveredWorldIndex(index)}
              onMouseLeave={() => setHoveredWorldIndex(null)}
            >
              <span className="world-doc-button-copy">
                <strong>{link.title}</strong>
              </span>
              {isLocked && (
                <LockKeyhole
                  className="world-doc-book-icon"
                  aria-hidden="true"
                />
              )}
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
