import { showNewFrameMenu } from "core/react/components/UI/Menus/frames/newFrameMenu";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { removeQuotes, wrapQuotes } from "core/utils/strings";
import i18n from "shared/i18n";
import React, { useContext } from "react";
import { FrameNode } from "shared/types/mframe";
import { windowFromDocument } from "shared/utils/dom";
import { StepSetter } from "../../Setters/StepSetter";
import { ToggleSetter } from "../../Setters/ToggleSetter";
import { AlignmentEditor } from "./AlignmentSubmenu";
import { HoverSubmenuProps } from "./HoverSubmenuProps";
export const ContentSubmenu = (props: HoverSubmenuProps) => {
  const { spaceInfo } = useContext(SpaceContext);
  const { addNode } = useContext(FramesEditorRootContext);
  const { select } = useContext(FrameSelectionContext);
  const { selectedNode, saveStyleValue } = props;

  return (
    <>
      <div
        className="mk-editor-frame-node-button-primary"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//plus"),
        }}
        onClick={(e) => {
          showNewFrameMenu(
            (e.target as HTMLElement).getBoundingClientRect(),
            windowFromDocument(e.view.document),
            props.superstate,
            spaceInfo,
            (newNode: FrameNode) =>
              addNode(newNode, props.selectedNode, true).then((f) =>
                select(f.id)
              )
          );
          e.stopPropagation();
        }}
      ></div>
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
      {props.state.styles?.["layout"] == "row" ||
      props.state.styles?.["layout"] == "column" ? (
        <>
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
                  removeQuotes(selectedNode.styles.flexWrap) == "wrap"
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
      ) : (
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
      )}
    </>
  );
};
