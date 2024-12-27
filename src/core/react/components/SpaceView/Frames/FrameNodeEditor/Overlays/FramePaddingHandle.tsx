import { DraggableSyntheticListeners } from "@dnd-kit/core";
import classNames from "classnames";
import { PointerModifiers } from "core/types/ui";
import React, { useEffect } from "react";
import { FrameTreeProp } from "shared/types/mframe";
import { FrameDraggableHandle } from "./FrameDraggableHandle";

type PaddingTypes =
  | "padding"
  | "paddingTop"
  | "paddingBottom"
  | "paddingLeft"
  | "paddingRight";
export const FramePadding = (props: {
  clientSize: FrameTreeProp;
  styles: FrameTreeProp;
  saveStyles: (size: FrameTreeProp) => void;
  listeners?: DraggableSyntheticListeners;
}) => {
  const paddingTypes = [
    "padding",
    "paddingTop",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
  ];
  const [offset, setOffset] = React.useState({
    padding: 0,
    paddingTop: null,
    paddingBottom: null,
    paddingLeft: null,
    paddingRight: null,
  });
  const unit = "px";
  useEffect(() => {
    const getNumericValue = (type: string) => {
      if (!props.styles[type]) return null;
      const match = props.styles[type]
        ? props.styles[type].match(/^(\d+(?:\.\d+)?)\s?([a-zA-Z%]+)$/)
        : null;
      const numericValue = Math.max(match ? parseInt(match[1]) : 0, 8);
      // const unit = match && match[2] ? match[2] : "px";
      return numericValue;
    };

    setOffset((p) => {
      return paddingTypes.reduce((a, c) => {
        return {
          ...a,
          [c]: getNumericValue(c),
        };
      }, p);
    });
  }, [props.styles]);

  const [shiftModifier, setShiftModifier] = React.useState(false);
  const handleProps = {
    min: 0,
    mod: 2,
  };
  const inset = (type: PaddingTypes) =>
    Math.max(5, offset[type] ?? offset.padding);

  const setNewOffset = (
    type: PaddingTypes,
    value: number,
    modifiers: PointerModifiers
  ) => {
    setOffset((p) =>
      modifiers.shiftKey
        ? {
            padding: value,
            paddingBottom: null,
            paddingTop: null,
            paddingLeft: null,
            paddingRight: null,
          }
        : { ...p, [type]: value }
    );
  };
  const saveValue = (
    type: PaddingTypes,
    value: number,
    modifiers: PointerModifiers
  ) => {
    props.saveStyles(
      modifiers.shiftKey
        ? {
            padding: `'${value}${unit}'`,
            paddingBottom: "",
            paddingTop: "",
            paddingLeft: "",
            paddingRight: "",
          }
        : { [type]: `'${value}${unit}'` }
    );
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftModifier(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftModifier(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: props.clientSize.width,
        height: props.clientSize.height,
        display: "flex",
        zIndex: 200,
        border: "1px solid var(--mk-ui-color-border-accent)",
      }}
    >
      <div
        className={classNames(
          "mk-frame-paddings",
          shiftModifier && "mk-modifier-shift"
        )}
      >
        <div
          className="mk-frame-padding-handle-h"
          style={{
            position: "absolute",
            transform: `translate(${0}px, ${0}px)`,
            height: inset("paddingTop"),
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            value={offset["paddingTop"] ?? offset.padding}
            cursor="s-resize"
            max={props.clientSize.height}
            onDragMove={(value: number, modifiers: PointerModifiers) => {
              setNewOffset("paddingTop", value, modifiers);
            }}
            onDragEnd={(value: number, modifiers: PointerModifiers) => {
              saveValue("paddingTop", value, modifiers);
            }}
            reverseY
            disableX
          ></FrameDraggableHandle>
        </div>
        <div
          className="mk-frame-padding-handle-v"
          style={{
            position: "absolute",
            transform: `translate(${
              props.clientSize.width - inset("paddingRight")
            }px, ${0}px)`,
            width: inset("paddingRight"),
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            value={offset["paddingRight"] ?? offset.padding}
            cursor="w-resize"
            onDragMove={(value: number, modifiers: PointerModifiers) => {
              setNewOffset("paddingRight", value, modifiers);
            }}
            max={props.clientSize.width}
            onDragEnd={(value: number, modifiers: PointerModifiers) => {
              saveValue("paddingRight", value, modifiers);
            }}
            reverseX
            reverseY
            disableY
          ></FrameDraggableHandle>
        </div>
        <div
          className="mk-frame-padding-handle-v"
          style={{
            position: "absolute",
            transform: `translate(${0}px, ${0}px)`,
            width: inset("paddingLeft"),
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            value={offset["paddingLeft"] ?? offset.padding}
            cursor="e-resize"
            max={props.clientSize.width}
            onDragMove={(value: number, modifiers: PointerModifiers) => {
              setNewOffset("paddingLeft", value, modifiers);
            }}
            onDragEnd={(value: number, modifiers: PointerModifiers) => {
              saveValue("paddingLeft", value, modifiers);
            }}
            disableY
          ></FrameDraggableHandle>
        </div>
        <div
          className="mk-frame-padding-handle-h"
          style={{
            position: "absolute",
            transform: `translate(${0}px, ${
              props.clientSize.height - inset("paddingBottom")
            }px)`,
            height: inset("paddingBottom"),
            zIndex: "var(--mk-layer-editor-overlay)",
          }}
        >
          <FrameDraggableHandle
            {...handleProps}
            value={offset["paddingBottom"] ?? offset.padding}
            cursor="n-resize"
            max={props.clientSize.height}
            onDragMove={(value: number, modifiers: PointerModifiers) => {
              setNewOffset("paddingBottom", value, modifiers);
            }}
            onDragEnd={(value: number, modifiers: PointerModifiers) => {
              saveValue("paddingBottom", value, modifiers);
            }}
            reverseX={true}
            disableX
          ></FrameDraggableHandle>
        </div>
      </div>
    </div>
  );
};
