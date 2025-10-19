// Adapted from React Tags https://github.com/react-tags/react-tags

import { UIManager } from "core/middleware/ui";
import { PointerModifiers } from "core/types/ui";
import Fuse from "fuse.js";
import { SelectOption, SelectSection } from "makemd-core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import i18n from "shared/i18n";
import { MenuObject } from "shared/types/menu";
import { uniq } from "shared/utils/array";
import SelectMenuSearch from "./SelectMenuInput";
import SelectMenuPillComponent from "./SelectMenuPill";
import SelectMenuSuggestions from "./SelectMenuSuggestions";
import { focusNextElement } from "./concerns/focusNextElement";
import { matchAny, matchExact } from "./concerns/matchers";
const KEYS = {
  ENTER: "Enter",
  TAB: "Tab",
  BACKSPACE: "Backspace",
  UP_ARROW: "ArrowUp",
  UP_ARROW_COMPAT: i18n.menu.up,
  DOWN_ARROW: "ArrowDown",
  DOWN_ARROW_COMPAT: i18n.menu.down,
  LEFT_ARROW: "ArrowLeft",
  RIGHT_ARROW: "ArrowRight",
};

const CLASS_NAMES = {
  root: "mk-menu-container",
  rootFocused: "mk-focused",
  selected: "mk-menu-input-wrapper",
  selectedTagWrapper: "mk-menu-selected-tag-wrapper",
  selectedTag: "mk-menu-selected-tag",
  selectedTagName: "mk-menu-selected-tag-name",
  search: "mk-menu-search",
  searchWrapper: "mk-menu-search-container",
  searchInput: "mk-menu-search-input",
  suggestions: "mk-menu-suggestions",
  suggestionActive: "mk-active",
  suggestionDisabled: "mk-disabled",
};

const defaultProps: SelectMenuComponentProps = {
  ui: null,
  id: i18n.menu.selectmenu,
  tags: [],
  hide: () => null,
  onHide: () => null,
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
};

type SelectMenuComponentProps = {
  id?: string;
  tags?: SelectOption[];
  ui: UIManager;
  onHide?: () => void;
  hide: () => void;
  wrapperClass?: string;
  suggestionsOnly?: boolean;
  placeholderText?: string;
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
  onSelectSection?: (section: string) => void;
  onDelete?: (id: number) => void;
  onMoreOption?: (e: React.MouseEvent, option: string) => void;
  onDeleteOption?: (value: string) => void;
  onAddition?: (tag: SelectOption, modifiers: PointerModifiers) => void;
  onHover?: (value: any) => void;
  onToggle?: (value: string) => void;
  onInput?: (input: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onValidate?: (tag: SelectOption) => boolean;
  showSections?: boolean;
  sections?: SelectSection[];
  minQueryLength?: number;
  maxSuggestionsLength?: number;
  classNames?: Record<string, string>;
  inputAttributes?: Record<string, any>;
  addKeyword?: string;
  allowNew?: boolean;
  isDisclosure?: boolean;
};

const findMatchIndex = (options: SelectOption[], query: string) => {
  return options.findIndex((option) => matchExact(query).test(option.name));
};

const pressDelimiter = (
  props: SelectMenuComponentProps,
  query: string,
  index: number,
  options: SelectOption[],
  addTag: (tag: SelectOption, modifiers: PointerModifiers) => void,
  modifiers: PointerModifiers
) => {
  if (query.length >= props.minQueryLength) {
    // Check if the user typed in an existing suggestion.
    const match = findMatchIndex(options, query);
    const _index = index === -1 ? match : index;
    const tag = _index > -1 ? options[_index] : null;
    if (tag) {
      addTag(tag, modifiers);
    } else {
      addTag({ name: query, value: query }, modifiers);
    }
  }
};

function defaultSuggestionsFilter(item: SelectOption, query: string) {
  const regexp = matchAny(query);
  return regexp.test(item.name);
}

function getOptions(
  props: SelectMenuComponentProps,
  query: string,
  section: string
) {
  let options: SelectOption[];
  let suggestions = props.suggestions;
  if (section.length > 0) {
    suggestions = props.suggestions.filter((f) => f.section == section);
  }
  const fuseOptions = {
    // isCaseSensitive: false,
    // includeScore: false,
    // shouldSort: true,
    // includeMatches: false,
    // findAllMatches: false,
    // minMatchCharLength: 1,
    // location: 0,
    threshold: 0,
    // distance: 100,
    // useExtendedSearch: false,
    ignoreLocation: true,
    // ignoreFieldNorm: false,
    // fieldNormWeight: 1,
    keys: ["name", "value"],
  };
  const fuse = new Fuse(suggestions, fuseOptions);
  options =
    query.length == 0
      ? suggestions
      : fuse.search(query).map((result) => result.item);
  // if (props.suggestionsTransform) {
  //   options = props.suggestionsTransform(query, props.suggestions);
  // } else {
  //   options = props.suggestions.filter((item) =>
  //     props.suggestionsFilter(item, query)
  //   );
  // }

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
    const refs = useRef<HTMLDivElement[]>([]);
    const sections: SelectSection[] = useMemo(() => {
      if (!props.showSections) return [];
      return [
        {
          name: i18n.labels.all,
          value: "",
        },
        ...(props.sections ??
          uniq(props.suggestions.map((f) => f.section)).filter((f) => f)),
      ];
    }, [props.showSections, props.sections, props.suggestions]);
    const inputRef = useRef(null);
    const [section, setSection] = useState("");
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
      if (query.length == 0 && props.defaultSuggestions) {
        setOptions(props.defaultSuggestions);
        return;
      }
      setOptions(getOptions(props, query, section));
    }, [query, props.defaultSuggestions, section, props.suggestions]);

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
        pressDelimiter(props, query, index, options, addTag, {});
      } else if (_query !== query) {
        setQuery(_query);
      }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
      if (onComposition.current) {
        return;
      }
      // when one of the terminating keys is pressed, add current query to the tags
      if (props.delimiters.indexOf(e.key) > -1) {
        if (query || index > -1) {
          e.preventDefault();
        }

        pressDelimiter(props, query, index, options, addTag, {
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
        });
      }

      if (e.key == "Escape") {
        return;
      }
      // when backspace key is pressed and query is blank, delete the last tag
      if (e.key === KEYS.TAB) {
        pressTabKey(e);
      }

      if (e.key === KEYS.BACKSPACE) {
        pressBackspaceKey();
      }

      if (e.key === KEYS.UP_ARROW || e.key === KEYS.UP_ARROW_COMPAT) {
        pressUpKey(e);
      }

      if (e.key === KEYS.DOWN_ARROW || e.key === KEYS.DOWN_ARROW_COMPAT) {
        pressDownKey(e);
      }
      e.stopPropagation();
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

    const addTag = (tag: SelectOption, modifiers: PointerModifiers) => {
      if (tag.disabled) {
        return;
      }

      if (props.onValidate && !props.onValidate(tag)) {
        return;
      }

      props.onAddition(tag, modifiers);

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
      const newIndex = index <= 0 ? size : index - 1;
      if (options[newIndex].disabled) {
        setIndex(newIndex <= 0 ? size : newIndex - 1);
      } else {
        setIndex(newIndex);
      }
    };
    const pressDownKey = (e: React.KeyboardEvent) => {
      e.preventDefault();

      // if last item, cycle to top
      const size = options.length - 1;
      const newIndex = index >= size ? 0 : index + 1;
      if (options[newIndex].disabled) {
        setIndex(newIndex >= size ? 0 : newIndex + 1);
      } else {
        setIndex(newIndex);
      }
    };

    function pressBackspaceKey() {
      // when backspace key is pressed and query is blank, delete the last tag
      if (!query.length) {
        deleteTag(props.tags.length - 1);
      }
    }

    function pressTabKey(e: React.KeyboardEvent) {
      if (props.showSections) {
        e.preventDefault();
        e.stopPropagation();
        setSection((p) => {
          const sectionIndex = sections.findIndex((g) => g.value == p);
          if (e.shiftKey) {
            if (sectionIndex == 0) {
              return p;
            }
            if (props.onSelectSection) {
              props.onSelectSection(sections[sectionIndex - 1].value);
            }
            return sections[sectionIndex - 1].value;
          }
          if (sectionIndex == sections.length - 1) {
            return p;
          }
          if (props.onSelectSection) {
            props.onSelectSection(sections[sectionIndex + 1].value);
          }
          return sections[sectionIndex + 1].value;
        });
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
      // onBlur: onBlur,
      // onFocus: onFocus,
      // onInput: () => {
      //   //do nothing
      // },
      // onKeyDown: onKeyDown,
      onCompositionEnd: onInput,
      onCompositionStart: onInput,
    };

    useEffect(() => {
      props.ui.inputManager.on("keydown", onKeyDown);
      return () => {
        props.ui.inputManager.off("keydown", onKeyDown);
      };
    }, [options, index]);

    const expanded = focused && query.length >= props.minQueryLength;
    const classNames = Object.assign({}, CLASS_NAMES, props.classNames);
    if (props.wrapperClass) {
      classNames.root = `${classNames.root} ${props.wrapperClass}`;
    }
    const rootClassNames = [classNames.root];

    focused && rootClassNames.push(classNames.rootFocused);
    const submenuRef = useRef<MenuObject>(null);
    const openSubmenu = (menu: MenuObject) => {
      if (submenuRef.current) {
        submenuRef.current.hide(true);
      }
      submenuRef.current = menu;
    };
    return (
      <div
        ref={container}
        className={rootClassNames.join(" ")}
        style={
          !props.suggestionsOnly
            ? ({
                "--mk-menu-max-height": "200px",
              } as React.CSSProperties)
            : {}
        }
      >
        {!props.suggestionsOnly ? (
          <div
            className={classNames.selected}
            aria-relevant="additions removals"
            aria-live="polite"
          >
            {props.tags.length > 0 && (
              <div className={classNames.selectedTagWrapper}>
                {props.tags.map((tag, i) => (
                  <SelectMenuPillComponent
                    key={i}
                    tag={tag}
                    classNames={classNames}
                    onDelete={(e) => onDeleteTag(i, e)}
                  />
                ))}
              </div>
            )}

            <SelectMenuSearch
              ui={props.ui}
              ref={inputRef}
              query={query}
              index={index}
              id={props.id}
              currentSection={sections.find((f) => f.value == section)}
              classNames={classNames}
              inputAttributes={props.inputAttributes}
              inputEventHandlers={inputEventHandlers}
              expanded={expanded}
              placeholderText={props.placeholderText}
            />
          </div>
        ) : null}
        {props.showSections ? (
          <div className="mk-menu-sections">
            {sections.map((f, i) => (
              <div
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setSection(f.value);
                  if (props.onSelectSection) {
                    props.onSelectSection(f.value);
                  }
                }}
                className={`${
                  section == f.value ? "is-active" : ""
                } mk-menu-section`}
              >
                {f.name == "" ? i18n.labels.all : f.name}
              </div>
            ))}
          </div>
        ) : (
          <></>
        )}
        {options.length || props.allowNew ? (
          <SelectMenuSuggestions
            ui={props.ui}
            hide={() => {
              props.hide();
            }}
            addKeyword={props.addKeyword}
            refs={refs}
            options={options}
            query={query}
            setIndex={setIndex}
            index={index}
            onHide={props.onHide}
            id={props.id}
            classNames={classNames}
            expanded={expanded}
            selectOption={addTag}
            allowNew={props.allowNew}
            moreOption={props.onMoreOption}
            deleteOption={props.onDeleteOption}
            isDisclosureMenu={props.isDisclosure}
            openSubmenu={openSubmenu}
          />
        ) : null}

        {props.previewComponent}
      </div>
    );
  }
);
SelectMenuComponent.displayName = "SelectMenuComponent";
export default SelectMenuComponent;
