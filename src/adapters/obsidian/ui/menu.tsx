import { Menu } from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";
import { Pos } from "types/Pos";

export const ObsidianMenu = (props: {
  position: Pos;
  fc: React.FC<{ hide: () => void }>;
}) => {
  const menu = new Menu();
  menu.setUseNativeMenu(false);

  const frag = document.createDocumentFragment();

  const div = frag.createDiv();
  div.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
  });
  div.addEventListener("keydown", (e) => {});
  const root = createRoot(div);
  root.render(<props.fc hide={() => menu.hide()}></props.fc>);
  menu.addItem((menuItem) => {
    menuItem.setTitle(frag);
    menuItem.dom.toggleClass("mk-menu-custom", true);
  });

  const keys = [...menu.scope.keys];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].key != "Escape") {
      menu.scope.unregister(keys[i]);
    }
  }
  menu.showAtPosition(props.position);
  return menu;
};
