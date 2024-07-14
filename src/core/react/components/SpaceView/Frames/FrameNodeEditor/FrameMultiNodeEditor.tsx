import i18n from "core/i18n";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { Superstate } from "core/superstate/superstate";
import React, { useContext } from "react";
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
      <div className="mk-mark">
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
        className="mk-mark"
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
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//columns"),
        }}
        onClick={() =>
          groupNodes(selectedNodes, { layout: `"row"`, gap: `"8px"` })
        }
      ></div>
      <div className="mk-divider"></div>
      <div
        className="mk-mark"
        aria-label={i18n.menu.delete}
        onClick={() => saveNodes([], selectedNodes)}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//trash"),
        }}
      ></div>
    </div>
  );
};
