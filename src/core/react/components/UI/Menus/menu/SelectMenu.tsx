import { PointerModifiers } from "core/types/ui";
import React, { useCallback, useEffect, useState } from "react";
import SelectMenuComponent from "./SelectMenuComponent";
import {
  SelectMenuProps,
  SelectOption,
  SelectOptionType,
} from "./SelectionMenu";

const SelectMenu = React.forwardRef(
  (props: SelectMenuProps & { hide?: () => void }, ref: any) => {
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
      (tagIndex: number) => {
        const newTags = tags.filter((_, i) => i !== tagIndex);
        setTags(newTags);
        if (props.saveOptions)
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
        if (props.saveOptions)
          props.saveOptions(
            newSuggestions.map((f) => f.value),
            newTags.map((f) => f.value),
            true
          );
        if (!props.multi && newTag.type != SelectOptionType.Disclosure) {
          props.hide();
        }
      },
      [tags, suggestions]
    );
    const onValidation = useCallback(
      (newTag: SelectOption) => {
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
        addKeyword={props.addKeyword}
        hide={props.hide}
        onDelete={onDelete}
        wrapperClass={props.wrapperClass}
        onMoreOption={props.onMoreOption}
        onDeleteOption={onDeleteOption}
        onAddition={onAddition}
        onValidate={onValidation}
        onSelectSection={props.onSelectSection}
        defaultSuggestions={props.defaultOptions}
        placeholderText={props.placeholder ?? ""}
        minQueryLength={0}
        onHover={props.onHover}
        showSections={props.showSections}
        sections={props.sections}
        maxSuggestionsLength={
          props.showAll ? Math.min(50, props.options.length) : 25
        }
        suggestionsOnly={!props.searchable && !props.editable}
        allowNew={props.editable}
        previewComponent={props.previewComponent}
        isDisclosure={props.isDisclosure}
      />
    );
  }
);

SelectMenu.displayName = "SelectMenu";
export default SelectMenu;
