
export const frontMatterKeys = (fm: Record<string, any>) => {
  return Object.keys(fm ?? {})
    .filter((f) => f != "position")
    .filter((f) => f != "tag" && f != "tags");
};
