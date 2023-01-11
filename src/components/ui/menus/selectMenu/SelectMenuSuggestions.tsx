import React, { useEffect, useRef } from "react";
import { matchAny } from "./concerns/matchers";
import { SelectOption } from "components/ui/menus/selectMenu";

function markIt(name: string, query: string) {
  const regexp = matchAny(query);
  return name.replace(regexp, "<mark>$&</mark>");
}

const SelectMenuSuggestionsComponent = (props: {
  item: SelectOption;
  query: string;
  active: boolean;
}) => {
  const ref = useRef(null);
  useEffect(() => {
    if (props.active) {
      ref?.current?.scrollIntoViewIfNeeded();
    }
  }, [props.active]);
  return (
    <>
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
      {props.item.removeable && <div>Remove</div>}
    </>
  );
};

const SelectMenuSuggestions = (props: {
  expanded: boolean;
  hoverSelect: boolean;
  options: SelectOption[];
  query: string;
  addTag: (item: SelectOption) => void;
  id: string;
  classNames: Record<string, string>;
  index: number;
  setIndex: (index: number) => void;
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
        />
      </li>
    );
  });

  return (
    <div className={props.classNames.suggestions}>
      <ul role="listbox" id={props.id}>
        {options}
      </ul>
    </div>
  );
};

export default SelectMenuSuggestions;
