import i18n from "shared/i18n";

import { SelectOption, Superstate } from "makemd-core";
import { Rect } from "shared/types/Pos";
import { SpaceProperty } from "shared/types/mdb";
import { defaultMenu, menuInput, menuSeparator } from "../menu/SelectionMenu";

export const showPropertiesMenu = (
  superstate: Superstate,
  rect: Rect,
  win: Window,
  property: SpaceProperty,
  deleteProperty: (property: SpaceProperty) => void,
  syncProperty: (property: SpaceProperty) => void,
  renameProperty: (key: string, name: string) => void,
  changeType: (e: React.MouseEvent, key: string) => void
) => {
  const menuOptions: SelectOption[] = [];
  menuOptions.push(
    menuInput(property?.name ?? "", (value) =>
      renameProperty(property.name, value),
      ""
    )
  );
  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.menu.changePropertyType,
    icon: "ui//list",
    onClick: (e) => {
      changeType(e, property.name);
    },
  });
  if (property.type != "object")
    menuOptions.push({
      name: i18n.menu.syncToContext,
      icon: "ui//sync",
      onClick: (e) => {
        syncProperty(property);
      },
    });
  menuOptions.push({
    name: i18n.menu.deleteProperty,
    icon: "ui//trash",
    onClick: (e) => {
      deleteProperty(property);
    },
  });

  superstate.ui.openMenu(rect, defaultMenu(superstate.ui, menuOptions), win);
};
