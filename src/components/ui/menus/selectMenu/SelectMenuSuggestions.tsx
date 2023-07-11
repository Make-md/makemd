import { SelectOption } from "components/ui/menus/selectMenu";
import React, { useEffect, useRef } from "react";
import { uiIconSet } from "utils/icons";
import { matchAny } from "./concerns/matchers";

function markIt(name: string, query: string) {
  const regexp = matchAny(query);
  return name.replace(regexp, "<mark>$&</mark>");
}

const SelectMenuSuggestionsComponent = (props: {
  item: SelectOption;
  query: string;
  active: boolean;
  onDeleteOption?: (value: string) => void;
}) => {
  const ref = useRef(null);
  useEffect(() => {
    if (props.active) {
      ref?.current?.scrollIntoViewIfNeeded();
    }
  }, [props.active]);
  return (
    <>
      <div className="mk-options-menu-inner">
        {props.item.onToggle && <div>Toggle</div>}
        <span
          ref={ref}
          dangerouslySetInnerHTML={{
            __html: markIt(props.item.name, props.query),
          }}
        />
        {props.item.description && (
          <span
            className="mk-description"
            ref={ref}
            dangerouslySetInnerHTML={{
              __html: markIt(props.item.description, props.query),
            }}
          />
        )}
      </div>
      {props.item.removeable && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.onDeleteOption(props.item.value);
          }}
          className="mk-icon-small"
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
        ></div>
      )}
    </>
  );
};

const SelectMenuSuggestions = (props: {
  expanded: boolean;
  hoverSelect: boolean;
  options: SelectOption[];
  query: string;
  addTag: (item: SelectOption) => void;
  deleteOption?: (option: string) => void;
  id: string;
  classNames: Record<string, string>;
  index: number;
  setIndex: (index: number) => void;
  allowNew: boolean;
}) => {
  const timer = useRef(null);
  const mouseOver = (e: React.MouseEvent, index: number) => {
    if (!props.hoverSelect) {
      return;
    }
    timer.current && clearTimeout(timer.current);
    timer.current = setTimeout(() => props.setIndex(index), 300);
  };
  const options = props.options.map((item, index) => {
    const key = `${props.id}-${index}`;
    const classNames = [];

    if (props.index === index) {
      classNames.push(props.classNames.suggestionActive);
    }

    if (item.disabled) {
      classNames.push(props.classNames.suggestionDisabled);
    }

    return (
      <li
        id={key}
        key={key}
        role="option"
        className={classNames.join(" ")}
        aria-disabled={Boolean(item.disabled)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => props.addTag(item)}
        onMouseOver={(e) => mouseOver(e, index)}
        onMouseOut={(e) => props.hoverSelect && clearTimeout(timer.current)}
      >
        <SelectMenuSuggestionsComponent
          item={item}
          query={props.query}
          active={index == props.index}
          onDeleteOption={props.deleteOption}
        />
      </li>
    );
  });

  return (
    <div className={props.classNames.suggestions}>
      <ul role="listbox" id={props.id}>
        {options}
        {props.query && props.allowNew && (
          <li
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              props.addTag({ name: props.query, value: props.query })
            }
          >
            Add {props.query}
          </li>
        )}
      </ul>
    </div>
  );
};

export default SelectMenuSuggestions;
