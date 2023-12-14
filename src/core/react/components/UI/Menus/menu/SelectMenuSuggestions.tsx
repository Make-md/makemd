import { UIManager } from "core/middleware/ui";
import {
  SelectOption,
  SelectOptionType,
} from "core/react/components/UI/Menus/menu";
import { Sticker } from "core/react/components/UI/Stickers/Sticker";
import { PointerModifiers } from "core/types/ui";
import React, { useEffect, useRef, useState } from "react";
import { matchAny } from "./concerns/matchers";

function markIt(name: string, query: string) {
  const regexp = matchAny(query);
  return name.replace(regexp, "<mark>$&</mark>");
}

const SelectMenuSuggestionsComponent = (props: {
  ui: UIManager;
  item: SelectOption;
  query: string;
  active: boolean;
  onMoreOption?: (e: React.MouseEvent, value: string) => void;
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
      {props.item.icon && (
        <Sticker ui={props.ui} sticker={props.item.icon}></Sticker>
      )}
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
      {props.item.type == SelectOptionType.Radio && props.item.value && (
        <div
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.ui.getSticker("ui//mk-ui-check"),
          }}
        ></div>
      )}
      {props.onMoreOption && props.item.removeable && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.onMoreOption(e, props.item.value);
          }}
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.ui.getSticker("ui//mk-ui-options"),
          }}
        ></div>
      )}
      {props.item.removeable && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.onDeleteOption(props.item.value);
          }}
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.ui.getSticker("ui//mk-ui-close"),
          }}
        ></div>
      )}
    </>
  );
};

const SelectMenuInput = (props: {
  value: string;
  setValue: (value: string) => void;
}) => {
  const [value, setValue] = useState(props.value);
  return (
    <input
      type="text"
      value={value}
      onKeyDown={(e) => {
        if (e.key == "Enter") {
          props.setValue(value);
        }
      }}
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => props.setValue(value)}
    ></input>
  );
};

const SelectMenuSuggestions = (props: {
  expanded: boolean;
  hoverSelect: boolean;
  options: SelectOption[];
  query: string;
  hide: () => void;
  addTag: (item: SelectOption, modifiers: PointerModifiers) => void;
  moreOption?: (e: React.MouseEvent, option: string) => void;
  deleteOption?: (option: string) => void;
  id: string;
  classNames: Record<string, string>;
  index: number;
  setIndex: (index: number) => void;
  allowNew: boolean;
  ui: UIManager;
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

    return item.type == SelectOptionType.Separator ? (
      <div className="menu-separator"></div>
    ) : item.type == SelectOptionType.Input ? (
      <li className="mk-menu-input">
        <SelectMenuInput
          value={item.value}
          setValue={item.onValueChange}
        ></SelectMenuInput>
      </li>
    ) : item.type == SelectOptionType.Custom ? (
      <div>
        <item.fragment />
      </div>
    ) : (
      <li
        id={key}
        key={key}
        role="option"
        className={classNames.join(" ")}
        aria-disabled={Boolean(item.disabled)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          if (item.onClick) {
            item.onClick(e);
            props.hide();
          } else {
            props.addTag(item, {
              ctrlKey: e.ctrlKey,
              metaKey: e.metaKey,
              altKey: e.altKey,
              shiftKey: e.shiftKey,
            });
          }
        }}
        onMouseOver={(e) => mouseOver(e, index)}
        onMouseOut={(e) => props.hoverSelect && clearTimeout(timer.current)}
      >
        <SelectMenuSuggestionsComponent
          ui={props.ui}
          item={item}
          query={props.query}
          active={index == props.index}
          onMoreOption={props.moreOption}
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
            onClick={(e) =>
              props.addTag(
                { name: props.query, value: props.query },
                {
                  ctrlKey: e.ctrlKey,
                  metaKey: e.metaKey,
                  altKey: e.altKey,
                  shiftKey: e.shiftKey,
                }
              )
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
