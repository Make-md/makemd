import { UIManager } from "core/middleware/ui";
import { MenuObject } from "core/utils/ui/menu";
import React, { MouseEvent } from "react";
import { Rect } from "types/Pos";
import { windowFromDocument } from "utils/dom";
import { parseMultiString } from "utils/parsers";

export enum SelectOptionType {
  Section = -2,
  Separator = -1,
  Option = 0,
  Disclosure = 1,
  Input = 2,
  Radio = 3,
  Toggle = 4,
  Custom = 5,
  Submenu = 6,
}

export type SelectSection = {
  name: string;
  value: string;
};
//Overloaded component that handles menu selection
export type SelectOption = {
  id?: number;
  name: string;
  fragment?: React.FC<{ hide: () => void }>;
  value?: any;
  color?: string;
  section?: string;
  description?: string;
  icon?: string;
  sortable?: boolean;
  removeable?: boolean;
  disabled?: boolean;
  type?: SelectOptionType;
  onToggle?: () => void;
  onReorder?: (value: string, newValue: string) => void;
  onClick?: (ev: MouseEvent) => void;
  onSubmenu?: (offset: Rect, onHide: () => void) => MenuObject;
  onValueChange?: (value: string) => void;
  onMoreOptions?: (e: React.MouseEvent) => void;
};

export type SelectMenuProps = {
  ui: UIManager;
  multi?: boolean;
  value: string[];
  editable: boolean;
  options: SelectOption[];
  addKeyword?: string;
  defaultOptions?: SelectOption[];
  saveOptions?: (options: string[], value: string[], isNew?: boolean) => void;
  removeOption?: (option: string) => void;
  placeholder?: string;
  detail?: boolean;
  searchable?: boolean;
  sections?: SelectSection[];
  showAll?: boolean;
  showSections?: boolean;
  previewComponent?: React.ReactNode;
  onMoreOption?: (e: React.MouseEvent, option: string) => void;
  onHover?: (option: any) => void;
  onHide?: () => void;
  isDisclosure?: boolean;
  wrapperClass?: string;
  onSelectSection?: (section: string) => void;
};

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
