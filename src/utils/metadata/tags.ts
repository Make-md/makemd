import MakeMDPlugin from "main";
import {
  CachedMetadata,
  FrontMatterCache,
  getAllTags,
  Pos,
  TAbstractFile,
  TFile,
  TFolder
} from "obsidian";
import { uniq } from "utils/array";
import { getAbstractFileAtPath, getFolderPathFromString } from "utils/file";
import { serializeMultiDisplayString } from "utils/serializer";
import { filePathToString, stringFromTag } from "utils/strings";
import { tagContextFromTag } from "../contexts/contexts";
import { createDefaultDB, deleteTagContext, renameTagContextFile } from "../contexts/mdb";
import { parseContextDefString, parseMultiString } from "../parser";

export type Tag = {
  tag: string;
  childre: Tag[];
};

const tagKeys = ["tag", "tags", "Tag", "Tags"];
export const tagToTagPath = (tag: string) => {
  if (!tag) return null;
  let string = tag;
  if (string.charAt(0) != "#") string = "#" + string;
  return string.replace(/\//g, "+");
};

export const tagPathToTag = (string: string) => {
  return filePathToString(string).replace(/\+/g, "/");
};



export const loadTags = (plugin: MakeMDPlugin) => {
  const folder =
    plugin.settings.tagContextFolder == ""
      ? app.vault.getRoot()
      : (getAbstractFileAtPath(
          app,
          getFolderPathFromString(plugin.settings.tagContextFolder)
        ) as TFolder);
  return uniq([
    ...Object.keys(app.metadataCache.getTags()),
    ...(folder?.children
      .filter(
        (f) =>
          f instanceof TFile && f.extension == "mdb" && f.name.charAt(0) == "#"
      )
      .map((f) => tagPathToTag(f.name)) ?? []),
  ]);
};

const tagExists = (currentCache: CachedMetadata, findTag: string): boolean => {
  let currentTags: string[] = [];
  if (getAllTags(currentCache)) {
    //@ts-ignore
    currentTags = getAllTags(currentCache);
  }
  return currentTags.find((tag) => tag.toLowerCase() == findTag.toLowerCase())
    ? true
    : false;
};

export const getAllFilesForTag = (tag: string) => {
  let tagsCache: string[] = [];

  (() => {
    app.vault.getMarkdownFiles().forEach((tfile) => {
      let currentCache!: CachedMetadata;
      if (app.metadataCache.getFileCache(tfile) !== null) {
        //@ts-ignore
        currentCache = app.metadataCache.getFileCache(tfile);
      }
      let relativePath: string = tfile.path;
      const hasTag: boolean = tagExists(currentCache, tag);
      if (hasTag) {
        tagsCache.push(relativePath);
      }
    });
  })();
  return tagsCache;
};

export const addTagToNote = (tag: string, tFile: TFile) => {
  const newTag = validateName(tag);
  editTagInFrontmatter("", newTag, tFile);
};

const positionsForTag = (tag: string, file: TFile) => {
  const currentCache = app.metadataCache.getFileCache(file);
  if (currentCache.tags) {
    const positions = currentCache.tags
      .filter((f) => f.tag == tag)
      .map((f) => f.position)
      .sort((a: Record<string, any>, b: Record<string, any>) => {
        if (a.start.offset < b.start.offset) {
          return -1;
        }
        if (a.start.offset > b.start.offset) {
          return 1;
        }
        return 0;
      });
    return positions;
  }
  return [];
};

export const removeTagFromFile = (tag: string, file: TFile) => {
  const pos = positionsForTag(tag, file);
  removeTagInFrontmatter(tag, file);
  editTagInFileBody(tag, "", pos, file);
};

const validateName = (tag: string) => {
  return tag;
};

export const deleteTag = async (
  plugin: MakeMDPlugin,
  tag: string,
  subTags: boolean
) => {
  const files = getAllFilesForTag(tag)
    .map((f) => getAbstractFileAtPath(app, f))
    .filter((f) => f instanceof TFile) as TFile[];
  files.forEach((file) => removeTagFromFile(tag, file));
  deleteTagContext(plugin, tag);
  if (subTags) {
    const tags = getAllSubtags(plugin, tag);
    tags.forEach((tag) => deleteTag(plugin, tag, subTags));
  }
};

export const tagsFromDefString = (defStr: string) : string[] => parseContextDefString(defStr).filter((f) => f.type == 'tag' && f.value.length > 0).map(f => f.value)

export const updateTagsForDefString = (defStr: string, tags: string[]) : string => JSON.stringify([...parseContextDefString(defStr).filter((f) => f.type != 'tag'), ...tags.map(f => ({ type: 'tag', value: f}))])

export const addTag = async (plugin: MakeMDPlugin, tag: string) => {
  const context = tagContextFromTag(plugin, tag);
  await createDefaultDB(plugin, context);
  
};

export const renameTag = async (
  plugin: MakeMDPlugin,
  tag: string,
  toTag: string
) => {
  const tags = getAllSubtags(plugin, tag);
  const newTag = validateName(toTag);
  const files = getAllFilesForTag(tag);
  for (const file of files) {
    const tFile = getAbstractFileAtPath(app, file);
    if (tFile instanceof TFile) {
      const positions = positionsForTag(tag, tFile);
      if (positions.length > 0) {
        await editTagInFileBody(tag, newTag, positions, tFile);
      } else {
        await editTagInFrontmatter(tag, newTag, tFile);
      }
    }
  }
  await renameTagContextFile(plugin, tag, toTag);
  for (const subtag of tags) {
    await renameTag(plugin, subtag, subtag.replace(tag, newTag));
  }
};

const getAllSubtags = (plugin: MakeMDPlugin, tag: string) => {
  const tags = loadTags(plugin);
  return tags.filter((f) => f.startsWith(tag) && f != tag);
};

const removeTagInFrontmatter = async (oldTag: string, file: TFile) => {
  let fm!: FrontMatterCache;
  if (app.metadataCache.getFileCache(file) !== null) {
    fm = app.metadataCache.getFileCache(file)?.frontmatter;
  }
  if (fm && app.fileManager.processFrontMatter) {
    const processKey = (value: string | string[]) => {
      if (Array.isArray(value)) {
        return value.filter((f) => stringFromTag(oldTag) != f);
      } else if (typeof value === "string") {
        return serializeMultiDisplayString(value
          .replace(/\s/g, "")
          .split(",")
          .filter((f) => stringFromTag(oldTag) != f)
          );
      }
      return value;
    };
    
    const editKeys = tagKeys.filter((f) => {
      let tags: string[] = [];
      if (Array.isArray(fm[f])) {
        tags = fm[f];
      } else if (typeof fm[f] === "string") {
        tags = fm[f].replace(/\s/g, "").split(",");
      }
      if (tags.find((g) => g == stringFromTag(oldTag))) return true;
      return false;
    });
    editKeys.forEach((tag) => {
      app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter[tag] = processKey(fm[tag]);
      });
    });
  }
};

const editTagInFrontmatter = async (
  oldTag: string,
  newTag: string,
  file: TFile
) => {
  let fm!: FrontMatterCache;
  if (app.metadataCache.getFileCache(file) !== null) {
    fm = app.metadataCache.getFileCache(file)?.frontmatter;
  }
  const addTag = (value: string | string[]) => {
    if (Array.isArray(value)) {
      return uniq([...value, stringFromTag(newTag)]).filter(f => f?.length > 0);
    } else if (typeof value === "string") {
      return serializeMultiDisplayString(uniq([
        ...value.replace(/\s/g, "").split(","),
        stringFromTag(newTag),
      ]).filter(f => f?.length > 0));
    }
    return stringFromTag(newTag);
  };
  if (app.fileManager.processFrontMatter) {
    if (fm) {
      const processKey = (value: string | string[]) => {
        if (Array.isArray(value)) {
          return uniq(
            value.map((f) =>
              stringFromTag(oldTag) == f ? stringFromTag(newTag) : f
            )
          );
        } else if (typeof value === "string") {
          return serializeMultiDisplayString(uniq(
            value
              .replace(/\s/g, "")
              .split(",")
              .map((f) =>
                stringFromTag(oldTag) == f ? stringFromTag(newTag) : f
              )
          ));
        }
        return value;
      };

      const editKeys = tagKeys.filter((f) => {
        let tags: string[] = [];
        if (Array.isArray(fm[f])) {
          tags = fm[f];
        } else if (typeof fm[f] === "string") {
          tags = fm[f].replace(/\s/g, "").split(",");
        }
        if (tags.find((g) => g == stringFromTag(oldTag))) return true;
        return false;
      });
      if (editKeys.length > 0) {
        editKeys.forEach((key) => {
          app.fileManager.processFrontMatter(file, (frontmatter) => {
            frontmatter[key] = processKey(fm[key]);
          });
        });
      } else {
        app.fileManager.processFrontMatter(file, (frontmatter) => {
          frontmatter["tag"] = addTag(fm["tag"]);
        });
      }
    } else {
      app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter["tag"] = stringFromTag(newTag);
      });
    }
  }
};

const editTagInFileBody = async (
  oldTag: string,
  newTag: string,
  positions: Pos[],
  file: TFile
) => {
  const offsetOffset = newTag.length - oldTag.length;
  if (positions.length == 0) return false;
  const original = await app.vault.read(file);
  let text = original;
  let offset = 0;
  for (const { start, end } of positions) {
    let startOff = start.offset + offset;
    let endOff = end.offset + offset;
    if (text.slice(startOff, endOff) !== oldTag) {
      return false;
    }
    text =
      text.slice(0, startOff) + newTag + text.slice(startOff + oldTag.length);
    offset += offsetOffset;
  }
  if (text !== original) {
    await app.vault.modify(file, text);
    return true;
  }
};

export const allTagsForFile = (file: TAbstractFile) : string[] => {
  let rt = [];
  if (file instanceof TFile) {
    const fCache = app.metadataCache.getCache(file.path);
    if (fCache && fCache.tags)
      rt.push(...(fCache.tags?.map((f) => f.tag) ?? []));
    if (fCache && fCache.frontmatter?.tags)
      rt.push(
        ...(typeof fCache.frontmatter?.tags === "string"
          ? parseMultiString(fCache.frontmatter.tags.replace(/ /g, ""))
          : Array.isArray(fCache.frontmatter?.tags)
          ? fCache.frontmatter?.tags
          : []
        )
          .filter((f) => typeof f === "string")
          .map((f) => "#" + f)
      );
    if (fCache && fCache.frontmatter?.tag)
      rt.push(
        ...(typeof fCache.frontmatter?.tag === "string"
          ? parseMultiString(fCache.frontmatter.tag.replace(/ /g, ""))
          : Array.isArray(fCache.frontmatter?.tag)
          ? fCache.frontmatter?.tag
          : []
        )
          .filter((f) => typeof f === "string")
          .map((f) => "#" + f)
      );
  }
  return uniq(rt);
};
