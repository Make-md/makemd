import { Superstate } from "core/superstate/superstate";
import { renameTagSpacePath } from "core/utils/contexts/optionValuesForColumn";
import { pathToString } from "utils/path";
import { encodeSpaceName } from "../core/utils/strings";


export const renameTag = async (
  superstate: Superstate,
  tag: string,
  toTag: string
) => {

  const tags = getAllSubtags(superstate, tag);
  const newTag = ensureTag(validateName(toTag));
  const paths = superstate.spaceManager.pathsForTag(tag);
  for (const path of paths) {
    superstate.spaceManager.renameTag(path, tag, newTag);
  }
  await renameTagSpacePath(superstate, tag, newTag);
  for (const subtag of tags) {
    await renameTag(superstate, subtag, subtag.replace(tag, newTag));
  }
  return newTag
};
export const getAllParentTags = (str: string) => {
  if (str.startsWith('#')) {
    str = str.slice(1);
  }

  const parts = str.split('/');
  const result: string[] = [];

  for (let i = 0; i < parts.length - 1; i++) {
    if (i === 0) {
      result.push(parts[i]);
    } else {
      result.push(result[i - 1] + '/' + parts[i]);
    }
  }

  return result;
};
export const validateName = (tag: string) => {
  return tag.trim();
};
export const getAllSubtags = (superstate: Superstate, tag: string) => {

  const tags = superstate.spaceManager.readTags();
  return tags.filter((f) => f.startsWith(tag) && f != tag);
};
export const tagToTagPath = (tag: string) => {
  return encodeSpaceName(ensureTag(tag));
};

export const tagPathToTag = (string: string) => {
  return pathToString(string).replace(/\+/g, "/");
};

export const ensureTag = (tag: string) => {
  if (!tag) return null;
  let string = tag;
  if (string.charAt(0) != "#") string = "#" + string;
  return string.toLowerCase();
};
export const stringFromTag = (string: string) => {
  if (string.charAt(0) == "#") {
    if (string.charAt(1) == "#") {
      return string.substring(2, string.length);
    }
    return string.substring(1, string.length);
  }

  return string;
};

