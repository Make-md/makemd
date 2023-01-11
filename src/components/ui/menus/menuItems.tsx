import { KeymapEventHandler, Menu, MenuItem, Point, Scope } from "obsidian";
import React, { useRef } from "react";
import { createRoot } from "react-dom/client";
import "css/Menu.css";
import "react-day-picker/dist/style.css";
import { splitString } from "utils/contexts/predicate/predicate";
import { SelectMenu } from "./selectMenu";
import { SelectOption, SelectMenuProps } from "components/ui/menus/selectMenu";

export const inputMenuItem = (
  menuItem: MenuItem,
  value: string,
  setValue: (value: string) => void
) => {
  const frag = document.createDocumentFragment();
  const spanEl = frag.createEl("span");
  const inputEl = frag.createEl("input");
  inputEl.value = value;
  // setTimeout(() => {
  //     inputEl.focus();
  // }, 100)

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



export const disclosureSelectMenuItem = (
  menuItem: MenuItem,
  option: SelectOption,
  selectValue: (value: string) => void
) => {
  const frag = document.createDocumentFragment();
  const div = frag.createDiv("");
  div.textContent = option.name;
  div.addEventListener("click", (e) => {
    selectValue(option.value);
    e.stopImmediatePropagation();
  });
  div.addEventListener("mousedown", (e) => {
    e.stopImmediatePropagation();
    e.preventDefault();
  });
  div.addEventListener("mouseup", (e) => {
    e.stopImmediatePropagation();
    e.preventDefault();
  });
  menuItem.setTitle(frag);
  return menuItem;
};

export const showSelectMenu = (point: Point, optionProps: SelectMenuProps) => {
  const menu = new Menu();
  menu.dom.toggleClass("mk-menu", true);
  menu.setUseNativeMenu(false);
  const frag = document.createDocumentFragment();
  const div = frag.createDiv("mk-options-container");
  div.style.minHeight =
    Math.min(
      200,
      (optionProps.options.length + (optionProps.searchable ? 1 : 0)) * 28
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

export const disclosureMenuItem = (
  menuItem: MenuItem,
  multi: boolean,
  editable: boolean,
  title: string,
  value: string,
  options: SelectOption[],
  saveOptions: (options: string[], value: string[]) => void
): MenuItem => {
  const frag = document.createDocumentFragment();
  const div = frag.createDiv("title");
  div.textContent = title;
  const div2 = frag.createDiv("disclosure");
  div2.textContent = value;
  menuItem.setTitle(frag);

  menuItem.onClick((ev: MouseEvent) => {
    ev.stopPropagation();

    const offset = menuItem.dom.getBoundingClientRect();
    showSelectMenu(
      { x: offset.right + 10, y: offset.top },
      {
        multi,
        editable,
        value: splitString(value) ?? [],
        options,
        saveOptions,
        searchable: true,
        showAll: true,
      }
    );
  });
  return menuItem;
};
