import { deleteRowInTable } from "core/utils/contexts/context";
import { SelectOption, Superstate, i18n } from "makemd-core";
import React from "react";
import { PathPropertyName } from "shared/types/context";
import { windowFromDocument } from "shared/utils/dom";
import { defaultMenu } from "../menu/SelectionMenu";
import { showPathContextMenu } from "../navigator/pathContextMenu";
import { showSpaceContextMenu } from "../navigator/spaceContextMenu";
import { EditPropertiesSubmenu } from "./EditPropertyMenu";

export const showRowContextMenu = async (
  e: React.MouseEvent | React.TouchEvent,
  superstate: Superstate,
  contextPath: string,
  schema: string,
  index: number
) => {
  e.preventDefault();
  const context = await superstate.spaceManager.readTable(contextPath, schema);
  const dbSchema = context?.schema;
  const rows = context?.rows;
  if (!context) return;
  if (dbSchema.primary == "true") {
    const row = rows.find((f, i) => i == index);
    if (row) {
      if (superstate.spacesIndex.has(row[PathPropertyName])) {
        const pathState = superstate.pathsIndex.get(row[PathPropertyName]);
        if (pathState)
          showSpaceContextMenu(superstate, pathState, e, "", contextPath);
        return;
      }
      showPathContextMenu(
        superstate,
        row[PathPropertyName],
        contextPath,
        (e.target as HTMLElement).getBoundingClientRect(),
        windowFromDocument(e.view.document)
      );
      return;
    }
  }
  const menuOptions: SelectOption[] = [];
  const propertiesProps = {
    superstate,
    pathState: superstate.pathsIndex.get(contextPath),
    path: contextPath,
    schema,
    index,
  };
  menuOptions.push({
    name: i18n.menu.editProperties,
    icon: "ui//list",
    onClick: (e) => {
      superstate.ui.openCustomMenu(
        e.currentTarget.getBoundingClientRect(),
        <EditPropertiesSubmenu {...propertiesProps}></EditPropertiesSubmenu>,
        propertiesProps,
        windowFromDocument(e.view.document)
      );
    },
  });
  menuOptions.push({
    name: i18n.menu.deleteRow,
    icon: "ui//trash",
    onClick: (e) => {
      deleteRowInTable(
        superstate.spaceManager,
        superstate.spacesIndex.get(contextPath)?.space,
        schema,
        index
      );
    },
  });
  superstate.ui.openMenu(
    (e.target as HTMLElement).getBoundingClientRect(),
    defaultMenu(superstate.ui, menuOptions),
    windowFromDocument(e.view.document)
  );
};
