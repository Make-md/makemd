import React, { useCallback, useEffect, useState } from "react";
import SelectMenuComponent from "./selectMenu/SelectMenuComponent";

export type SelectOption = {
  id?: number;
  name: string;
  value: string;
  section?: string;
  description?: string;
  icon?: string;
  sortable?: boolean;
  removeable?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
};

export type SelectMenuProps = {
  multi: boolean;
  value: string[];
  editable: boolean;
  options: SelectOption[];
  defaultOptions?: SelectOption[];
  saveOptions: (options: string[], value: string[]) => void;
  placeholder?: string;
  detail?: boolean;
  searchable: boolean;
  showAll?: boolean;
  previewComponent?: React.ReactNode;
  onHover?: (option: string) => void;
  onHide?: () => void;
};

export const SelectMenu = React.forwardRef(
  (props: SelectMenuProps & { hide: () => void; }, ref: any) => {
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
        (v) => initialOptions.find((f) => f.value == v) ?? {
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
          newTags.map((f) => f.value)
        );
      },
      [suggestions, tags]
    );

    const onAddition = useCallback(
      (newTag: SelectOption) => {
        let tag = newTag;
        let newSuggestions = suggestions;
        let newTags = tags;
        if (!suggestions.find((s) => s.value == newTag.value)) {
          tag = {
            id: suggestions.length + 1,
            name: newTag.name,
            value: newTag.name,
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
          newTags.map((f) => f.value)
        );
        if (!props.multi) {
          props.hide();
        }
      },
      [tags, suggestions]
    );
    const onValidation = useCallback(
      (newTag) => {
        if (!props.editable &&
          !suggestions.find((s) => s.value == newTag.value)) {
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
        ref={ref}
        onDelete={onDelete}
        onAddition={onAddition}
        onValidate={onValidation}
        defaultSuggestions={props.defaultOptions}
        placeholderText={props.placeholder ?? ""}
        minQueryLength={0}
        onHover={props.onHover}
        hoverSelect={props.onHover ? true : false}
        maxSuggestionsLength={props.showAll ? Math.min(50, props.options.length) : 8}
        suggestionsOnly={!props.searchable && !props.editable}
        allowNew={props.editable}
        previewComponent={props.previewComponent} />
    );
  }
);
