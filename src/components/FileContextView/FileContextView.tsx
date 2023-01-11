import { TAbstractFile, TFile } from "obsidian";
import React, { useEffect, useMemo, useState } from "react";

import { MDBProvider } from "../ContextView/MDBContext";
import { FileContextList } from "./FileContextList";

import { FileSticker } from "components/FileSticker/FileSticker";
import { ItemView, TFolder, ViewStateResult, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { eventTypes } from "types/types";
import {
  folderContextFromFolder,
  tagContextFromTag
} from "utils/contexts/contexts";
import { getMDBTable } from "utils/contexts/mdb";
import { getAbstractFileAtPath } from "utils/file";
import { uiIconSet } from "utils/icons";
import { fileNameToString, uniq } from "utils/tree";
import MakeMDPlugin from "../../main";
import { Backlinks } from "./Backlinks";
export const FILE_CONTEXT_VIEW_TYPE = "make-context-view";
export const ICON = "component";
export const VIEW_DISPLAY_TEXT = "File Context";

export class FileContextLeafView extends ItemView {
  plugin: MakeMDPlugin;
  navigation = false;
  file: TAbstractFile;
  root: Root;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return FILE_CONTEXT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return VIEW_DISPLAY_TEXT;
  }

  getIcon(): string {
    return ICON;
  }

  async onClose() {
    this.destroy();
  }

  destroy() {
    if (this.root) this.root.unmount();
  }

  async onOpen(): Promise<void> {
    this.destroy();
    this.constructFileContext();
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    this.constructFileContext();
    await super.setState(state, result);

    return;
  }
  getState(): any {
    let state = super.getState();

    // Store information to the state, whenever the workspace changes (opening a new note,...), the view's `getState` will be called, and the resulting state will be saved in the 'workspace' file

    return state;
  }

  constructFileContext() {
    this.destroy();
    this.root = createRoot(this.contentEl);
    this.root.render(<FileContextView plugin={this.plugin}></FileContextView>);
  }
}

const allTagsForFile = async (plugin: MakeMDPlugin, file: TAbstractFile) => {
  let rt = [];
  const dbPath = folderContextFromFolder(plugin, file?.parent.path);
  const dbFileExists = getAbstractFileAtPath(app, dbPath);
  if (dbFileExists) {
    const folderDB = await getMDBTable(plugin, "files", dbPath, false);
    if (folderDB) {
      rt.push(...folderDB.schema.def.split("&"));
    }
  }
  if (file instanceof TFile) {
    const fCache = app.metadataCache.getCache(file.path);
    if (fCache && fCache.tags)
      rt.push(...(fCache.tags?.map((f) => f.tag) ?? []));
    if (fCache && fCache.frontmatter?.tags)
      rt.push(
        ...(typeof fCache.frontmatter?.tags === "string"
          ? [fCache.frontmatter.tags]
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
          ? [fCache.frontmatter.tag]
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

export const FileContextView = (props: { plugin: MakeMDPlugin }) => {
  const [activeFilePath, setActiveFilePath] = useState<string>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(null);
  const path = useMemo(
    () => selectedFilePath ?? activeFilePath,
    [selectedFilePath, activeFilePath]
  );
  const file = useMemo(() => {
    const afile = getAbstractFileAtPath(app, path);
    return afile;
  }, [path]);
  const folderNoteFile = useMemo(() => {
    if (file instanceof TFolder) {
      const afile2 = getAbstractFileAtPath(app, path + ".md");
      return afile2;
    }
    return file;
  }, [file]);
  const folderPath = file?.parent.path;
  const dbPath = folderContextFromFolder(props.plugin, folderPath);
  const [tags, setTags] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({ context: true });
  useEffect(() => {
    allTagsForFile(props.plugin, file).then((t) => setTags(t));
  }, [file]);
  const contextExists = getAbstractFileAtPath(app, dbPath);
  const changeActiveFile = (evt: CustomEvent) => {
    setActiveFilePath(evt.detail.filePath);
    setSelectedFilePath(null);
  };

  const changeSelectedFile = (evt: CustomEvent) => {
    setSelectedFilePath(evt.detail.filePath);
  };

  useEffect(() => {
    window.addEventListener(eventTypes.activeFileChange, changeActiveFile);
    window.addEventListener(eventTypes.selectedFileChange, changeSelectedFile);
    props.plugin.activeFileChange();
    return () => {
      window.removeEventListener(eventTypes.activeFileChange, changeActiveFile);
      window.removeEventListener(
        eventTypes.selectedFileChange,
        changeSelectedFile
      );
    };
  }, []);

  return file ? (
    <div className="mk-file-context">
      <div className="mk-file-context-component">
        <FileSticker plugin={props.plugin} filePath={file.path}></FileSticker>
        <div>{fileNameToString(file.name)}</div>
      </div>
      <div
        onClick={(e) => {
          setExpandedSections((f) => ({ ...f, context: !f["context"] }));
          e.stopPropagation();
        }}
        className="mk-section-title"
      >
        <div className="mk-tree-text">Context</div>
        <button
          className={`mk-collapse mk-inline-button ${
            !expandedSections["context"] ? "mk-collapsed" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-collapse-sm"] }}
        ></button>
      </div>
      {expandedSections["context"] && (
        <div className="mk-file-context-component">
          {file && folderPath != "/" && (
            <MDBProvider
              plugin={props.plugin}
              dbPath={dbPath}
              folder={folderPath}
            >
              <FileContextList
                plugin={props.plugin}
                path={file.path}
              ></FileContextList>
            </MDBProvider>
          )}
          {tags.map((tag) => (
            <MDBProvider
              plugin={props.plugin}
              dbPath={tagContextFromTag(props.plugin, tag)}
              tag={tag}
            >
              <FileContextList
                plugin={props.plugin}
                path={file.path}
              ></FileContextList>
            </MDBProvider>
          ))}
        </div>
      )}
      {folderNoteFile && (
        <>
          <div
            onClick={(e) => {
              setExpandedSections((f) => ({
                ...f,
                backlinks: !f["backlinks"],
              }));
              e.stopPropagation();
            }}
            className="mk-section-title"
          >
            <div className="mk-tree-text">Backlinks</div>
            <button
              className={`mk-collapse mk-inline-button ${
                !expandedSections["backlinks"] ? "mk-collapsed" : ""
              }`}
              dangerouslySetInnerHTML={{
                __html: uiIconSet["mk-ui-collapse-sm"],
              }}
            ></button>
          </div>
          {expandedSections["backlinks"] && (
            <div className="mk-file-context-component">
              <Backlinks
                plugin={props.plugin}
                path={folderNoteFile.path}
              ></Backlinks>
            </div>
          )}
        </>
      )}
    </div>
  ) : (
    <></>
  );
};
