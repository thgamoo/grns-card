import worldLibraryManifest from "../../../world/library/manifest.json";

export type WorldLink = {
  href: string;
  title: string;
  body: string;
  kind?: "markdown" | "image" | "timeline";
  section?: string;
  story?: boolean;
  private?: boolean;
};

type WorldManifestEntry = WorldLink & {
  id: string;
  public?: boolean;
};

export const worldLinks: WorldLink[] = (
  worldLibraryManifest as WorldManifestEntry[]
).map((entry) => ({
  href: entry.href,
  title: entry.title,
  body: entry.body,
  kind: entry.kind,
  section: entry.section,
  story: entry.story,
  private: entry.private ?? entry.public === false,
}));
