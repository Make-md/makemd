import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { Superstate } from "makemd-core";
import React, { useContext } from "react";
import i18n from "shared/i18n";
export const FrameMultiNodeEditor = (props: { superstate: Superstate }) => {
  const { groupNodes, saveNodes, nodes } = useContext(FramesEditorRootContext);
  const { selection, select } = useContext(FrameSelectionContext);

  const selectedNodes = selection
    .map((f) => nodes.find((n) => n.id == f))
    .filter((f) => f);
  return (
    <div
      className="mk-editor-frame-node-selector"
      style={{ pointerEvents: "auto" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mk-editor-frame-node-button">
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//copy-check"),
          }}
        ></div>
        {i18n.labels.itemsSelected.replace("${1}", selection.length.toString())}
      </div>
      <div className="mk-divider"></div>
      <div
        aria-label={i18n.editor.createVerticalSection}
        className="mk-editor-frame-node-button"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//rows"),
        }}
        onClick={() =>
          groupNodes(selectedNodes, {
            layoutAlign: `"left"`,
            gap: `"8px"`,
          })
        }
      ></div>
      <div
        aria-label={i18n.editor.createHorizontalSection}
        className="mk-editor-frame-node-button "
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//columns"),
        }}
        onClick={() =>
          groupNodes(selectedNodes, { layout: `"row"`, gap: `"8px"` })
        }
      ></div>
      <div className="mk-divider"></div>
      <div
        className="mk-editor-frame-node-button "
        aria-label={i18n.menu.delete}
        onClick={() => saveNodes([], selectedNodes)}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//trash"),
        }}
      ></div>
    </div>
  );
};
