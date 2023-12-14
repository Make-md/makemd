import { SelectOptionType } from "core/react/components/UI/Menus/menu";
import { SelectMenu, SelectMenuProps } from "makemd-core";
import { Menu, MenuItem } from "obsidian";
import React from "react";
import "react-day-picker/dist/style.css";
import { createRoot } from "react-dom/client";

export const inputMenuItem = (
  menuItem: MenuItem,
  value: string,
  setValue: (value: string) => void
) => {
  const frag = document.createDocumentFragment();
  const spanEl = frag.createEl("span");
  const inputEl = frag.createEl("input");
  inputEl.type = "text";
  inputEl.value = value;

  inputEl.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    // e.target.focus();
  });
  inputEl.addEventListener("mousedown", (e) => {
    e.stopImmediatePropagation();
  });
  inputEl.addEventListener("mouseup", (e) => {
    e.stopImmediatePropagation();
  });
  inputEl.addEventListener("blur", (e) => {
    setValue(inputEl.value);
  });
  menuItem.dom.toggleClass("mk-menu-input", true);
  menuItem.setTitle(frag);
  return menuItem;
};

export type Point = { x: number; y: number };

export const showSelectMenu = (point: Point, optionProps: SelectMenuProps) => {
  const menu = new Menu();
  menu.dom.toggleClass("mk-menu", true);
  menu.setUseNativeMenu(false);
  const frag = document.createDocumentFragment();
  const div = frag.createDiv("mk-options-container");
  div.style.minHeight =
    Math.min(
      window.innerHeight - 40,
      optionProps.searchable
        ? 200
        : optionProps.options.filter(
            (f) => f.type != SelectOptionType.Separator
          ).length *
            28 +
            optionProps.options.filter(
              (f) => f.type == SelectOptionType.Separator
            ).length *
              12
    ).toString() + "px";
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
  menu.onHide(() => optionProps.onHide && optionProps.onHide());
  const root = createRoot(div);
  root.render(
    <>
      <SelectMenu
        hide={() => {
          menu.hide();
          optionProps.onHide && optionProps.onHide();
        }}
        {...optionProps}
      ></SelectMenu>
    </>
  );
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
  return menu;
};
