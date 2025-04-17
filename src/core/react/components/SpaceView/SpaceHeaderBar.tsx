import { SpaceContext } from "core/react/context/SpaceContext";
import {
  saveSpaceCache,
  saveSpaceTemplate,
} from "core/superstate/utils/spaces";
import { isString } from "lodash";
import { i18n, SelectOptionType, Superstate } from "makemd-core";
import React, { useContext, useMemo } from "react";
import { defaultTableFields } from "shared/schemas/fields";
import { SpaceTableSchema } from "shared/types/mdb";
import { Rect } from "shared/types/Pos";
import { uniqueNameFromString } from "shared/utils/array";
import { windowFromDocument } from "shared/utils/dom";
import { sanitizeTableName } from "shared/utils/sanitizers";
import { defaultMenu, menuSeparator } from "../UI/Menus/menu/SelectionMenu";
import { showApplyItemsMenu } from "../UI/Menus/navigator/showApplyItemsMenu";
import { showLinkMenu } from "../UI/Menus/properties/linkMenu";
import { InputModal } from "../UI/Modals/InputModal";
import {
  DefaultFolderNoteMDBTables,
  DefaultMDBTables,
} from "./Frames/DefaultFrames/DefaultFrames";

export const SpaceHeaderBar = (props: {
  superstate: Superstate;
  path: string;
  expandedSection: number;
  setExpandedSection: (section: number) => void;
  tables: SpaceTableSchema[];
  templates: string[];
}) => {
  const { tables, templates } = props;
  const { expandedSection, setExpandedSection } = props;
  const { spaceState } = useContext(SpaceContext);
  const linkCaches = useMemo(
    () => spaceState.metadata?.links ?? [],
    [spaceState]
  );
  const allItems = useMemo(() => {
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
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, [
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
        },
        // {
        //   name: i18n.labels.newAction,
        //   description: i18n.descriptions.spaceActions,
        //   icon: "ui//mouse-pointer-click",
        //   onClick: (e) => newAction(e),
        // },
        menuSeparator,
        {
          name: "Export to HTML",
          description: i18n.descriptions.spaceActions,
          icon: "ui//mouse-pointer-click",
          onClick: (e) => {
            setExpandedSection(4);
          },
        },
        menuSeparator,
        {
          name: "Toggle Read Mode",
          description: "Toggle read mode for the space",
          icon: "ui//eye",
          onClick: (e) => {
            saveSpaceCache(props.superstate, spaceState.space, {
              ...spaceState.metadata,
              readMode: !spaceState.metadata.readMode,
            });
          },
        },
        menuSeparator,
        {
          name: "Apply to Items",
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
          name: "Reset View",
          description: "Reset the view to the default settings",
          icon: "ui//table",
          onClick: (e) => {
            props.superstate.spaceManager.saveFrame(
              spaceState.path,
              props.superstate.spaceManager.superstate.settings.enableFolderNote
                ? DefaultFolderNoteMDBTables.main
                : DefaultMDBTables.main
            );
          },
        },
      ]),
      win
    );
  };

  return (
    <div className="mk-space-context-bar">
      <div className="mk-space-context-bar-section">
        <div>{allItems} Items</div>
        <button
          aria-label="Pins"
          className={`mk-toolbar-button ${
            expandedSection == 0 ? "mk-active" : ""
          }`}
          onClick={() => setExpandedSection(expandedSection == 0 ? null : 0)}
        >
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//pin"),
            }}
          ></div>
        </button>
        <button
          aria-label="Joins"
          className={`mk-toolbar-button ${
            expandedSection == 1 ? "mk-active" : ""
          }`}
          onClick={() => setExpandedSection(expandedSection == 1 ? null : 1)}
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
            onClick={() => setExpandedSection(expandedSection == 2 ? null : 2)}
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
            onClick={() => setExpandedSection(expandedSection == 3 ? null : 3)}
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
