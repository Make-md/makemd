import { deleteRowInTable } from "core/utils/contexts/context";
import { SelectOption, Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React from "react";
import { PathPropertyName } from "shared/types/context";
import { windowFromDocument } from "shared/utils/dom";
import { defaultMenu } from "../menu/SelectionMenu";
import { showPathContextMenu } from "../navigator/pathContextMenu";

import { EditPropertiesSubmenu } from "./EditPropertyMenu";
import { openContextCreateItemModal } from "../../Modals/ContextCreateItemModal";

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
    onClick: async (e) => {
      // Get the row data for editing
      const rowData = rows[index];
      
      // Open the modal in edit mode with the row data
      openContextCreateItemModal(
        superstate,
        contextPath,
        schema,
        undefined, // frameSchema
        windowFromDocument(e.view.document),
        index, // Pass the actual row index (>= 0 for edit mode)
        rowData // Pass the initial data
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
