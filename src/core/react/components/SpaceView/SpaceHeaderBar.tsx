import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { savePathBanner } from "core/superstate/utils/label";
import {
  metadataPathForSpace,
  saveSpaceCache,
  saveSpaceTemplate,
} from "core/superstate/utils/spaces";
import { removePathIcon, savePathIcon } from "core/utils/emoji";
import { isTouchScreen } from "core/utils/ui/screen";
import { isString } from "lodash";
import { i18n, SelectOption, SelectOptionType, Superstate } from "makemd-core";
import React, { useContext, useMemo } from "react";
import StickerModal from "shared/components/StickerModal";
import { defaultTableFields } from "shared/schemas/fields";
import { SpaceTableSchema } from "shared/types/mdb";
import { Rect } from "shared/types/Pos";
import { uniqueNameFromString } from "shared/utils/array";
import { windowFromDocument } from "shared/utils/dom";
import { sanitizeTableName } from "shared/utils/sanitizers";
import { defaultMenu, menuSeparator } from "../UI/Menus/menu/SelectionMenu";
import { showApplyItemsMenu } from "../UI/Menus/navigator/showApplyItemsMenu";
import { showLinkMenu } from "../UI/Menus/properties/linkMenu";
import ImageModal from "../UI/Modals/ImageModal";
import { InputModal } from "../UI/Modals/InputModal";
import {
  DefaultFolderNoteMDBTables,
  DefaultMDBTables,
} from "./Frames/DefaultFrames/DefaultFrames";

export const SpaceHeaderBar = (props: {
  superstate: Superstate;
  path: string;
  expandedSection?: number;
  setExpandedSection?: (section: number) => void;
  tables?: SpaceTableSchema[];
  templates?: string[];
}) => {
  const { expandedSection, setExpandedSection } = props;
  const { spaceState } = useContext(SpaceContext);
  const { pathState } = useContext(PathContext);

  const allItems = useMemo(() => {
    if (!spaceState) return 0;
    return [...props.superstate.spacesMap.getInverse(spaceState.path)].length;
  }, [spaceState]);

  const newTable = (e: React.MouseEvent) => {
    props.superstate.ui.openModal(
      i18n.labels.newTable,

      <InputModal
        value=""
        saveLabel={i18n.buttons.save}
        saveValue={(value) => {
          props.superstate.spaceManager
            .tablesForSpace(spaceState.path)
            .then((schemas) => {
              if (schemas) {
                const newSchema: SpaceTableSchema = {
                  id: uniqueNameFromString(
                    sanitizeTableName(value),
                    schemas.map((g) => g.id)
                  ),
                  name: value,
                  type: "db",
                };
                return props.superstate.spaceManager
                  .createTable(spaceState.path, newSchema)
                  .then((f) => {
                    return props.superstate.spaceManager.addSpaceProperty(
                      spaceState.path,
                      { ...defaultTableFields[0], schemaId: newSchema.id }
                    );
                  });
              }
            });
        }}
      ></InputModal>,
      windowFromDocument(e.view.document)
    );
  };
  const newTemplate = (offset: Rect, win: Window) => {
    return showLinkMenu(offset, win, props.superstate, (space) => {
      if (isString(space))
        saveSpaceTemplate(props.superstate, spaceState.path, space);
    });
  };
  const addNew = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const win = windowFromDocument(e.view.document);
    const hasSticker =
      pathState?.metadata.label?.[props.superstate.settings.fmKeySticker]
        ?.length > 0;
    const hasBanner =
      pathState?.metadata.property?.[props.superstate.settings.fmKeyBanner];
    const menuOptions: SelectOption[] = [];
    if (isTouchScreen(props.superstate.ui)) {
      if (hasSticker) {
        menuOptions.push({
          name: i18n.buttons.changeIcon,
          icon: "ui//sticker",
          onClick: (e: React.MouseEvent) =>
            props.superstate.ui.openPalette(
              <StickerModal
                ui={props.superstate.ui}
                selectedSticker={(emoji) =>
                  savePathIcon(props.superstate, pathState.path, emoji)
                }
              />,
              windowFromDocument(e.view.document)
            ),
        });
        menuOptions.push({
          name: i18n.buttons.removeIcon,
          icon: "ui//sticker",
          onClick: (e: React.MouseEvent) => {
            removePathIcon(props.superstate, pathState.path);
          },
        });
      } else {
        menuOptions.push({
          name: i18n.buttons.addIcon,
          icon: "ui//sticker",
          onClick: (e: React.MouseEvent) =>
            props.superstate.ui.openPalette(
              <StickerModal
                ui={props.superstate.ui}
                selectedSticker={(emoji) =>
                  savePathIcon(props.superstate, pathState.path, emoji)
                }
              />,
              windowFromDocument(e.view.document)
            ),
        });
      }

      menuOptions.push(menuSeparator);
      if (hasBanner) {
        menuOptions.push({
          name: i18n.buttons.changeBanner,
          icon: "ui//mk-make-image",
          onClick: (e: React.MouseEvent) =>
            props.superstate.ui.openPalette(
              <ImageModal
                superstate={props.superstate}
                selectedPath={(image) =>
                  savePathBanner(props.superstate, pathState.path, image)
                }
              ></ImageModal>,
              windowFromDocument(e.view.document)
            ),
        });

        menuOptions.push({
          name: i18n.buttons.removeBanner,
          icon: "ui//file-minus",
          onClick: (ev: React.MouseEvent) => {
            if (props.superstate.spacesIndex.has(pathState.path)) {
              props.superstate.spaceManager.deleteProperty(
                metadataPathForSpace(
                  props.superstate,
                  props.superstate.spacesIndex.get(pathState.path).space
                ),
                props.superstate.settings.fmKeyBanner
              );
            }
            props.superstate.spaceManager.deleteProperty(
              pathState.path,
              props.superstate.settings.fmKeyBanner
            );
          },
        });
      } else {
        menuOptions.push({
          name: i18n.buttons.addCover,
          icon: "ui//mk-make-image",
          onClick: (e: React.MouseEvent) =>
            props.superstate.ui.openPalette(
              <ImageModal
                superstate={props.superstate}
                selectedPath={(image) =>
                  savePathBanner(props.superstate, pathState.path, image)
                }
              ></ImageModal>,
              windowFromDocument(e.view.document)
            ),
        });
      }
    }
    if (spaceState) {
      if (isMobile) {
        menuOptions.push(menuSeparator);
        menuOptions.push({
          name: i18n.labels.editPins,
          description: i18n.descriptions.smartSearch,
          icon: "ui//pin",
          onClick: (e) => {
            setExpandedSection(expandedSection == 0 ? null : 0);
          },
        });
        menuOptions.push({
          name: i18n.labels.editJoins,
          description: i18n.descriptions.smartSearch,
          icon: "ui//merge",
          onClick: (e) => {
            setExpandedSection(expandedSection == 1 ? null : 1);
          },
        });
        menuOptions.push({
          name: i18n.labels.editTables,
          description: i18n.descriptions.spaceLists,
          icon: "ui//table",
          onClick: (e) => {
            setExpandedSection(expandedSection == 2 ? null : 2);
          },
        });
        menuOptions.push({
          name: i18n.labels.editTemplates,
          description: i18n.descriptions.spaceTemplates,
          icon: "ui//clipboard-pen",
          onClick: (e) => {
            setExpandedSection(expandedSection == 3 ? null : 3);
          },
        });
      } else {
        menuOptions.push(
          {
            name: i18n.labels.newTable,
            description: i18n.descriptions.spaceLists,
            icon: "ui//table",
            onClick: (e) => newTable(e),
          },
          {
            name: i18n.labels.template,
            description: i18n.descriptions.spaceTemplates,
            icon: "ui//clipboard-pen",
            onClick: (e) => newTemplate(offset, win),
          }
        );
      }
      menuOptions.push(
        menuSeparator,
        {
          name: i18n.labels.exportToHTML,
          description: i18n.descriptions.spaceActions,
          icon: "ui//mouse-pointer-click",
          onClick: (e) => {
            setExpandedSection(4);
          },
        },
        menuSeparator,
        {
          name: i18n.menu.toggleReadMode,
          description: i18n.descriptions.toggleReadMode,
          icon: "ui//eye",
          onClick: (e) => {
            saveSpaceCache(props.superstate, spaceState.space, {
              ...spaceState.metadata,
              readMode: !spaceState.metadata.readMode,
            });
          },
        },
        {
          name: i18n.menu.toggleFullWidth,
          description: i18n.descriptions.toggleFullWidth,
          icon: "ui//expand",
          onClick: (e) => {
            saveSpaceCache(props.superstate, spaceState.space, {
              ...spaceState.metadata,
              fullWidth: !spaceState.metadata.fullWidth,
            });
          },
        },
        menuSeparator,
        {
          name: i18n.labels.applyToItems,
          description: i18n.descriptions.spaceProperties,
          icon: "ui//list",
          type: SelectOptionType.Submenu,
          onSubmenu: (offset) => {
            return showApplyItemsMenu(
              offset,
              props.superstate,
              spaceState,
              win
            );
          },
        },
        menuSeparator,
        {
          name: i18n.labels.resetView,
          description: i18n.labels.resetViewDesc,
          icon: "ui//table",
          onClick: (e) => {
            props.superstate.spaceManager.saveFrame(
              spaceState.path,
              props.superstate.spaceManager.superstate.settings.enableFolderNote
                ? DefaultFolderNoteMDBTables.main
                : DefaultMDBTables.main
            );
          },
        }
      );
    }
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      win
    );
  };
  const isMobile = isTouchScreen(props.superstate.ui);
  return (
    <div className="mk-space-context-bar">
      {spaceState && !isMobile && (
        <>
          <div className="mk-space-context-bar-section">
            <div>{allItems} {i18n.labels.items}</div>
            <button
              aria-label={i18n.labels.pins}
              className={`mk-toolbar-button ${
                expandedSection == 0 ? "mk-active" : ""
              }`}
              onClick={() =>
                setExpandedSection(expandedSection == 0 ? null : 0)
              }
            >
              <div
                className="mk-icon-xsmall"
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//pin"),
                }}
              ></div>
            </button>
            <button
              aria-label={i18n.labels.joins}
              className={`mk-toolbar-button ${
                expandedSection == 1 ? "mk-active" : ""
              }`}
              onClick={() =>
                setExpandedSection(expandedSection == 1 ? null : 1)
              }
            >
              <div
                className="mk-icon-xsmall"
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//merge"),
                }}
              ></div>
            </button>
          </div>
          <div className="mk-space-context-bar-section">
            {props.tables.length > 0 && (
              <button
                className={`mk-toolbar-button ${
                  expandedSection == 2 ? "mk-active" : ""
                }`}
                onClick={() =>
                  setExpandedSection(expandedSection == 2 ? null : 2)
                }
              >
                <div
                  className="mk-icon-xsmall"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//table"),
                  }}
                ></div>
              </button>
            )}
            {props.templates.length > 0 && (
              <button
                className={`mk-toolbar-button ${
                  expandedSection == 3 ? "mk-active" : ""
                }`}
                onClick={() =>
                  setExpandedSection(expandedSection == 3 ? null : 3)
                }
              >
                <div
                  className="mk-icon-xsmall"
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//clipboard-pen"),
                  }}
                ></div>
              </button>
            )}
          </div>
        </>
      )}
      <div className="mk-space-context-bar-section">
        <button className="mk-toolbar-button" onClick={(e) => addNew(e)}>
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//options"),
            }}
          ></div>
        </button>
      </div>
    </div>
  );
};
