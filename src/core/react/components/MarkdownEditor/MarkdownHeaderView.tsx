import { EditorView } from "@codemirror/view";
import i18n from "core/i18n";
import { NoteSpacesBar } from "core/react/components/SpaceView/Contexts/TagsView/NoteSpacesBar";
import { showNewPropertyMenu } from "core/react/components/UI/Menus/contexts/newSpacePropertyMenu";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import ImageModal from "core/react/components/UI/Modals/ImageModal";
import { PathStickerView } from "core/react/components/UI/Stickers/PathSticker/PathSticker";
import { Superstate } from "core/superstate/superstate";
import {
  savePathBanner,
  updatePrimaryAlias,
} from "core/superstate/utils/label";
import {
  addPathToSpaceAtIndex,
  createSpace,
  removePathsFromSpace,
  saveProperties,
} from "core/superstate/utils/spaces";
import { addTagToPath } from "core/superstate/utils/tags";
import { PathState } from "core/types/superstate";
import { renamePathWithExtension } from "core/utils/uri";
import he from "he";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { defaultContextSchemaID } from "schemas/mdb";
import { SpaceProperty } from "types/mdb";
import { selectElementContents } from "utils/dom";
import { defaultValueForType } from "utils/properties";
import { ContextPropertiesView } from "../Explorer/ContextPropertiesView";
import { triggerSpaceMenu } from "../UI/Menus/navigator/spaceContextMenu";
import { BannerView } from "./BannerView";

export const MarkdownHeaderView = (props: {
  superstate: Superstate;
  path: string;
  showFolder?: boolean;
  showHeader?: boolean;
  showBanner?: boolean;
  showMetadata?: boolean;
  hiddenFields?: string[];
  editable: boolean;
  editorView?: EditorView;
}) => {
  const [cache, setCache] = useState<PathState>(
    props.superstate.pathsIndex.get(props.path)
  );

  const showHeader = props.showHeader;
  const [collapsed, setCollapsed] = useState(
    !showHeader ? false : !props.superstate.settings.inlineContextExpanded
  );

  const spaces = useMemo(
    () =>
      cache
        ? [...props.superstate.spacesMap.get(cache.path)]
            .map((f) => props.superstate.spacesIndex.get(f))
            .filter((f) => f)
            .map((f) => f.path)
        : [],
    [cache]
  );

  const banner =
    cache?.metadata.property?.[props.superstate.settings.fmKeyBanner];
  useEffect(() => {
    props.superstate.settings.inlineContextExpanded = !collapsed;
    props.superstate.saveSettings();
  }, [collapsed]);

  const fileNameRef = useRef(null);

  const refreshFile = () => {
    if (!props.path) {
      return;
    }

    setCache(props.superstate.pathsIndex.get(props.path));
  };

  const spaceStateUpdated = (payload: { path: string }) => {
    if (spaces.some((f) => f == payload.path)) {
      refreshFile();
    }
  };

  const pathStateUpdated = (payload: { path: string }) => {
    if (payload.path == props.path) {
      refreshFile();
    }
  };
  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      spaceStateUpdated
    );
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      pathStateUpdated
    );

    refreshFile();
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        spaceStateUpdated
      );
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        pathStateUpdated
      );
    };
  }, [props.path]);

  const addToSpace = async (spacePath: string) => {
    const spaceCache = props.superstate.spacesIndex.get(spacePath);
    if (spaceCache) {
      addPathToSpaceAtIndex(props.superstate, spaceCache, props.path, -1);
    }
  };
  const removeFromSpace = (spacePath: string) => {
    removePathsFromSpace(props.superstate, spacePath, [props.path]);
  };

  const fileName = useMemo(() => cache?.displayName ?? "", [cache]);

  const newProperty = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showNewPropertyMenu(
      props.superstate,
      { x: offset.left, y: offset.top + 30 },
      spaces,
      [],
      saveField,
      defaultContextSchemaID,
      null,
      true
    );
  };
  const onBlur = (e: React.ChangeEvent<HTMLDivElement>) => {
    const newValue = he.decode(e.target.innerHTML);
    if (newValue != fileName) {
      if (props.superstate.settings.spacesUseAlias) {
        updatePrimaryAlias(
          props.superstate,
          cache.path,
          cache.metadata.aliases,
          newValue.trim()
        );
      } else {
        props.superstate.spaceManager.renamePath(
          props.path,
          renamePathWithExtension(props.path, newValue)
        );
      }
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

  const changeCover = (e: React.MouseEvent) => {
    props.superstate.ui.openPalette((_props: { hide: () => void }) => (
      <ImageModal
        superstate={props.superstate}
        hide={_props.hide}
        selectedPath={(image) => {
          savePathBanner(props.superstate, cache.path, image);
        }}
      />
    ));
  };

  const showAddMenu = (e: React.MouseEvent) => {
    showSpacesMenu(
      e as unknown as MouseEvent,
      props.superstate,
      (link: string, isNew: boolean) => {
        if (isNew) {
          if (link.charAt(0) == "#") {
            addTagToPath(props.superstate, props.path, link);
          } else {
            createSpace(props.superstate, link, { links: [props.path] });
          }
        } else {
          addToSpace(link);
        }
      },
      false,
      true
    );
  };

  const saveField = (source: string, field: SpaceProperty) => {
    if (source == "fm") {
      saveProperties(props.superstate, cache.path, {
        [field.name]: defaultValueForType(field.type),
      });

      return;
    }
    props.superstate.spaceManager.addSpaceProperty(source, field);
  };
  const showContextMenu = (e: React.MouseEvent) => {
    triggerSpaceMenu(props.superstate, cache, e, null, null);
  };
  useEffect(() => {
    if (
      fileName?.startsWith(props.superstate.settings.newNotePlaceholder) ||
      fileName?.startsWith("Untitled")
    ) {
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
  }, [fileNameRef, fileName]);

  return (
    <>
      {props.showBanner && banner && (
        <BannerView
          superstate={props.superstate}
          bannerPath={banner}
          itemPath={props.path}
        ></BannerView>
      )}
      <div className="mk-path-context-component">
        {props.showBanner && banner && (
          <div
            className={`mk-spacer`}
            style={
              {
                "--mk-header-height":
                  (
                    (props.superstate.ui.getScreenType() == "mobile" ? 1 : 0) *
                      26 +
                    138 +
                    (!props.superstate.settings.spacesStickers ||
                    props.superstate.settings.inlineContextNameLayout ==
                      "horizontal"
                      ? 1
                      : 0) *
                      50
                  ).toString() + "px",
              } as React.CSSProperties
            }
            onContextMenu={(e) => e.preventDefault()}
          ></div>
        )}
        {showHeader && (
          <div
            className={`mk-path-context-file ${
              props.superstate.settings.inlineContextNameLayout == "horizontal"
                ? "mk-path-context-file-horizontal"
                : ""
            }`}
          >
            {props.superstate.settings.spacesStickers && cache ? (
              <PathStickerView
                superstate={props.superstate}
                pathState={cache}
              />
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
                __html: fileName,
              }}
            ></div>
            <div
              className={`mk-collapse mk-icon-xsmall mk-fold ${
                collapsed ? "mk-collapsed" : ""
              }`}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//mk-ui-collapse"),
              }}
              onClick={(e) => {
                setCollapsed(!collapsed);
                e.stopPropagation();
              }}
            ></div>
          </div>
        )}
        {!collapsed && props.editable ? (
          <>
            <div className="mk-path-context-field-new">
              <button onClick={(e) => newProperty(e)}>
                <div
                  className="mk-icon-xsmall"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//mk-ui-plus"),
                  }}
                ></div>
                {props.superstate.ui.getScreenType() == "mobile"
                  ? i18n.labels.newPropertyShort
                  : i18n.labels.newProperty}
              </button>

              <button onClick={(e) => showAddMenu(e)}>
                <div
                  className="mk-icon-xsmall"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("lucide//pin"),
                  }}
                ></div>
                {props.superstate.ui.getScreenType() == "mobile"
                  ? i18n.buttons.addToSpaceShort
                  : i18n.buttons.addToSpace}
              </button>
              {cache && (
                <button onClick={(e) => changeCover(e)}>
                  <div
                    className="mk-icon-xsmall"
                    dangerouslySetInnerHTML={{
                      __html:
                        props.superstate.ui.getSticker("ui//mk-make-image"),
                    }}
                  ></div>
                  {props.superstate.ui.getScreenType() == "mobile"
                    ? i18n.buttons.changeBannerShort
                    : i18n.buttons.changeBanner}
                </button>
              )}
              {cache?.type == "space" && (
                <button
                  aria-label={i18n.buttons.moreOptions}
                  className="mk-icon-xsmall mk-inline-button"
                  onClick={(e) => {
                    showContextMenu(e);
                  }}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//mk-ui-options"),
                  }}
                ></button>
              )}
            </div>
            {cache && (
              <NoteSpacesBar
                path={cache?.path}
                superstate={props.superstate}
                removeSpace={removeFromSpace}
                addSpace={addToSpace}
              ></NoteSpacesBar>
            )}
          </>
        ) : (
          <div style={{ height: 16 }}></div>
        )}
      </div>
      {!collapsed ? (
        <ContextPropertiesView
          superstate={props.superstate}
          spacePaths={spaces}
          path={props.path}
          showMetadata={props.showMetadata}
          hiddenFields={props.hiddenFields}
          editable={props.editable}
        />
      ) : (
        <></>
      )}
    </>
  );
};
