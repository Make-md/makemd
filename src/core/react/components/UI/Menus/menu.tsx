import { UIManager } from "core/middleware/ui";
import { PointerModifiers } from "core/types/ui";
import React, { MouseEvent, useCallback, useEffect, useState } from "react";
import { parseMultiString } from "utils/parsers";
import SelectMenuComponent from "./menu/SelectMenuComponent";

export enum SelectOptionType {
  Separator = -1,
  Option = 0,
  Disclosure = 1,
  Input = 2,
  Radio = 3,
  Toggle = 3,
  Custom = 4,
}

//Overloaded component that handles menu selection
export type SelectOption = {
  id?: number;
  name: string;
  fragment?: React.FC;
  value?: any;
  section?: string;
  description?: string;
  icon?: string;
  sortable?: boolean;
  removeable?: boolean;
  disabled?: boolean;
  type?: SelectOptionType;
  onToggle?: () => void;
  onClick?: (ev: MouseEvent) => void;
  onValueChange?: (value: string) => void;
};

export type SelectMenuProps = {
  ui: UIManager;
  multi: boolean;
  value: string[];
  editable: boolean;
  options: SelectOption[];
  defaultOptions?: SelectOption[];
  saveOptions?: (options: string[], value: string[], isNew?: boolean) => void;
  removeOption?: (option: string) => void;
  placeholder?: string;
  detail?: boolean;
  searchable: boolean;
  sections?: string[];
  showAll?: boolean;
  showSections?: boolean;
  previewComponent?: React.ReactNode;
  onMoreOption?: (e: React.MouseEvent, option: string) => void;
  onHover?: (option: string) => void;
  onHide?: () => void;
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
    { x: offset.right + 10, y: offset.top },
    {
      ui: ui,
      multi,
      editable,
      value: parseMultiString(value) ?? [],
      options,
      saveOptions,
      searchable: true,
      showAll: true,
    }
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

const SelectMenu = React.forwardRef(
  (props: SelectMenuProps & { hide: () => void }, ref: any) => {
    const initialOptions: SelectOption[] = props.options.map((o, i) => {
      return {
        ...o,
        id: i + 1,
      };
    });
    useEffect(() => {
      setSuggestions(
        props.options.map((o, i) => {
          return {
            ...o,
            id: i + 1,
          };
        })
      );
    }, [props.options]);
    const [suggestions, setSuggestions] = useState(initialOptions);
    const [tags, setTags] = useState(
      props.value.map(
        (v) =>
          initialOptions.find((f) => f.value == v) ?? {
            id: 0,
            name: v,
            value: v,
          }
      )
    );

    const onDelete = useCallback(
      (tagIndex) => {
        const newTags = tags.filter((_, i) => i !== tagIndex);
        setTags(newTags);
        props.saveOptions(
          suggestions.map((f) => f.value),
          newTags.map((f) => f.value),
          false
        );
      },
      [suggestions, tags, props]
    );

    const onDeleteOption = useCallback(
      (removeTag: string) => {
        const newSuggestions = suggestions.filter((f) => f.value != removeTag);
        const newTags = tags.filter((f) => f.value != removeTag);
        setSuggestions(newSuggestions);
        setTags(newTags);
        if (props.removeOption) props.removeOption(removeTag);
        props.hide();
      },
      [tags, suggestions, props]
    );
    const onAddition = useCallback(
      (newTag: SelectOption, modifiers: PointerModifiers) => {
        let tag = newTag;
        let newSuggestions = suggestions;
        let newTags = tags;
        if (!suggestions.find((s) => s.value == newTag.value)) {
          tag = {
            id: suggestions.length + 1,
            name: newTag.name,
            value: newTag.value ?? newTag.name,
          };
          newSuggestions = [...suggestions, tag];
          setSuggestions(newSuggestions);
        }
        if (props.multi) {
          if (!tags.find((t) => t.value == tag.value)) {
            newTags = [...tags, tag];
            setTags(newTags);
          }
        } else {
          newTags = [tag];
          setTags(newTags);
        }
        props.saveOptions(
          newSuggestions.map((f) => f.value),
          newTags.map((f) => f.value),
          true
        );
        if (!props.multi) {
          props.hide();
        }
      },
      [tags, suggestions]
    );
    const onValidation = useCallback(
      (newTag) => {
        if (
          !props.editable &&
          !suggestions.find((s) => s.value == newTag.value)
        ) {
          return false;
        }
        if (newTag.name.length == 0) {
          return false;
        }

        return true;
      },
      [suggestions]
    );

    return (
      <SelectMenuComponent
        tags={props.multi ? tags : []}
        suggestions={suggestions}
        ui={props.ui}
        ref={ref}
        hide={props.hide}
        onDelete={onDelete}
        onMoreOption={props.onMoreOption}
        onDeleteOption={onDeleteOption}
        onAddition={onAddition}
        onValidate={onValidation}
        defaultSuggestions={props.defaultOptions}
        placeholderText={props.placeholder ?? ""}
        minQueryLength={0}
        onHover={props.onHover}
        hoverSelect={props.onHover ? true : false}
        showSections={props.showSections}
        sections={props.sections}
        maxSuggestionsLength={
          props.showAll ? Math.min(50, props.options.length) : 25
        }
        suggestionsOnly={!props.searchable && !props.editable}
        allowNew={props.editable}
        previewComponent={props.previewComponent}
      />
    );
  }
);

SelectMenu.displayName = "SelectMenu";

export default SelectMenu;
