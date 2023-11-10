// Adapted from React Tags https://github.com/react-tags/react-tags

import { SelectOption } from "components/ui/menus/selectMenu";
import i18n from "i18n";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import SelectMenuInput from "./SelectMenuInput";
import SelectMenuPillComponent from "./SelectMenuPill";
import SelectMenuSuggestions from "./SelectMenuSuggestions";
import { focusNextElement } from "./concerns/focusNextElement";
import { matchAny, matchExact } from "./concerns/matchers";

const KEYS = {
  ENTER: "Enter",
  TAB: "Tab",
  BACKSPACE: "Backspace",
  UP_ARROW: "ArrowUp",
  UP_ARROW_COMPAT: "Up",
  DOWN_ARROW: "ArrowDown",
  DOWN_ARROW_COMPAT: "Down",
};

const CLASS_NAMES = {
  root: "mk-options-menu",
  rootFocused: "is-focused",
  selected: "mk-options-menu__selected",
  selectedTag: "mk-options-menu__selected-tag",
  selectedTagName: "mk-options-menu__selected-tag-name",
  search: "mk-options-menu__search",
  searchWrapper: "mk-options-menu__search-wrapper",
  searchInput: "mk-options-menu__search-input",
  suggestions: "mk-options-menu__suggestions",
  suggestionActive: "is-active",
  suggestionDisabled: "is-disabled",
};

const defaultProps: SelectMenuComponentProps = {
  id: "SelectMenu",
  tags: [],
  suggestionsOnly: false,
  placeholderText: i18n.labels.optionItemSelectPlaceholder,
  noSuggestionsText: null,
  newTagText: null,
  suggestions: [],
  suggestionsFilter: defaultSuggestionsFilter,
  suggestionsTransform: null,
  classNames: CLASS_NAMES,
  delimiters: [KEYS.ENTER],
  minQueryLength: 2,
  maxSuggestionsLength: 8,
  inputAttributes: {},
  hoverSelect: false,
};

type SelectMenuComponentProps = {
  id?: string;
  tags?: SelectOption[];
  suggestionsOnly?: boolean;
  placeholderText?: string;
  hoverSelect?: boolean;
  ariaLabelText?: string;
  noSuggestionsText?: string;
  newTagText?: string;
  defaultSuggestions?: SelectOption[];
  suggestions?: SelectOption[];
  suggestionsFilter?: (item: SelectOption, query: string) => void;
  suggestionsTransform?: (
    query: string,
    suggestions: SelectOption[]
  ) => SelectOption[];
  delimiters?: string[];
  previewComponent?: React.ReactNode;
  onDelete?: (id: number) => void;
  onDeleteOption?: (value: string) => void;
  onAddition?: (tag: SelectOption) => void;
  onHover?: (value: string) => void;
  onToggle?: (value: string) => void;
  onInput?: (input: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onValidate?: (tag: SelectOption) => boolean;
  minQueryLength?: number;
  maxSuggestionsLength?: number;
  classNames?: Record<string, string>;
  inputAttributes?: Record<string, any>;
  allowNew?: boolean;
};

const findMatchIndex = (options: SelectOption[], query: string) => {
  return options.findIndex((option) => matchExact(query).test(option.name));
};

const pressDelimiter = (
  props: SelectMenuComponentProps,
  query: string,
  index: number,
  options: SelectOption[],
  addTag: (tag: SelectOption) => void
) => {
  if (query.length >= props.minQueryLength) {
    // Check if the user typed in an existing suggestion.
    const match = findMatchIndex(options, query);
    const _index = index === -1 ? match : index;
    const tag = _index > -1 ? options[_index] : null;
    if (tag) {
      addTag(tag);
    } else {
      addTag({ name: query, value: query });
    }
  }
};

function defaultSuggestionsFilter(item: SelectOption, query: string) {
  const regexp = matchAny(query);
  return regexp.test(item.name);
}

function getOptions(props: SelectMenuComponentProps, query: string) {
  let options: SelectOption[];

  if (props.suggestionsTransform) {
    options = props.suggestionsTransform(query, props.suggestions);
  } else {
    options = props.suggestions.filter((item) =>
      props.suggestionsFilter(item, query)
    );
  }

  options = options.slice(0, props.maxSuggestionsLength);

  if (props.newTagText && findMatchIndex(options, query) === -1) {
    options.push({ id: 0, name: query, value: query });
  } else if (props.noSuggestionsText && options.length === 0) {
    options.push({
      id: 0,
      name: props.noSuggestionsText,
      value: "",
      disabled: true,
    });
  }

  return options;
}

const SelectMenuComponent = React.forwardRef(
  (_props: SelectMenuComponentProps, ref: any) => {
    const props = { ...defaultProps, ..._props };
    const [options, setOptions] = useState<SelectOption[]>([]);

    const inputRef = useRef(null);
    const [query, setQuery] = useState("");
    const [focused, setFocused] = useState(false);
    const [index, setIndex] = useState(0);
    const onComposition = useRef(false);
    useEffect(() => {
      if (ref) {
        ref.current = () => {
          if (!focused) {
            inputRef?.current?.focus();
            setFocused(true);
            return false;
          }
          return true;
        };
      }
    }, [focused]);
    useEffect(() => {
      if (index != -1 && props.onHover && props.hoverSelect) {
        debounceFn(options[index]?.value);
      }
    }, [index, options]);

    const debounceFn = useCallback(
      debounce(handleDebounceFn, 300, {
        leading: false,
      }),
      []
    );
    function handleDebounceFn(inputValue: string) {
      props.onHover(inputValue);
    }

    useEffect(() => {
      if (query.length == 0 && props.defaultSuggestions) {
        setOptions(props.defaultSuggestions);
        return;
      }
      setOptions(getOptions(props, query));
    }, [query, props.suggestions]);

    const container = useRef(null);

    const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      //React doesn't handle IME i.e. chinese inputs
      if (e.type === "compositionstart") {
        onComposition.current = true;
        return;
      }
      // IME method end
      if (e.type === "compositionend") {
        onComposition.current = false;
      }

      if (onComposition.current) {
        return;
      }
      const _query = e.target.value;
      if (props.onInput) {
        props.onInput(_query);
      }
      // NOTE: This test is a last resort for soft keyboards and browsers which do not
      // support `KeyboardEvent.key`.
      // <https://bugs.chromium.org/p/chromium/issues/detail?id=763559>
      // <https://bugs.chromium.org/p/chromium/issues/detail?id=118639>
      if (
        _query.length === query.length + 1 &&
        props.delimiters.indexOf(query.slice(-1)) > -1
      ) {
        pressDelimiter(props, query, index, options, addTag);
      } else if (_query !== query) {
        setQuery(_query);
      }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
      // when one of the terminating keys is pressed, add current query to the tags
      if (props.delimiters.indexOf(e.key) > -1) {
        if (query || index > -1) {
          e.preventDefault();
        }

        pressDelimiter(props, query, index, options, addTag);
      }

      // when backspace key is pressed and query is blank, delete the last tag
      if (e.key === KEYS.BACKSPACE) {
        pressBackspaceKey();
      }

      if (e.key === KEYS.UP_ARROW || e.key === KEYS.UP_ARROW_COMPAT) {
        pressUpKey(e);
      }

      if (e.key === KEYS.DOWN_ARROW || e.key === KEYS.DOWN_ARROW_COMPAT) {
        pressDownKey(e);
      }
    };

    const onBlur = () => {
      setFocused(false);
      if (props.onBlur) {
        props.onBlur();
      }
    };

    const onFocus = () => {
      setFocused(true);

      if (props.onFocus) {
        props.onFocus();
      }
    };

    const onDeleteTag = (index: number, event: React.MouseEvent) => {
      // Because we'll destroy the element with cursor focus we need to ensure
      // it does not get lost and move it to the next interactive element
      if (container.current) {
        focusNextElement(container.current, event.currentTarget);
      }

      deleteTag(index);
    };

    const addTag = (tag: SelectOption) => {
      if (tag.disabled) {
        return;
      }

      if (props.onValidate && !props.onValidate(tag)) {
        return;
      }

      props.onAddition(tag);

      clearInput();
    };

    const deleteTag = (i: number) => {
      props.onDelete(i);
    };

    const clearInput = () => {
      setQuery("");
      setIndex(-1);
    };

    const clearSelectedIndex = () => {
      setIndex(-1);
    };

    const pressUpKey = (e: React.KeyboardEvent) => {
      e.preventDefault();

      // if first item, cycle to the bottom
      const size = options.length - 1;
      setIndex(index <= 0 ? size : index - 1);
    };
    const pressDownKey = (e: React.KeyboardEvent) => {
      e.preventDefault();

      // if last item, cycle to top
      const size = options.length - 1;
      setIndex((i) => (i >= size ? 0 : i + 1));
    };

    function pressBackspaceKey() {
      // when backspace key is pressed and query is blank, delete the last tag
      if (!query.length) {
        deleteTag(props.tags.length - 1);
      }
    }

    const focusInput = () => {
      inputRef.current.focus();
    };
    const inputEventHandlers = {
      // Provide a no-op function to the input component to avoid warnings
      // <https://github.com/i-like-robots/react-tags/issues/135>
      // <https://github.com/facebook/react/issues/13835>
      onChange: onInput,
      onBlur: onBlur,
      onFocus: onFocus,
      onInput: () => {},
      onKeyDown: onKeyDown,
      onCompositionEnd: onInput,
      onCompositionStart: onInput,
    };

    const expanded = focused && query.length >= props.minQueryLength;
    const classNames = Object.assign({}, CLASS_NAMES, props.classNames);
    const rootClassNames = [classNames.root];

    focused && rootClassNames.push(classNames.rootFocused);

    return (
      <div ref={container} className={rootClassNames.join(" ")}>
        {!props.suggestionsOnly ? (
          <div
            className={classNames.selected}
            aria-relevant="additions removals"
            aria-live="polite"
          >
            <>
              {props.tags.map((tag, i) => (
                <SelectMenuPillComponent
                  key={i}
                  tag={tag}
                  classNames={classNames}
                  onDelete={(e) => onDeleteTag(i, e)}
                />
              ))}
            </>
            <div className={classNames.search}>
              <SelectMenuInput
                ref={inputRef}
                query={query}
                index={index}
                id={props.id}
                classNames={classNames}
                inputAttributes={props.inputAttributes}
                inputEventHandlers={inputEventHandlers}
                expanded={expanded}
                placeholderText={props.placeholderText}
              />
            </div>
          </div>
        ) : null}
        {options.length || props.allowNew ? (
          <SelectMenuSuggestions
            options={options}
            hoverSelect={props.hoverSelect}
            query={query}
            setIndex={setIndex}
            index={index}
            id={props.id}
            classNames={classNames}
            expanded={expanded}
            addTag={addTag}
            allowNew={props.allowNew}
            deleteOption={props.onDeleteOption}
          />
        ) : null}

        {props.previewComponent}
      </div>
    );
  }
);
SelectMenuComponent.displayName = "SelectMenuComponent";
export default SelectMenuComponent;
