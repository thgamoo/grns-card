import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import worldLibraryArchiveBg from "../assets/world-library-archive-bg.png";
import { WorldLibraryScene } from "../components/WorldLibraryScene";
import type { WorldLink } from "../content/world";

type WorldPageProps = {
  activeDocIndex: number;
  links: WorldLink[];
  onOpenStory: (index: number) => void;
  onOpenMap: (index: number) => void;
  onOpenLockedBook: () => void;
  onShelfFocusChange?: (isFocused: boolean) => void;
  sealedBooksUnlocked: boolean;
};

const SHELF_ROWS = 3;
const BOOKSHELF_COUNT = 2;

export function WorldPage({
  activeDocIndex,
  links,
  onOpenStory,
  onOpenMap,
  onOpenLockedBook,
  onShelfFocusChange,
  sealedBooksUnlocked,
}: WorldPageProps) {
  const shelfPages = useMemo(() => {
    const pages: Array<Array<{ link: WorldLink; index: number }>> = [];
    const booksPerShelf = Math.ceil(links.length / BOOKSHELF_COUNT);
    links.forEach((link, index) => {
      const pageIndex = Math.floor(index / booksPerShelf);
      pages[pageIndex] ??= [];
      pages[pageIndex].push({ link, index });
    });
    return pages;
  }, [links]);
  const [activeShelfPage, setActiveShelfPage] = useState(0);
  const [focusedShelfPage, setFocusedShelfPage] = useState<number | null>(null);
  const [hoveredWorldIndex, setHoveredWorldIndex] = useState<number | null>(null);
  const totalShelfPages = Math.max(shelfPages.length, 1);
  const clampedShelfPage = Math.min(activeShelfPage, totalShelfPages - 1);
  const focusedShelfIndex =
    focusedShelfPage === null
      ? null
      : Math.min(Math.max(focusedShelfPage, 0), totalShelfPages - 1);
  const currentShelfIndex = focusedShelfIndex ?? clampedShelfPage;
  const maxShelfItems = Math.max(...shelfPages.map((page) => page.length), 1);
  const columnCount = Math.max(2, Math.ceil(maxShelfItems / SHELF_ROWS));
  const focusedShelfItems =
    focusedShelfIndex === null ? [] : shelfPages[focusedShelfIndex] ?? [];
  const visibleShelfItems = sealedBooksUnlocked
    ? focusedShelfItems.map(({ link, index }) => ({
        index,
        link: { ...link, private: false },
      }))
    : focusedShelfItems;

  useEffect(() => {
    onShelfFocusChange?.(focusedShelfIndex !== null);
  }, [focusedShelfIndex, onShelfFocusChange]);

  const moveShelf = (direction: -1 | 1) => {
    const base = focusedShelfIndex ?? clampedShelfPage;
    const next = Math.min(Math.max(base + direction, 0), totalShelfPages - 1);
    setActiveShelfPage(next);
    setFocusedShelfPage(next);
    setHoveredWorldIndex(null);
  };
  const bookshelfHitZones = [
    {
      className: "world-bookshelf-1 absolute left-[18%] top-[40%] h-full w-[20%] -translate-y-1/2",
      label: "책장 1 확인하기",
    },
    {
      className: "world-bookshelf-2 absolute right-0 top-0 h-full w-1/2",
      label: "책장 2 확인하기",
    },
  ].slice(0, totalShelfPages);

  return (
    <div className="world-view">
      <div
        className={`world-library ${
          focusedShelfIndex === null ? "is-overview" : "is-focused"
        }`}
        aria-label="세계관 도서관"
      >
        {focusedShelfIndex === null ? (
          <div className="world-bookshelf-stage">
            <img
              className="world-bookshelf-image"
              src={worldLibraryArchiveBg}
              alt=""
              aria-hidden="true"
            />
            <div className="world-bookshelf-hit-zones" aria-label="책장 선택">
              {bookshelfHitZones.map((hitZone, shelfIndex) => (
                <button
                  type="button"
                  className={`world-bookshelf-hit-zone ${hitZone.className}`}
                  data-label={hitZone.label}
                  key={`world-shelf-hit-${shelfIndex}`}
                  aria-label={hitZone.label}
                  onClick={() => {
                    setActiveShelfPage(shelfIndex);
                    setFocusedShelfPage(shelfIndex);
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <WorldLibraryScene
              columnCount={columnCount}
              hoveredIndex={hoveredWorldIndex}
              items={visibleShelfItems}
              viewMode="focused"
            />
            <button
              type="button"
              className="world-shelf-edge-button left"
              aria-label="이전 책장"
              title="이전 책장"
              onClick={() => moveShelf(-1)}
              disabled={currentShelfIndex === 0}
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              className="world-shelf-edge-button right"
              aria-label="다음 책장"
              title="다음 책장"
              onClick={() => moveShelf(1)}
              disabled={currentShelfIndex === totalShelfPages - 1}
            >
              <ChevronRight />
            </button>
            <button
              type="button"
              className="world-shelf-back-button"
              aria-label="책장 전체 보기"
              title="책장 전체 보기"
              onClick={() => setFocusedShelfPage(null)}
            >
              <ChevronDown aria-hidden="true" />
            </button>
            <div
              className="world-book-hotspots"
              style={{ "--world-shelf-columns": columnCount } as CSSProperties}
            >
              {focusedShelfItems.map(({ link, index }, slot) => {
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
          </>
        )}
      </div>
    </div>
  );
}
