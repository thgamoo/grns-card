#!/usr/bin/env python3
"""Fetch en.wikipedia.org war reference pages into GRNS lore notes."""

from __future__ import annotations

import argparse
import json
import re
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import wikipediaapi


DEFAULT_PAGES = [
    "Peloponnesian War",
    "Second Punic War",
    "Gallic Wars",
    "Crusades",
    "Mongol invasions and conquests",
    "Hundred Years' War",
    "Thirty Years' War",
    "Napoleonic Wars",
    "World War I",
    "World War II",
]

DEFAULT_PAGES_FILE = Path("lore/reference-sources/wikipedia-war-pages.json")

DEFAULT_USER_AGENT = (
    "grns-lore-reference-bot/0.1 "
    "(local lore reference generation; contact: local-project)"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch English Wikipedia war references for lore grounding.",
    )
    parser.add_argument(
        "--page",
        action="append",
        default=[],
        help="Additional Wikipedia page title. Can be passed multiple times.",
    )
    parser.add_argument(
        "--pages",
        type=Path,
        default=DEFAULT_PAGES_FILE,
        help=(
            "Text or JSON file with page titles. Defaults to "
            "lore/reference-sources/wikipedia-war-pages.json when present."
        ),
    )
    parser.add_argument(
        "--use-built-in-defaults",
        action="store_true",
        help="Use the script's built-in ten page titles instead of the JSON source file.",
    )
    parser.add_argument(
        "--no-defaults",
        action="store_true",
        help="Only fetch pages provided with --page or --pages.",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Store full page text in generated notes instead of intro summaries.",
    )
    parser.add_argument(
        "--out-json",
        type=Path,
        default=Path("lore/generated/wikipedia-war-references.json"),
        help="Raw metadata JSON output path.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("lore/reference-sources/wikipedia-war-notes"),
        help="Generated Markdown note directory.",
    )
    parser.add_argument(
        "--delay-ms",
        type=int,
        default=250,
        help="Delay between page requests.",
    )
    parser.add_argument(
        "--user-agent",
        default=DEFAULT_USER_AGENT,
        help="Wikimedia-compliant User-Agent string.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch pages and print results without writing files.",
    )
    return parser.parse_args()


def normalize_page_entry(entry: object, path: Path) -> dict | None:
    if isinstance(entry, str):
        return {"title": entry}
    if not isinstance(entry, dict):
        raise ValueError(f"{path} page entries must be strings or objects.")
    if entry.get("enabled", True) is False:
        return None
    title = entry.get("title") or entry.get("page") or entry.get("name")
    if not title:
        raise ValueError(f"{path} page object is missing a title field.")
    return {**entry, "title": str(title)}


def load_pages_file(path: Path) -> list[dict]:
    body = path.read_text(encoding="utf-8")
    if path.suffix == ".json":
        parsed = json.loads(body)
        if isinstance(parsed, dict):
            parsed = parsed.get("pages")
        if not isinstance(parsed, list):
            raise ValueError(f"{path} must contain a JSON array or an object with pages[].")
        entries = [normalize_page_entry(entry, path) for entry in parsed]
        return [entry for entry in entries if entry]

    return [
        {"title": line.strip()}
        for line in body.splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


def unique_entries(values: Iterable[dict]) -> list[dict]:
    seen: set[str] = set()
    result: list[dict] = []
    for entry in values:
        title = entry["title"].strip()
        key = title.casefold()
        if title and key not in seen:
            seen.add(key)
            result.append({**entry, "title": title})
    return result


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = ascii_value.lower().replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")


def normalize_whitespace(value: str) -> str:
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[ \t]+\n", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def truncate_words(value: str, max_words: int) -> str:
    words = normalize_whitespace(value).split()
    if len(words) <= max_words:
        return normalize_whitespace(value)
    return " ".join(words[:max_words]) + "..."


def yaml_string(value: object) -> str:
    escaped = str(value).replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def yaml_list(values: Iterable[str]) -> str:
    items = [value for value in values if value]
    if not items:
        return " []"
    return "\n" + "\n".join(f"  - {yaml_string(value)}" for value in items)


def tactical_categories(categories: Iterable[str]) -> list[str]:
    pattern = re.compile(r"war|battle|conflict|military|invasion|campaign", re.I)
    result = []
    for category in categories:
        name = category.replace("Category:", "")
        if pattern.search(name):
            result.append(name)
    return result[:12]


def collect_page(wiki: wikipediaapi.Wikipedia, entry: dict, full: bool) -> dict:
    title = entry["title"]
    page = wiki.page(title)
    if not page.exists():
        raise ValueError(f"Wikipedia page not found: {title}")

    categories = sorted(page.categories.keys())
    source_text = page.text if full else page.summary
    config = {
        key: value
        for key, value in entry.items()
        if key not in {"enabled", "page", "name"} and value not in (None, "")
    }

    return {
        "requested_title": title,
        "title": page.title,
        "pageid": page.pageid,
        "canonical_url": page.canonicalurl,
        "full_url": page.fullurl,
        "last_revision_id": getattr(page, "lastrevid", None),
        "touched": getattr(page, "touched", None),
        "categories": categories,
        "extract": normalize_whitespace(source_text),
        "config": config,
    }


def optional_frontmatter(page: dict) -> str:
    config = page.get("config", {})
    lines = []
    field_map = {
        "scope": "reference_scope",
        "parent": "parent_reference",
        "campaign": "reference_campaign",
        "group": "reference_group",
        "note": "source_note",
    }
    for source_key, yaml_key in field_map.items():
        value = config.get(source_key)
        if value:
            lines.append(f"{yaml_key}: {yaml_string(value)}")
    return "\n".join(lines)


def build_markdown(page: dict, generated_at: str, full: bool) -> str:
    slug = slugify(page.get("config", {}).get("slug") or page["title"])
    categories = tactical_categories(page["categories"])
    reference_text = page["extract"] if full else truncate_words(page["extract"], 220)
    extra_frontmatter = optional_frontmatter(page)
    extra_frontmatter = f"{extra_frontmatter}\n" if extra_frontmatter else ""

    return f"""---
id: reference.wikipedia.{slug}
type: reference
title: {yaml_string(page["title"])}
status: reference
source_type: wikipedia_en
source_title: {yaml_string(page["title"])}
source_url: {yaml_string(page["canonical_url"] or page["full_url"])}
source_pageid: {page["pageid"]}
source_revision_id: {page["last_revision_id"] or "null"}
source_touched: {yaml_string(page["touched"] or "")}
generated_at: {yaml_string(generated_at)}
{extra_frontmatter}tags:
  - reference
  - wikipedia
  - war
categories:{yaml_list(categories)}
---

# {page["title"]}

## Source

- Wikipedia: {page["canonical_url"] or page["full_url"]}
- Page ID: {page["pageid"]}
- Last revision ID: {page["last_revision_id"] or "unknown"}
- Touched timestamp: {page["touched"] or "unknown"}

## Reference Extract

{reference_text or "No extract returned by Wikipedia."}

## Tactical Reading Notes

- Key tactical concepts:
- Representative battles or campaigns:
- Possible GRNS mechanics:
- Visual motifs:
- Reliability notes:
"""


def main() -> int:
    args = parse_args()
    page_entries: list[dict] = []

    if args.use_built_in_defaults and not args.no_defaults:
        page_entries.extend({"title": title} for title in DEFAULT_PAGES)
    elif args.pages and args.pages.exists() and not args.no_defaults:
        page_entries.extend(load_pages_file(args.pages))
    elif not args.no_defaults:
        page_entries.extend({"title": title} for title in DEFAULT_PAGES)

    page_entries.extend({"title": title} for title in args.page)
    page_entries = unique_entries(page_entries)

    wiki = wikipediaapi.Wikipedia(
        user_agent=args.user_agent,
        language="en",
        extract_format=wikipediaapi.ExtractFormat.WIKI,
    )
    generated_at = datetime.now(timezone.utc).isoformat()
    pages = []
    errors = []

    for entry in page_entries:
        try:
            page = collect_page(wiki, entry, args.full)
            pages.append(page)
            print(f"Fetched {page['title']}")
        except Exception as error:  # noqa: BLE001 - keep batch fetch resilient.
            errors.append({"title": entry["title"], "message": str(error)})
            print(f"Failed {entry['title']}: {error}")

        if args.delay_ms > 0:
            time.sleep(args.delay_ms / 1000)

    payload = {
        "generated_at": generated_at,
        "source": "https://en.wikipedia.org/",
        "library": "Wikipedia-API",
        "mode": "full_text" if args.full else "summary",
        "pages": pages,
        "errors": errors,
    }

    if not args.dry_run:
        args.out_json.parent.mkdir(parents=True, exist_ok=True)
        args.out_dir.mkdir(parents=True, exist_ok=True)
        args.out_json.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        for page in pages:
            filename_slug = slugify(page.get("config", {}).get("slug") or page["title"])
            note_path = args.out_dir / f"{filename_slug}.md"
            note_path.write_text(
                build_markdown(page, generated_at, args.full),
                encoding="utf-8",
            )

    action = "Fetched" if args.dry_run else "Wrote"
    suffix = f" with {len(errors)} errors" if errors else ""
    print(f"{action} {len(pages)} Wikipedia reference pages{suffix}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
