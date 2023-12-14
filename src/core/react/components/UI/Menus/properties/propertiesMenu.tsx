import i18n from "core/i18n";

import { Superstate } from "core/superstate/superstate";
import { Pos } from "types/Pos";
import { SpaceProperty } from "types/mdb";
import { SelectOption, defaultMenu, menuInput, menuSeparator } from "../menu";

export const showPropertiesMenu = (
  superstate: Superstate,
  position: Pos,
  property: SpaceProperty,
  deleteProperty: (property: SpaceProperty) => void,
  syncProperty: (property: SpaceProperty) => void,
  renameProperty: (key: string, name: string) => void,
  changeType: (position: Pos, key: string) => void
) => {
  const menuOptions: SelectOption[] = [];
  menuOptions.push(
    menuInput(property?.name ?? "", (value) =>
      renameProperty(property.name, value)
    )
  );
  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.menu.changePropertyType,
    icon: "lucide//list",
    onClick: (e) => {
      changeType(position, property.name);
    },
  });
  if (property.type != "object")
    menuOptions.push({
      name: i18n.menu.syncToContext,
      icon: "lucide//sync",
      onClick: (e) => {
        syncProperty(property);
      },
    });
  menuOptions.push({
    name: i18n.menu.deleteProperty,
    icon: "lucide//trash-2",
    onClick: (e) => {
      deleteProperty(property);
    },
  });
  superstate.ui.openMenu(position, defaultMenu(superstate.ui, menuOptions));
};
