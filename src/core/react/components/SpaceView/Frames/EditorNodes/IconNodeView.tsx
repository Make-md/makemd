import StickerModal from "core/react/components/UI/Modals/StickerModal";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { wrapQuotes } from "core/utils/strings";
import React, { useContext, useMemo } from "react";
import { FrameEditorMode } from "shared/types/frameExec";
import { windowFromDocument } from "shared/utils/dom";
import { parseStickerString } from "shared/utils/stickers";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";

export const IconNodeView = (props: FrameNodeViewProps) => {
  const {
    selectionMode,
    selected: frameSelected,
    selection,
  } = useContext(FrameSelectionContext);
  const { updateNode, nodes } = useContext(FramesEditorRootContext);
  const updateValue = (newValue: string) => {
    if (newValue != props.state.props?.value) {
      if (props.treeNode.editorProps?.linkedNode) {
        const node = nodes.find(
          (f) => f.id == props.treeNode.editorProps.linkedNode.node
        );
        updateNode(node, {
          props: {
            ...node.props,
            [props.treeNode.editorProps.linkedNode.prop]: wrapQuotes(newValue),
          },
        });
      } else {
        updateNode(props.treeNode.node, {
          props: { ...props.treeNode.node.props, value: wrapQuotes(newValue) },
        });
      }
    }
  };
  const selected = selection?.includes(props.treeNode.node.id);
  const editable = useMemo(() => {
    if (selectionMode == FrameEditorMode.Read) return false;
    if (selectionMode == FrameEditorMode.Page) return true;
    if (selectionMode == FrameEditorMode.Group && selected) return true;
    if (props.treeNode.isRef) {
      if (props.treeNode.editorProps.linkedNode && frameSelected) return true;
      return false;
    }
    return true;
  }, [props.treeNode, selectionMode, frameSelected, selected]);
  const selectIcon = (e: React.MouseEvent) => {
    props.superstate.ui.openPalette(
      <StickerModal
        ui={props.superstate.ui}
        selectedSticker={(emoji) => updateValue(emoji)}
      />,
      windowFromDocument(e.view.document)
    );
  };
  const [stickerType, stickerPath] = props.state.props?.value
    ? parseStickerString(props.state.props?.value)
    : [null, null];
  return (
    props.state &&
    (props.state.props?.value?.length > 0 ? (
      stickerType == "image" ? (
        <img
          className="mk-frame-icon"
          src={props.superstate.ui.getUIPath(
            props.superstate.imagesCache.get(stickerPath)
          )}
        ></img>
      ) : (
        <div
          className="mk-frame-icon"
          style={{}}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker(props.state.props?.value),
          }}
        ></div>
      )
    ) : editable ? (
      <div
        onClick={(e) => selectIcon(e)}
        aria-label="Select Sticker"
        className="mk-node-icon-placeholder"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//smile"),
        }}
      ></div>
    ) : (
      <></>
    ))
  );
};
