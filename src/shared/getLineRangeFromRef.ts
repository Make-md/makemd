import { App } from "obsidian";




export const getLineRangeFromRef = (
  path: string,
  ref: string | undefined,
  app: App
): [number | undefined, number | undefined] => {
  if (!ref) {
    return [undefined, undefined];
  }
  const cache = app.metadataCache.getCache(path);
  if (!cache) return [undefined, undefined];
  const headings = cache.headings;
  const blocks = cache.blocks;
  const sections = cache.sections;
  if (blocks && ref.charAt(0) == "^" && blocks[ref.substring(1)]) {
    return [
      blocks[ref.substring(1)].position.start.line + 1,
      blocks[ref.substring(1)].position.end.line + 1,
    ];
  }
  const heading = headings?.find((f) => f.heading.replace("#", " ") == ref);

  if (heading) {
    const index = headings.findIndex((f) => f.heading == heading.heading);
    const level = headings[index]?.level;
    const nextIndex = headings.findIndex(
      (f, i) => i > index && f.level <= level
    );

    const start = heading.position.start.line + 2;
    if (index < headings.length - 1 && nextIndex != -1) {
      return [start, headings[nextIndex].position.end.line];
    }
    return [start, sections[sections.length - 1].position.end.line + 1];
  }
  return [undefined, undefined];
};
