import { Menu, Point } from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";

export const showTimePickerMenu = (
  point: Point,
  value: string,
  setValue: (date: string) => void
) => {
  const menu = new Menu();
  menu.dom.toggleClass("mk-menu", true);
  menu.setUseNativeMenu(false);
  const frag = document.createDocumentFragment();
  const div = frag.createEl("div");
  div.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    // e.target.focus();
  });
  div.addEventListener("mousedown", (e) => {
    e.stopImmediatePropagation();
  });
  div.addEventListener("mouseup", (e) => {
    e.stopImmediatePropagation();
  });
  div.addEventListener("keydown", (e) => {});

  const setTime = (time: string) => {
    setValue(time);
    menu.hide();
  };

  const root = createRoot(div);
  root.render(<></>);
  menu.addItem((item) => {
    item.setTitle(frag);
  });
  const keys = [...menu.scope.keys];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].key != "Escape") {
      menu.scope.unregister(keys[i]);
    }
  }

  menu.showAtPosition(point);
};
