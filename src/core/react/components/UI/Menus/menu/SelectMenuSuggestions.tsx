import { UIManager } from "core/middleware/ui";
import { Sticker } from "core/react/components/UI/Stickers/Sticker";
import { PointerModifiers } from "core/types/ui";
import { SelectOption, SelectOptionType } from "makemd-core";
import React, { useEffect, useRef, useState } from "react";
import { MenuObject } from "shared/types/menu";
import { Rect } from "shared/types/Pos";
import { matchAny } from "./concerns/matchers";
function markIt(name: string, query: string) {
  const regexp = matchAny(query);
  return name?.replace(regexp, "<mark>$&</mark>");
}

const SelectMenuSuggestionsComponent = (props: {
  ui: UIManager;
  item: SelectOption;
  query: string;
  active: boolean;
  onMoreOption?: (e: React.MouseEvent, option: string) => void;
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
      <div ref={ref} className="mk-menu-options-inner">
        {props.item.onToggle && <div>Toggle</div>}
        <span
          style={
            props.item.color?.length > 0
              ? {
                  background: props.item.color,
                  padding: "2px 4px",
                  borderRadius: "4px",
                  color:
                    props.item.color == "var(--mk-color-none)"
                      ? "inherit"
                      : "var(--mk-color-white)",
                }
              : {}
          }
          dangerouslySetInnerHTML={{
            __html:
              props.query.length > 0
                ? markIt(props.item.name, props.query)
                : props.item.name,
          }}
        />
        {props.item.description && (
          <span
            aria-label={props.item.description}
            className="mk-menu-options-description"
            dangerouslySetInnerHTML={{
              __html: markIt(props.item.description, props.query),
            }}
          />
        )}
      </div>
      {props.item.type == SelectOptionType.Disclosure && (
        <span>{props.item.value}</span>
      )}
      {props.item.type == SelectOptionType.Radio && props.item.value && (
        <div
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.ui.getSticker("ui//check"),
          }}
        ></div>
      )}
      {props.item.onMoreOptions ||
      (props.onMoreOption && props.item.removeable) ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.item.onMoreOptions
              ? props.item.onMoreOptions(e)
              : props.onMoreOption(e, props.item.value);
          }}
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.ui.getSticker("ui//options"),
          }}
        ></div>
      ) : null}
      {props.item.removeable && props.onDeleteOption && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.onDeleteOption(props.item.value);
          }}
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.ui.getSticker("ui//close"),
          }}
        ></div>
      )}
      {props.item.type == SelectOptionType.Submenu && (
        <div
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.ui.getSticker("ui//chevron-right"),
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
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onFocus={(e) => {
        e.stopPropagation();
      }}
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => props.setValue(value)}
    ></input>
  );
};

const SelectMenuSuggestions = (props: {
  expanded: boolean;

  options: SelectOption[];
  query: string;
  addKeyword: string;
  refs: React.MutableRefObject<HTMLDivElement[]>;
  hide: () => void;
  onHide: () => void;
  selectOption: (item: SelectOption, modifiers: PointerModifiers) => void;
  moreOption?: (e: React.MouseEvent, option: string) => void;
  deleteOption?: (option: string) => void;
  id: string;
  classNames: Record<string, string>;
  index: number;
  setIndex: (index: number) => void;
  allowNew: boolean;
  ui: UIManager;
  isDisclosureMenu: boolean;
  openSubmenu?: (menu: MenuObject) => void;
}) => {
  // const mouseOver = (e: React.MouseEvent, index: number) => {
  //   props.setIndex(index);
  // };
  const options = props.options.map((item, index) => {
    const key = `${props.id}-${index}`;
    const className =
      item.type == SelectOptionType.Separator
        ? "mk-menu-separator"
        : item.type == SelectOptionType.Input
        ? "mk-menu-input"
        : item.type == SelectOptionType.Custom
        ? "mk-menu-custom"
        : `mk-menu-option ${
            props.index === index && props.classNames.suggestionActive
          } ${item.disabled && props.classNames.suggestionDisabled}`;
    return (
      <div
        ref={(ref) => {
          if (props.refs?.current) props.refs.current[index] = ref;
        }}
        onMouseDown={(e) => {
          if (!props.isDisclosureMenu) e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          if (item.onSubmenu && props.openSubmenu) {
            const el = props.refs?.current[index].getBoundingClientRect();
            props.openSubmenu(
              item.onSubmenu(el, () => {
                if (props.onHide) {
                  props.onHide();
                }
                props.hide();
              })
            );
          } else if (item.onClick) {
            item.onClick(e);
            if (
              item.type != SelectOptionType.Submenu &&
              item.type != SelectOptionType.Disclosure
            ) {
              props.hide();
            }
          } else {
            if (
              item.type == null ||
              item.type == SelectOptionType.Option ||
              item.type == SelectOptionType.Disclosure
            ) {
              props.selectOption(item, {
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                altKey: e.altKey,
                shiftKey: e.shiftKey,
                doubleClick: e.detail == 2,
              });
              if (!props.isDisclosureMenu) e.stopPropagation();
            }
          }
        }}
        // onMouseOver={(e) => {
        //   if (props.openSubmenu && item.onSubmenu) {
        //     props.setIndex(index);
        //     const el = props.refs?.current[index].getBoundingClientRect();
        //     props.openSubmenu(item.onSubmenu(el));
        //   }
        // }}
        id={key}
        key={key}
        className={className}
      >
        {item.type == SelectOptionType.Separator ? (
          <></>
        ) : item.type == SelectOptionType.Section ? (
          <div className="mk-menu-options-section">{item.name}</div>
        ) : item.type == SelectOptionType.Input ? (
          <SelectMenuInput
            value={item.value}
            setValue={item.onValueChange}
          ></SelectMenuInput>
        ) : item.type == SelectOptionType.Custom ? (
          <item.fragment
            hide={props.hide}
            onSubmenu={(
              openSubmenu: (offset: Rect, onHide: () => void) => MenuObject
            ) => {
              if (props.openSubmenu) {
                const el = props.refs?.current[index].getBoundingClientRect();
                props.openSubmenu(
                  openSubmenu(el, () => {
                    if (props.onHide) {
                      props.onHide();
                    }
                    props.hide();
                  })
                );
              }
            }}
          />
        ) : (
          <SelectMenuSuggestionsComponent
            ui={props.ui}
            item={item}
            query={props.query}
            active={index == props.index}
            onMoreOption={props.moreOption}
            onDeleteOption={props.deleteOption}
          />
        )}
      </div>
    );
  });

  return (
    <div className="mk-menu-suggestions">
      {options}

      {props.query && props.allowNew && (
        <div
          className="mk-menu-option"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) =>
            props.selectOption(
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
          <div
            className="mk-sticker"
            dangerouslySetInnerHTML={{
              __html: props.ui.getSticker("ui//plus"),
            }}
          ></div>
          <div className="mk-menu-options-inner">
            {props.addKeyword ?? "Add"} {props.query}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectMenuSuggestions;
