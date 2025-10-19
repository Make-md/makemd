import { ContextTableCrumb } from "core/react/components/UI/Crumbs/ContextTableCrumb";
import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { isPhone } from "core/utils/ui/screen";
import { SelectOption, Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React, { useContext, useState } from "react";
import { defaultTableFields } from "shared/schemas/fields";
import { SpaceTableSchema } from "shared/types/mdb";
import { uniqueNameFromString } from "shared/utils/array";
import { windowFromDocument } from "shared/utils/dom";
import {
  contextEmbedStringFromContext,
  contextPathForSpace,
} from "shared/utils/makemd/embed";
import { sanitizeTableName } from "shared/utils/sanitizers";
import { showSpacesMenu } from "../UI/Menus/properties/selectSpaceMenu";

export const SpaceListProperty = (props: {
  superstate: Superstate;
  tables: SpaceTableSchema[];
}) => {
  const { tables } = props;
  const { pathState } = useContext(PathContext);
  const { spaceState } = useContext(SpaceContext);
  const [collapsed, setCollapsed] = useState(true);

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
  const viewContextMenu = (e: React.MouseEvent, _schema: SpaceTableSchema) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: "Open Table",
      icon: "ui//table",
      onClick: (e) => {
        props.superstate.ui.openPath(
          contextPathForSpace(spaceState, _schema.id),
          e.metaKey
        );
      },
    });
    menuOptions.push({
      name: i18n.menu.copyEmbedLink,
      icon: "ui//link",
      onClick: (e) => {
        navigator.clipboard.writeText(
          contextEmbedStringFromContext(spaceState, _schema.id)
        );
      },
    });

    menuOptions.push({
      name: i18n.menu.moveFile,
      icon: "ui//move",
      onClick: (e) => {
        const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
        showSpacesMenu(
          offset,
          windowFromDocument(e.view.document),
          props.superstate,
          async (space) => {
            const table = await props.superstate.spaceManager.readTable(
              spaceState.path,
              _schema.id
            );
            const tables = await props.superstate.spaceManager.readAllTables(
              spaceState.path
            );
            table.schema.id = uniqueNameFromString(
              sanitizeTableName(table.schema.id),
              Object.keys(tables)
            );
            table.cols = table.cols.map((f) => ({
              ...f,
              schemaId: table.schema.id,
            }));
            props.superstate.spaceManager
              .createTable(space, table.schema)
              .then((f) =>
                props.superstate.spaceManager.saveTable(space, table)
              );
          }
        );
      },
    });

    menuOptions.push({
      name: i18n.menu.duplicate,
      icon: "ui//copy",
      onClick: (e) => {
        props.superstate.ui.openModal(
          i18n.labels.duplicateTable,
          <InputModal
            value=""
            saveLabel={i18n.buttons.save}
            saveValue={async (value) => {
              const table = await props.superstate.spaceManager.readTable(
                spaceState.path,
                _schema.id
              );
              const tables = await props.superstate.spaceManager.readAllTables(
                spaceState.path
              );
              table.schema.id = uniqueNameFromString(
                sanitizeTableName(value),
                Object.keys(tables)
              );
              table.cols = table.cols.map((f) => ({
                ...f,
                schemaId: table.schema.id,
              }));
              props.superstate.spaceManager
                .createTable(spaceState.path, table.schema)
                .then((f) =>
                  props.superstate.spaceManager.saveTable(
                    spaceState.path,
                    table
                  )
                )
                .then((f) => {
                  if (f)
                    return props.superstate.reloadContextByPath(
                      spaceState.path,
                      { force: true, calculate: true }
                    );
                  return f;
                });
            }}
          ></InputModal>,
          windowFromDocument(e.view.document)
        );
      },
    });

    menuOptions.push({
      name: i18n.buttons.renameView,
      icon: "ui//edit",
      onClick: (e) => {
        props.superstate.ui.openModal(
          i18n.labels.renameView,
          <InputModal
            value={_schema.name}
            saveLabel={i18n.labels.renameView}
            saveValue={(value) => {
              props.superstate.spaceManager.saveTableSchema(
                pathState.path,
                _schema.id,
                () => ({
                  ..._schema,
                  name: value,
                })
              );
            }}
          ></InputModal>,
          windowFromDocument(e.view.document)
        );
      },
    });

    menuOptions.push({
      name: i18n.buttons.delete,
      icon: "ui//trash",
      onClick: (e) => {
        props.superstate.spaceManager.deleteTable(pathState.path, _schema.id);
      },
    });
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };
  return (
    <div className="mk-space-editor-smart">
      <div className="mk-props-list">
        {tables.map((f, i) => (
          <ContextTableCrumb
            key={i}
            superstate={props.superstate}
            schema={f}
            onClick={(e) => {
              if (isPhone(props.superstate.ui)) {
                viewContextMenu(e, f);
              } else {
                props.superstate.ui.openPath(
                  contextPathForSpace(spaceState, f.id),
                  e.metaKey
                );
              }
            }}
            onContextMenu={(e) => {
              viewContextMenu(e, f);
            }}
          ></ContextTableCrumb>
        ))}
        <button
          className="mk-toolbar-button"
          aria-label={i18n.labels.newTable}
          onClick={(e) => newTable(e)}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//plus"),
          }}
        ></button>
      </div>
    </div>
  );
};
