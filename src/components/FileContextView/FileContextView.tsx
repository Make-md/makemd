import { TAbstractFile } from "obsidian";
import React, { useEffect, useMemo, useState } from "react";

import { ItemView, TFolder, ViewStateResult, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ActivePathEvent, eventTypes, Path } from "types/types";
import { getAbstractFileAtPath } from "utils/file";
import { pathByString } from "utils/path";
import MakeMDPlugin from "../../main";
import { Backlinks } from "./Backlinks";
import { InlineFileContextView } from "./InlineFileContextView";
export const FILE_CONTEXT_VIEW_TYPE = "make-context-view";
export const ICON = "component";
export const VIEW_DISPLAY_TEXT = "Context Explorer";

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

export const FileContextView = (props: { plugin: MakeMDPlugin }) => {
  const [selectedPath, setSelectedPath] = useState<Path>(null);
  const [selectedRow, setSelectedRow] = useState<TAbstractFile>(null);
  const selectedContext = useMemo(() => {
    if (!selectedPath) return null;
    if (
      selectedPath.type == "folder" ||
      selectedPath.type == "space" ||
      selectedPath.type == "tag"
    ) {
      return props.plugin.index.contextsIndex.get(selectedPath.path)?.info;
    } else {
      return null;
    }
  }, [selectedPath]);
  const file = useMemo(() => {
    const afile = getAbstractFileAtPath(app, selectedPath?.path);
    return afile;
  }, [selectedPath]);
  const folderNoteFile = useMemo(() => {
    if (file instanceof TFolder) {
      const afile2 = getAbstractFileAtPath(app, file.path + ".md");
      return afile2;
    }
    return file;
  }, [file]);

  const changeSelectedFile = (evt: CustomEvent<ActivePathEvent>) => {
    const path = evt.detail.path;
    if (evt.detail.selection) {
      setSelectedPath(pathByString(evt.detail.selection));
    } else {
      setSelectedPath(path);
    }
  };

  useEffect(() => {
    props.plugin.activeFileChange();
  }, []);
  useEffect(() => {
    window.addEventListener(eventTypes.activePathChange, changeSelectedFile);
    return () => {
      window.removeEventListener(
        eventTypes.activePathChange,
        changeSelectedFile
      );
    };
  }, [file]);

  return (
    <div className="mk-file-context">
      {file && (
        <InlineFileContextView
          plugin={props.plugin}
          file={file}
          showHeader={true}
          showBanner={false}
          editable={true}
        ></InlineFileContextView>
      )}
      {selectedRow && (
        <InlineFileContextView
          plugin={props.plugin}
          file={selectedRow}
          showHeader={true}
          showBanner={false}
          editable={true}
        ></InlineFileContextView>
      )}

      {file && (
        <Backlinks plugin={props.plugin} file={folderNoteFile}></Backlinks>
      )}
    </div>
  );
};
