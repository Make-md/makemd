import SelectMenuSuggestions from "core/react/components/UI/Menus/menu/SelectMenuSuggestions";

import { calculateBoundsBasedOnPosition } from "core/utils/ui/menu";
import { SelectOption, SelectSection, Superstate, i18n } from "makemd-core";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pos } from "shared/types/Pos";

export const Suggester = forwardRef(
  (
    props: {
      superstate: Superstate;
      sections?: SelectSection[];
      suggestions: SelectOption[];
      placeholder: string;
      onSelectSection?: (section: string) => void;
      onSelect: (option: SelectOption) => void;
      onChange: (query: string) => void;
      onDelete?: () => void;
      onFocus?: () => void;
      onBlur?: () => void;
    },
    outerRef
  ) => {
    const ref = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });
    const [active, setActive] = useState(false);
    const [section, setSection] = useState("");
    useEffect(() => {
      const resizeObserver = new ResizeObserver((entries) => {
        if (menuRef.current) {
          const rect = menuRef.current.getBoundingClientRect();
          setIsReady(true);
          setPos(
            calculateBoundsBasedOnPosition(
              ref.current.getBoundingClientRect(),
              rect,
              { width: window.innerWidth, height: innerHeight },
              "bottom"
            )
          );
        }
      });
      if (menuRef.current && ref.current) {
        resizeObserver.observe(menuRef.current);
        resizeObserver.observe(ref.current);
      }
      return () => {
        resizeObserver.disconnect();
      };
    }, [menuRef.current]);
    const keyDown = (e: React.KeyboardEvent) => {
      if (e.key == "Delete" || e.key == "Backspace") {
        if (ref.current.innerText == "" && props.onDelete) {
          props.onDelete();
        }
      }
      if (e.key == "Tab") {
        if (props.sections && props.onSelectSection) {
          e.preventDefault();
          e.stopPropagation();
          setSection((p) => {
            const sectionIndex = props.sections.findIndex((g) => g.value == p);
            if (e.shiftKey) {
              if (sectionIndex == 0) {
                return p;
              }
              props.onSelectSection(props.sections[sectionIndex - 1].value);
              return props.sections[sectionIndex - 1].value;
            }
            if (sectionIndex == props.sections.length - 1) {
              return p;
            }
            props.onSelectSection(props.sections[sectionIndex + 1].value);
            return props.sections[sectionIndex + 1].value;
          });
        }
      }
      if (e.key == "ArrowUp") {
        const size = props.suggestions.length - 1;
        const newIndex = index < 0 ? size : index - 1;
        if (props.suggestions[newIndex]?.disabled) {
          setIndex(newIndex < 0 ? size : newIndex - 1);
        } else {
          setIndex(newIndex);
        }
        e.preventDefault();
      }
      if (e.key == "ArrowDown") {
        const size = props.suggestions.length - 1;
        const newIndex = index >= size ? 0 : index + 1;
        if (props.suggestions[newIndex]?.disabled) {
          setIndex(newIndex >= size ? 0 : newIndex + 1);
        } else {
          setIndex(newIndex);
        }
        e.preventDefault();
      }
      if (e.key == "Enter") {
        props.onSelect(props.suggestions[index]);
        e.preventDefault();
      }
    };
    const CLASS_NAMES = {
      root: "mk-menu-container",
      rootFocused: "mk-focused",
      selected: "mk-selected",
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
    return (
      <>
        <div
          ref={(node) => {
            ref.current = node;
            if (outerRef) {
              if (typeof outerRef === "function") {
                outerRef(node);
              } else {
                outerRef.current = node;
              }
            }
          }}
          onFocus={() => {
            if (props.onFocus) {
              props.onFocus();
            }
            setActive(true);
          }}
          onBlur={() => {
            if (props.onBlur) props.onBlur();
            setActive(false);
          }}
          data-placeholder={props.placeholder}
          onInput={(e) => props.onChange(e.currentTarget.innerText)}
          onKeyDown={(e) => keyDown(e)}
          className="mk-suggester"
          contentEditable
        ></div>
        {active &&
          createPortal(
            <div
              ref={menuRef}
              className={`mk-menu mk-menu-suggester ${
                isReady ? "mk-ready" : ""
              }`}
              style={
                {
                  position: "absolute",
                  top: pos.y,
                  left: pos.x,
                  zIndex: 1000,
                  width: "300px",
                  "--mk-menu-max-height": "300px",

                  visibility: active ? "visible" : "hidden",
                } as React.CSSProperties
              }
            >
              {props.sections ? (
                <div className="mk-menu-sections">
                  {props.sections.map((f, i) => (
                    <div
                      key={i}
                      onClick={() => setSection(f.value)}
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
              <SelectMenuSuggestions
                expanded={false}
                addKeyword="Add"
                options={props.suggestions}
                query=""
                refs={null}
                hide={() => null}
                selectOption={props.onSelect}
                id={""}
                onHide={() => null}
                classNames={CLASS_NAMES}
                index={index}
                setIndex={setIndex}
                allowNew={false}
                ui={props.superstate.ui}
                isDisclosureMenu={false} // Add the missing properties here
              />
            </div>,
            document.body
          )}
      </>
    );
  }
);

Suggester.displayName = "Suggester";
