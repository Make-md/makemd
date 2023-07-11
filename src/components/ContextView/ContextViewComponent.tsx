import { EditorView } from "@codemirror/view";
import { portalTypeAnnotation } from "cm-extensions/markSans/callout";
import { NoteBannerView } from "components/FileContextView/NoteBannerView";
import { FileSticker } from "components/FileSticker/FileSticker";
import "css/FlowComponent.css";
import MakeMDPlugin from "main";
import { TFile, WorkspaceLeaf } from "obsidian";
import React, { useEffect, useRef, useState } from "react";
import { ContextInfo } from "types/contextInfo";
import { SpaceChangeEvent, eventTypes } from "types/types";
import { renameContext } from "utils/contexts/contexts";
import {
  getAbstractFileAtPath,
  getFolderFromPath,
  platformIsMobile,
  tFileToAFile,
} from "utils/file";
import { spawnPortal } from "utils/flow/flowEditor";
import { contextDisplayName, folderNotePathFromAFile } from "utils/strings";
import { ContextListView } from "./ContextListView";
import { FilterBar } from "./FilterBar/FilterBar";
import { TableSelector } from "./FilterBar/TableSelector";
import { MDBProvider } from "./MDBContext";

export interface ContextViewComponentProps {
  context: ContextInfo;
  plugin: MakeMDPlugin;
}

export const ContextViewComponent = (props: ContextViewComponentProps) => {
  const context = props.context;
  const contextCache = props.plugin.index.contextsIndex.get(
    context.contextPath
  );

  const [folderCache, setFolderCache] = useState(null);
  const [currentFlowNotePath, setCurrentFlowNotePath] = useState(null);
  const refreshCache = () => {
    if (props.context.type == "folder") {
      setFolderCache(
        props.plugin.index.filesIndex.get(props.context.contextPath)
      );
      return;
    }
    setFolderCache(null);
  };
  const name = contextCache?.name ?? contextDisplayName(props.context);
  const ref = useRef<HTMLDivElement>(null);
  const [flowOpen, setFlowOpen] = useState(
    props.plugin.settings.folderNoteDefaultView &&
      props.plugin.settings.enableFolderNote
  );

  const loadFile = async () => {
    if (!folderCache) return;
    const folderNotePath = folderNotePathFromAFile(
      props.plugin.settings,
      folderCache
    );
    const folderNote = getAbstractFileAtPath(app, folderNotePath);
    // if (currentFlowNotePath == folderNote.path) {
    //   return;
    // } else {
    //   setCurrentFlowNotePath(folderNote.path);
    // }

    const div = ref.current;
    spawnPortal(props.plugin, div, folderCache.name, async (editor) => {
      let leaf: WorkspaceLeaf;
      if (folderNote) {
        leaf = await editor.openFile(folderNote as TFile);
      } else {
        const newFile = await app.fileManager.createNewMarkdownFile(
          app.vault.getRoot(),
          folderNotePath
        );
        leaf = await editor.openFile(newFile as TFile);
      }
      if (!leaf?.view?.editor) {
        return;
      }
      const view = leaf.view.editor?.cm as EditorView;
      view.dispatch({
        annotations: [portalTypeAnnotation.of("foldernote")],
      });
    });
  };
  const cacheChanged = (evt?: SpaceChangeEvent) => {
    if (evt.detail.type == "file" && evt.detail.name == context.contextPath) {
      refreshCache();
    }
  };
  useEffect(() => {
    window.addEventListener(eventTypes.spacesChange, cacheChanged);
    refreshCache();
    return () => {
      window.removeEventListener(eventTypes.spacesChange, cacheChanged);
    };
  }, [props.context]);
  useEffect(() => {
    if (flowOpen && folderCache) {
      loadFile();
    } else {
      if (ref.current) ref.current.empty();
    }
  }, [flowOpen, folderCache]);
  const viewFolderNote = (open: boolean) => {
    setFlowOpen(open);
  };
  const fileNameRef = useRef(null);
  const onBlur = (e: React.ChangeEvent<HTMLDivElement>) => {
    const newValue = e.target.innerHTML;
    if (newValue != name) {
      renameContext(props.plugin, context, newValue);
    }
  };
  const onKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.key == "a" && e.metaKey) {
      e.preventDefault();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(e.target as HTMLDivElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    if (e.key == "Enter") {
      (e.target as HTMLDivElement).blur();
      e.preventDefault();
    }
    if (e.key == "Escape") {
      // fileNameRef.current.innerHTML = fileNameToString(file.name);
      (e.target as HTMLDivElement).blur();
      e.preventDefault();
    }
  };

  return (
    <div className="mk-folder-scroller markdown-source-view mod-cm6 is-readable-line-width">
      {props.plugin.settings.enableFolderNote &&
      props.context.type == "folder" ? (
        <MDBProvider plugin={props.plugin} context={context}>
          {folderCache?.banner && (
            <NoteBannerView
              plugin={props.plugin}
              link={folderCache.banner}
            ></NoteBannerView>
          )}
          <div className="mk-folder-outer cm-line">
            <div className="mk-folder-header">
              {folderCache && (
                <div
                  className={`mk-spacer`}
                  style={
                    {
                      "--header-height": folderCache.banner
                        ? (
                            (platformIsMobile() ? 1 : 0) * 26 +
                            138 +
                            (!folderCache.sticker ||
                            props.plugin.settings.inlineContextNameLayout ==
                              "horizontal"
                              ? 1
                              : 0) *
                              50
                          ).toString() + "px"
                        : 0,
                    } as React.CSSProperties
                  }
                  onContextMenu={(e) => e.preventDefault()}
                ></div>
              )}
              <div
                className={`mk-file-context-file ${
                  props.plugin.settings.inlineContextNameLayout == "horizontal"
                    ? "mk-file-context-file-horizontal"
                    : ""
                }`}
              >
                {props.plugin.settings.spacesStickers && folderCache ? (
                  <FileSticker plugin={props.plugin} fileCache={folderCache} />
                ) : (
                  <></>
                )}

                <div
                  className="mk-inline-title inline-title"
                  ref={fileNameRef}
                  contentEditable={true}
                  onBlur={onBlur}
                  onDrop={(e) => e.preventDefault()}
                  onKeyDown={onKeyDown}
                  onKeyPress={onKeyPress}
                  onKeyUp={onKeyUp}
                  dangerouslySetInnerHTML={{
                    __html: name,
                  }}
                ></div>
              </div>

              <TableSelector
                plugin={props.plugin}
                folderNoteName={
                  getFolderFromPath(app, props.context.contextPath)?.name
                }
                folderNoteOpen={flowOpen}
                folderNotePath={folderNotePathFromAFile(
                  props.plugin.settings,
                  tFileToAFile(
                    getAbstractFileAtPath(app, props.context.contextPath)
                  )
                )}
                viewFolderNote={viewFolderNote}
              ></TableSelector>
            </div>
          </div>
          {context && !flowOpen && (
            <>
              <FilterBar plugin={props.plugin}></FilterBar>
              <ContextListView plugin={props.plugin}></ContextListView>
            </>
          )}
          {flowOpen && (
            <div className="mk-folder-outer">
              <div
                className="mk-flowspace-editor mk-foldernote cm-sizer"
                ref={ref}
              ></div>
            </div>
          )}
        </MDBProvider>
      ) : (
        <MDBProvider plugin={props.plugin} context={context}>
          <div className="mk-context-header">
            <div
              className="mk-inline-title inline-title"
              ref={fileNameRef}
              contentEditable={true}
              onBlur={onBlur}
              onDrop={(e) => e.preventDefault()}
              onKeyDown={onKeyDown}
              onKeyPress={onKeyPress}
              onKeyUp={onKeyUp}
              dangerouslySetInnerHTML={{
                __html: name,
              }}
            ></div>
            {props.context.type == "folder" && (
              <TableSelector plugin={props.plugin}></TableSelector>
            )}
          </div>
          <FilterBar plugin={props.plugin}></FilterBar>
          <ContextListView plugin={props.plugin}></ContextListView>
        </MDBProvider>
      )}
    </div>
  );
};
