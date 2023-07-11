import { EditorView } from "@codemirror/view";
import { MDBProvider } from "components/ContextView/MDBContext";
import { TagsView } from "components/ContextView/TagsView/TagsView";
import { FileSticker } from "components/FileSticker/FileSticker";
import { showSelectMenu } from "components/ui/menus/menuItems";
import { showNewPropertyMenu } from "components/ui/menus/newPropertyMenu";
import { imageModal } from "components/ui/modals/imageModal";
import { insertContextColumn } from "dispatch/mdb";
import i18n from "i18n";
import MakeMDPlugin from "main";
import { TAbstractFile, TFile } from "obsidian";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FileMetadataCache } from "types/cache";
import { MDBField } from "types/mdb";
import { FMMetadataKeys } from "types/space";
import { SpaceChangeEvent, eventTypes } from "types/types";
import { mdbContextByPath, tagContextFromTag } from "utils/contexts/contexts";
import { platformIsMobile, renameFile, tFileToAFile } from "utils/file";
import { uiIconSet } from "utils/icons";
import { saveFrontmatterValue } from "utils/metadata/frontmatter/fm";
import { addTagToNote, loadTags, removeTagFromFile } from "utils/metadata/tags";
import { fileNameToString, folderPathFromFolderNoteFile } from "utils/strings";
import { selectElementContents } from "utils/tree";
import { FileContextList } from "./FileContextList";
import { FrontmatterView } from "./FrontmatterView";
import { NoteBannerView } from "./NoteBannerView";

export const InlineFileContextView = (props: {
  plugin: MakeMDPlugin;
  file: TAbstractFile;
  showHeader?: boolean;
  showBanner?: boolean;
  editable: boolean;
  editorView?: EditorView;
  isFolderNote?: boolean;
}) => {
  const { file } = props;
  const folderPath = file?.parent?.path;

  const getFileCache = (file: TAbstractFile) => {
    if (!file || file.path == "/") return null;
    const cache = props.plugin.index.filesIndex.get(file.path);
    if (!cache) {
      return props.plugin.index.filesIndex.get(
        folderPathFromFolderNoteFile(props.plugin.settings, tFileToAFile(file))
      );
    }
    return cache;
  };
  const [fileCache, setFileCache] = useState<FileMetadataCache>(
    getFileCache(props.file)
  );
  const metadataFilePath = useMemo(() => {
    if (!fileCache) return null;
    if (fileCache.isFolder && fileCache.folderNote) {
      return fileCache.folderNote.folderNotePath;
    }
    return fileCache.path;
  }, [fileCache]);
  const showHeader = props.showHeader;
  const [collapsed, setCollapsed] = useState(
    !showHeader ? false : !props.plugin.settings.inlineContextExpanded
  );
  const tags = fileCache?.tags ?? [];
  const contexts = useMemo(() => {
    return (fileCache?.contexts ?? [])
      .map((f) => props.plugin.index.contextsIndex.get(f))
      .filter((f) => f)
      .map((f) => f.info);
  }, [fileCache]);
  const banner = fileCache?.banner;
  useEffect(() => {
    props.plugin.settings.inlineContextExpanded = !collapsed;
    props.plugin.saveSettings();
  }, [collapsed]);
  const fileNameRef = useRef(null);

  const refreshFile = () => {
    if (!file || !file.parent) {
      return;
    }
    const fileCache = getFileCache(file);
    setFileCache(fileCache);
  };

  const cacheChanged = (evt?: SpaceChangeEvent) => {
    if (evt.detail.type == "file" && evt.detail.name == file.path) {
      refreshFile();
    }
    if (
      evt.detail.type == "context" &&
      contexts.some((f) => f.contextPath == evt.detail.name)
    ) {
      refreshFile();
    }
  };
  useEffect(() => {
    window.addEventListener(eventTypes.spacesChange, cacheChanged);
    refreshFile();
    return () => {
      window.removeEventListener(eventTypes.spacesChange, cacheChanged);
    };
  }, [file]);

  const changeCover = (e: React.MouseEvent) => {
    const vaultChangeModal = new imageModal(
      props.plugin,
      props.plugin.app,
      (image) =>
        saveFrontmatterValue(
          props.plugin,
          fileCache.path,
          props.plugin.settings.fmKeyBanner,
          image,
          "image",
          true
        )
    );
    vaultChangeModal.open();
  };
  const showContextMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const f = loadTags(props.plugin);
    showSelectMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        multi: false,
        editable: true,
        value: [],
        options: f.map((m) => ({ name: m, value: m })),
        saveOptions: (_, value) => addTag(value[0]),
        placeholder: i18n.labels.contextItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      }
    );
  };
  const addTag = (tag: string) => {
    if (file instanceof TFile && file.extension == "md")
      addTagToNote(tag, file);
  };
  const removeTag = (tag: string) => {
    if (file instanceof TFile && file.extension == "md")
      removeTagFromFile(tag, file);
  };
  const saveField = (source: string, field: MDBField) => {
    if (source == "fm") {
      saveFrontmatterValue(
        props.plugin,
        fileCache.path,
        field.name,
        "",
        field.type,
        true
      );
      return;
    }
    if (source == "") {
      insertContextColumn(
        props.plugin,
        mdbContextByPath(props.plugin, fileCache.parent),
        field
      );
      return;
    }
    insertContextColumn(
      props.plugin,
      tagContextFromTag(props.plugin, source),
      field
    );
  };
  const newProperty = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showNewPropertyMenu(
      props.plugin,
      { x: offset.left, y: offset.top + 30 },
      tags,
      [],
      saveField,
      "files",
      folderPath,
      true
    );
  };
  const onBlur = (e: React.ChangeEvent<HTMLDivElement>) => {
    const newValue = e.target.innerHTML;
    if (newValue != fileNameToString(file.name)) {
      renameFile(props.plugin, file, newValue + ".md");
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
      props.editorView?.focus();
      e.preventDefault();
    }
    if (e.key == "Escape") {
      // fileNameRef.current.innerHTML = fileNameToString(file.name);
      (e.target as HTMLDivElement).blur();
      props.editorView?.focus();
      e.preventDefault();
    }
  };
  useLayoutEffect(() => {
    props.editorView?.requestMeasure();
  }, []);

  useEffect(() => {
    if (file?.name.startsWith("Untitled")) {
      selectElementContents(fileNameRef.current);
    }
    const pasteEvent = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    };
    fileNameRef.current?.addEventListener("paste", pasteEvent);
    return () => {
      fileNameRef.current?.removeEventListener("paste", pasteEvent);
    };
  }, [fileNameRef]);
  return (
    <>
      {props.showBanner && (
        <NoteBannerView
          plugin={props.plugin}
          link={banner}
          file={props.file}
        ></NoteBannerView>
      )}
      <div className="mk-file-context-component">
        <div
          className={`mk-spacer`}
          style={
            {
              "--header-height":
                props.showBanner && banner
                  ? (
                      (platformIsMobile() ? 1 : 0) * 26 +
                      138 +
                      (!props.plugin.settings.spacesStickers ||
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

        <div
          className={`mk-file-context-file ${
            props.plugin.settings.inlineContextNameLayout == "horizontal"
              ? "mk-file-context-file-horizontal"
              : ""
          }`}
        >
          {showHeader && (
            <>
              {props.plugin.settings.spacesStickers && fileCache ? (
                <FileSticker plugin={props.plugin} fileCache={fileCache} />
              ) : (
                <></>
              )}

              <div
                className="mk-inline-title inline-title"
                ref={fileNameRef}
                contentEditable={props.editable}
                onBlur={onBlur}
                onDrop={(e) => e.preventDefault()}
                onKeyDown={onKeyDown}
                onKeyPress={onKeyPress}
                onKeyUp={onKeyUp}
                dangerouslySetInnerHTML={{
                  __html: fileNameToString(file.name),
                }}
              ></div>
            </>
          )}
          {
            <div
              className={`mk-collapse mk-icon-xsmall mk-file-context-collapse ${
                collapsed ? "mk-collapsed" : ""
              }`}
              dangerouslySetInnerHTML={{
                __html: uiIconSet["mk-ui-collapse"],
              }}
              onClick={(e) => {
                setCollapsed(!collapsed);
                e.stopPropagation();
              }}
            ></div>
          }
        </div>
        {!collapsed && props.editable ? (
          <>
            <div className="mk-file-context-field-new">
              <button onClick={(e) => newProperty(e)}>
                <div
                  className="mk-icon-xsmall"
                  dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-plus"] }}
                ></div>
                {platformIsMobile() ? "Property" : "Add Property"}
              </button>
              <button onClick={(e) => showContextMenu(e)}>
                <div
                  className="mk-icon-xsmall"
                  dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-tags"] }}
                ></div>
                {platformIsMobile() ? "Tag" : "Add Tag"}
              </button>
              {props.showBanner || props.isFolderNote ? (
                <button onClick={(e) => changeCover(e)}>
                  <div
                    className="mk-icon-xsmall"
                    dangerouslySetInnerHTML={{
                      __html: uiIconSet["mk-make-image"],
                    }}
                  ></div>
                  {platformIsMobile() ? "Cover" : "Change Cover"}
                </button>
              ) : (
                <></>
              )}
            </div>
            {tags.length > 0 ? (
              <TagsView
                plugin={props.plugin}
                tags={tags}
                removeTag={removeTag}
                canOpen={true}
              ></TagsView>
            ) : (
              <></>
            )}
          </>
        ) : (
          <div style={{ height: 16 }}></div>
        )}
      </div>
      {!collapsed && fileCache ? (
        <div className="mk-file-context-component">
          {metadataFilePath && (
            <FrontmatterView
              plugin={props.plugin}
              path={fileCache.path}
              metadataPath={metadataFilePath}
              folder={folderPath}
              tags={tags}
              excludeKeys={
                showHeader || props.isFolderNote
                  ? FMMetadataKeys(props.plugin)
                  : []
              }
              editable={props.editable}
            ></FrontmatterView>
          )}
          {contexts.map((context, i) => (
            <MDBProvider
              key={i}
              plugin={props.plugin}
              context={context}
              file={fileCache.path}
            >
              <FileContextList
                plugin={props.plugin}
                path={fileCache.path}
                color={"var(--tag-background)"}
              ></FileContextList>
            </MDBProvider>
          ))}

          {props.editable ? (
            <div style={{ height: props.showHeader ? 16 : 8 }}></div>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <></>
      )}
    </>
  );
};
