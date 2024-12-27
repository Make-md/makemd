import { UIManager } from "core/middleware/ui";
import { SelectMenuProps, SelectOption, SelectOptionType } from "makemd-core";
import React from "react";
import { windowFromDocument } from "shared/utils/dom";
import { parseMultiString } from "utils/parsers";

export const showDisclosureMenu = (
  ui: UIManager,
  e: React.MouseEvent,
  multi: boolean,
  editable: boolean,
  value: string,
  options: SelectOption[],
  saveOptions: (options: string[], value: string[]) => void
) => {
  const offset = (e.target as HTMLElement).getBoundingClientRect();
  ui.openMenu(
    offset,
    {
      ui: ui,
      multi,
      editable,
      value: parseMultiString(value) ?? [],
      options,
      saveOptions,
      searchable: true,
      showAll: true,
      isDisclosure: true,
    },
    windowFromDocument(e.view.document)
  );
};

export const menuInput = (
  value: string,
  setValue: (value: string) => void
): SelectOption => ({
  name: "",
  type: SelectOptionType.Input,
  value,
  onValueChange: setValue,
});

export const menuSection = (name: string): SelectOption => ({
  name: name,
  type: SelectOptionType.Section,
  disabled: true,
});

export const menuSeparator: SelectOption = {
  name: "",
  type: SelectOptionType.Separator,
  disabled: true,
};
export const defaultMenu = (
  ui: UIManager,
  options: SelectOption[]
): SelectMenuProps => ({
  ui,
  multi: false,
  value: [],
  editable: false,
  options,
  searchable: false,
  showAll: true,
});
