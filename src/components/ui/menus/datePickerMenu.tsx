import { Menu, Point } from "obsidian";
import React from "react";
import { DayPicker } from "react-day-picker";
import { createRoot } from "react-dom/client";

export const showDatePickerMenu = (
  point: Point,
  value: Date,
  setValue: (date: Date) => void,
  format?: string
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

  const setDate = (date: Date) => {
    setValue(date);
    menu.hide();
  };

  const root = createRoot(div);
  root.render(
    <>
      <DayPicker
        defaultMonth={value}
        mode="single"
        selected={value}
        labels={{
          labelMonthDropdown: () => undefined,
          labelYearDropdown: () => undefined,
          labelNext: () => undefined,
          labelPrevious: () => undefined,
          labelDay: () => undefined,
          labelWeekday: () => undefined,
          labelWeekNumber: () => undefined,
        }}
        onSelect={setDate}
      />
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
