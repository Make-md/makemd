import { DraggableSyntheticListeners } from "@dnd-kit/core";
import classNames from "classnames";
import { PointerModifiers } from "core/types/ui";
import { wrapQuotes } from "core/utils/strings";
import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import { Resizable } from "re-resizable";
import React, { useEffect } from "react";
import { FrameResizeMode } from "shared/types/frameExec";
import { FrameTreeProp } from "shared/types/mframe";

export const FrameResizer = (props: {
  superstate: Superstate;
  size: FrameTreeProp;
  resize: (size: FrameTreeProp) => void;
  clientSize: FrameTreeProp;

  listeners?: DraggableSyntheticListeners;
  resizeMode: FrameResizeMode;
}) => {
  const labelForValue = (value: string) => {
    if (!value) return null;
    if (value == "auto") return "Fit";
    if (value == "100%") return "Fill";
    return value;
  };
  const [modifiers, setModifiers] = React.useState<PointerModifiers>(null);
  const [size, setSize] = React.useState({
    width:
      props.resizeMode != FrameResizeMode.ResizeColumn
        ? props.size.width
        : props.size.minWidth,
    height: props.size.height,
  });

  React.useEffect(() => {
    setSize({
      width:
        props.resizeMode != FrameResizeMode.ResizeColumn
          ? props.size.width
          : props.size.minWidth,
      height: props.size.height,
    });
  }, [props.size, props.resizeMode]);
  useEffect(() => {
    const captureShift = (e: KeyboardEvent) => {
      setModifiers({ shiftKey: e.shiftKey });
    };
    props.superstate.ui.inputManager.on("keydown", captureShift);
    props.superstate.ui.inputManager.on("keyup", captureShift);
    return () => {
      props.superstate.ui.inputManager.off("keydown", captureShift);
      props.superstate.ui.inputManager.off("keyup", captureShift);
    };
  }, [setModifiers]);
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: props.clientSize.width,
        height: props.clientSize.height,
      }}
    >
      <Resizable
        lockAspectRatio={modifiers?.shiftKey}
        className={classNames(
          props.resizeMode == FrameResizeMode.ResizeColumn
            ? "mk-frame-column"
            : "mk-frame-bounds"
        )}
        enable={
          props.resizeMode == FrameResizeMode.ResizeColumn
            ? { right: true }
            : {
                right: true,
                bottom: true,
                bottomRight: true,
              }
        }
        onResize={(e, direction, ref, d) => {
          setSize({
            width: ref.clientWidth,
            height: ref.clientHeight,
          });
        }}
        onResizeStop={(e, direction, ref, d) => {
          const captureClick = (e: MouseEvent) => {
            e.stopPropagation();
            window.removeEventListener("click", captureClick, true);
          };
          window.addEventListener("click", captureClick, true);
          props.resizeMode == FrameResizeMode.ResizeColumn
            ? props.resize({
                minWidth: `'${ref.clientWidth}px'`,
              })
            : direction == "bottom"
            ? props.resize({
                height: `'${ref.clientHeight}px'`,
              })
            : direction == "right"
            ? props.resize({
                width: `'${ref.clientWidth}px'`,
              })
            : props.resize({
                width: `'${ref.clientWidth}px'`,
                height: `'${ref.clientHeight}px'`,
              });
          e.stopPropagation();
        }}
        onResizeStart={(e) => {
          e.stopPropagation();
        }}
        handleClasses={
          props.resizeMode == FrameResizeMode.ResizeColumn
            ? {
                right: "mk-frame-column-resize-handle",
              }
            : props.resizeMode == FrameResizeMode.ResizeSelected
            ? { bottomRight: "mk-frame-resize-handle" }
            : {}
        }
        handleWrapperStyle={{
          pointerEvents: "auto",
        }}
        size={{
          width: size.width && size.width != "auto" ? size.width : "100%",
          height: size.height && size.height != "auto" ? size.height : "100%",
        }}
        {...props.listeners}
      ></Resizable>
      {props.clientSize?.width > 50 &&
        props.resizeMode == FrameResizeMode.ResizeSelected && (
          <div className="mk-frame-resize-label-width">
            <div>
              <span>{labelForValue(size.width) ?? i18n.editor.fit}</span>
              {size.width && size.width != "auto" ? (
                <div
                  onClick={(e) => {
                    props.resize({
                      width: wrapQuotes("auto"),
                    });
                    e.stopPropagation();
                  }}
                  aria-label={i18n.editor.scaleToFit}
                  style={{ display: "flex" }}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(
                      "ui//fold-horizontal"
                    ),
                  }}
                ></div>
              ) : (
                <div
                  onClick={(e) => {
                    props.resize({
                      width: wrapQuotes("100%"),
                    });
                    e.stopPropagation();
                  }}
                  aria-label={i18n.editor.scaleToFill}
                  style={{ display: "flex" }}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(
                      "ui//unfold-horizontal"
                    ),
                  }}
                ></div>
              )}
            </div>
          </div>
        )}
      {props.clientSize?.height > 50 &&
        props.resizeMode == FrameResizeMode.ResizeSelected && (
          <div className="mk-frame-resize-label-height">
            <div>
              <span>{labelForValue(size.height) ?? i18n.editor.fit}</span>
              {size.height && size.height != "auto" ? (
                <div
                  onClick={(e) => {
                    props.resize({
                      height: wrapQuotes("auto"),
                    });
                    e.stopPropagation();
                  }}
                  aria-label={i18n.editor.scaleToFit}
                  style={{ display: "flex" }}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//fold-vertical"),
                  }}
                ></div>
              ) : (
                <div
                  onClick={(e) => {
                    props.resize({
                      height: wrapQuotes("100%"),
                    });
                    e.stopPropagation();
                  }}
                  aria-label={i18n.editor.scaleToFill}
                  style={{ display: "flex" }}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(
                      "ui//unfold-vertical"
                    ),
                  }}
                ></div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};
