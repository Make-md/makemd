import i18n from "i18n";
import MakeMDPlugin from "main";
import { Menu, Point } from "obsidian";
import { MDBField } from "types/mdb";
import { inputMenuItem } from "./menuItems";

export const showFMMenu = (
  plugin: MakeMDPlugin,
  position: Point,
  property: MDBField,
  deleteProperty: (property: MDBField) => void,
  syncProperty: (property: MDBField) => void,
  renameProperty: (key: string, name: string) => void,
  changeType: (position: Point, key: string) => void
) => {
  const menu = new Menu();
  menu.setUseNativeMenu(false);

  menu.addItem((menuItem) => {
    inputMenuItem(menuItem, property?.name ?? "", (value) =>
      renameProperty(property.name, value)
    );
    menuItem.setIcon("type");
  });
  menu.addSeparator();
  menu.addItem((menuItem) => {
    menuItem.setTitle(i18n.menu.changePropertyType);
    menuItem.onClick(() => {
      changeType(position, property.name);
    });
    menuItem.setIcon("list");
  });
  if (property.type != "object")
    menu.addItem((menuItem) => {
      menuItem.setTitle(i18n.menu.syncToContext);
      menuItem.onClick(() => {
        syncProperty(property);
      });
      menuItem.setIcon("sync");
    });

  menu.addItem((menuItem) => {
    menuItem.setTitle(i18n.menu.deleteProperty);
    menuItem.onClick(() => {
      deleteProperty(property);
    });
    menuItem.setIcon("trash-2");
  });
  menu.addSeparator();

  menu.showAtPosition(position);
  return menu;
};
