import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { removeQuotes, wrapQuotes } from "core/utils/strings";
import { i18n } from "makemd-core";
import React, { useContext } from "react";
import { windowFromDocument } from "shared/utils/dom";
import { StepSetter } from "../../Setters/StepSetter";
import { ToggleSetter } from "../../Setters/ToggleSetter";
import { AlignmentEditor } from "./AlignmentSubmenu";
import { HoverSubmenuProps } from "./HoverSubmenuProps";

export const LayoutSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue, state } = props;
  const { ungroupNode } = useContext(FramesEditorRootContext);

  return (
    <>
      {(selectedNode.type === "group" || selectedNode.type === "content") && (
        <>
          <div
            className="mk-editor-frame-node-button-back"
            aria-label="Back"
            onMouseDown={(e) => {
              props.exitMenu(e);
            }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//arrow-left"),
            }}
          ></div>
          <div className="mk-frame-submenu-label">{i18n.labels.layout}</div>
          <ToggleSetter
            icon={"ui//arrow-right"}
            superstate={props.superstate}
            name={i18n.editor.rows}
            value={selectedNode.styles?.["layout"]}
            setValue={(value) => saveStyleValue("layout", value)}
            onValue={"'row'"}
            defaultValue={"'row'"}
          ></ToggleSetter>

          <ToggleSetter
            icon={"ui//arrow-down"}
            superstate={props.superstate}
            name={i18n.editor.columns}
            value={selectedNode.styles?.["layout"]}
            setValue={(value) => saveStyleValue("layout", value)}
            onValue={"'column'"}
            defaultValue={"'column'"}
          ></ToggleSetter>

          <ToggleSetter
            icon={"ui//layout-dashboard"}
            superstate={props.superstate}
            name={i18n.editor.gallery}
            value={selectedNode.styles?.["layout"]}
            setValue={(value) => saveStyleValue("layout", value)}
            onValue={"'masonry'"}
            defaultValue={"'masonry'"}
          ></ToggleSetter>

          <div className="mk-divider"></div>
        </>
      )}

      {state?.styles?.["layout"] === "masonry" ? (
        <>
          <StepSetter
            superstate={props.superstate}
            name={i18n.editor.columns}
            value={selectedNode.styles?.["columnCount"]}
            min={0}
            setValue={(value) => saveStyleValue("columnCount", value)}
            units={[""]}
          ></StepSetter>
        </>
      ) : (
        <>
          <div className="mk-frame-submenu-label">Align</div>
          <div
            className="mk-editor-frame-node-button"
            onClick={(e) => {
              props.superstate.ui.openCustomMenu(
                (e.target as HTMLElement).getBoundingClientRect(),
                <AlignmentEditor {...props}></AlignmentEditor>,
                { ...props },
                windowFromDocument(e.view.document)
              );
            }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//grid"),
            }}
          ></div>

          <div
            className="mk-editor-frame-node-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              saveStyleValue(
                "flexWrap",
                `${
                  removeQuotes(selectedNode.styles?.flexWrap) == "wrap"
                    ? ""
                    : wrapQuotes("wrap")
                }`
              );
            }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//wrap-text"),
            }}
          ></div>

          <StepSetter
            superstate={props.superstate}
            name={i18n.editor.gap}
            value={selectedNode.styles?.["gap"]}
            setValue={(value) => saveStyleValue("gap", value)}
            units={["px"]}
          ></StepSetter>
        </>
      )}
      {(selectedNode.type === "group" || selectedNode.type === "container") && (
        <>
          <div className="mk-divider"></div>
          <div
            aria-label={i18n.labels.ungroup}
            className="mk-editor-frame-node-button"
            onClick={() => ungroupNode(selectedNode)}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//copy-x"),
            }}
          ></div>
        </>
      )}
    </>
  );
};
