import { getAbstractFileAtPath } from "adapters/obsidian/utils/file";
import { MakeMDSettings } from "core/types/settings";
import MakeMDPlugin from "main";
import { SpaceManager } from "makemd-core";
import {
  App,
  CachedMetadata,
  Pos,
  TFile,
  TFolder,
  getAllTags
} from "obsidian";
import { uniq } from "utils/array";
import { serializeMultiDisplayString } from "utils/serializers";
import { stringFromTag, tagPathToTag, validateName } from "utils/tags";


const tagKeys = ["tags"];



export const loadTags = (app: App, settings: MakeMDSettings) : string[] => {
  const folder =
    settings.spacesFolder == ""
      ? app.vault.getRoot()
      : (getAbstractFileAtPath(
          app,
          settings.spacesFolder
        ) as TFolder);
  return uniq([
    ...Object.keys(app.metadataCache.getTags()).map(f => f.toLowerCase()),
    ...(folder?.children
      .filter(
        (f) =>
          f instanceof TFolder && f.name.charAt(0) == "#"
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

export const getAllFilesForTag = (plugin: MakeMDPlugin, tag: string) => {
  const tagsCache: string[] = [];

  (() => {
    plugin.app.vault.getMarkdownFiles().forEach((tfile) => {
      let currentCache!: CachedMetadata;
      if (plugin.app.metadataCache.getFileCache(tfile) !== null) {
        //@ts-ignore
        currentCache = plugin.app.metadataCache.getFileCache(tfile);
      }
      const relativePath: string = tfile.path;
      const hasTag: boolean = tagExists(currentCache, tag);
      if (hasTag) {
        tagsCache.push(relativePath);
      }
    });
  })();
  return tagsCache;
};

export const addTagToProperties = (manager: SpaceManager, tag: string, path: string) => {
  const newTag = validateName(tag);
  editTagInProperties(manager, "", newTag, path);
};

const positionsForTag = (plugin: MakeMDPlugin, tag: string, file: TFile) => {
  const currentCache = plugin.app.metadataCache.getFileCache(file);
  if (currentCache.tags) {
    const positions = currentCache.tags
      .filter((f) => f.tag.toLowerCase() == tag.toLowerCase())
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

export const removeTagFromMarkdownFile = (plugin: MakeMDPlugin, tag: string, file: TFile) => {

  const pos = positionsForTag(plugin, tag, file);
  removeTagInProperties(plugin.superstate.spaceManager, tag, file.path);
  editTagInFileBody(plugin, tag, "", pos, file);
};

export const renameTagInMarkdownFile = async (plugin: MakeMDPlugin, tag: string, newTag: string, tFile: TFile) => {
  const positions = positionsForTag(plugin, tag, tFile);
  if (positions.length > 0) {
    await editTagInFileBody(plugin, tag, newTag, positions, tFile);
  } else {
    await editTagInProperties(plugin.superstate.spaceManager, tag, newTag, tFile.path);
  }
}

const removeTagInProperties = async (manager: SpaceManager, oldTag: string, path: string) => {
  
  const fm = await manager.readProperties(path);
  const processKey = (value: string | string[]) => {
    if (Array.isArray(value)) {
      return value.filter((f) => stringFromTag(oldTag).toLowerCase() != f.toLowerCase());
    } else if (typeof value === "string") {
      return serializeMultiDisplayString(value
        .replace(/\s/g, "")
        .split(",")
        .filter((f) => stringFromTag(oldTag).toLowerCase() != f.toLowerCase())
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
    if (tags.find((g) => g.toLowerCase() == stringFromTag(oldTag).toLowerCase())) return true;
    return false;
  });
  editKeys.forEach((tag) => {
    manager.saveProperties(path, { [tag]: processKey(fm[tag]) });
    
  });
  
};

const editTagInProperties = async (
  manager: SpaceManager,
  oldTag: string,
  newTag: string,
  path: string
) => {
  
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
  const fm = await manager.readProperties(path);
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
          manager.saveProperties(path, {
            [key]: processKey(fm[key]),
          });
        });
      } else {
        manager.saveProperties(path, {
          tags: addTag(fm["tags"]),
        });
        
      }
    } else {
      manager.saveProperties(path, {
        tags: stringFromTag(newTag),
      });
      
    }

};

const editTagInFileBody = async (
  plugin: MakeMDPlugin,
  oldTag: string,
  newTag: string,
  positions: Pos[],
  file: TFile
) => {
  const offsetOffset = newTag.length - oldTag.length;
  if (positions.length == 0) return false;
  const original = await plugin.files.readTextFromFile(file.path);
  let text = original;
  let offset = 0;
  for (const { start, end } of positions) {
    const startOff = start.offset + offset;
    const endOff = end.offset + offset;
    if (text.slice(startOff, endOff).toLowerCase() !== oldTag.toLocaleLowerCase()) {
      return false;
    }
    text =
      text.slice(0, startOff) + newTag + text.slice(startOff + oldTag.length);
    offset += offsetOffset;
  }
  if (text !== original) {
    await plugin.files.writeTextToFile(file.path, text);
    return true;
  }
};
