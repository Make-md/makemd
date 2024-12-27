import ImageModal from "core/react/components/UI/Modals/ImageModal";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import { stringIsConst } from "core/utils/frames/frames";
import { wrapQuotes } from "core/utils/strings";
import React, { useContext, useMemo } from "react";
import { FrameEditorMode } from "shared/types/frameExec";
import { windowFromDocument } from "shared/utils/dom";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";

export const ImageNodeView = (props: FrameNodeViewProps) => {
  const value = props.state.props.value;
  const sourcePath = useMemo(() => {
    return props.superstate.ui.getUIPath(value, true);
  }, [value]);
  const { nodes, updateNode } = useContext(FramesEditorRootContext);
  const { linkedProps } = useContext(FrameInstanceContext);
  const {
    selectionMode,
    selected: frameSelected,
    selection,
  } = useContext(FrameSelectionContext);
  const selected = selection?.includes(props.treeNode.node.id);
  const showModal = (e: React.MouseEvent) => {
    if (
      !stringIsConst(props.treeNode.node.props.value) &&
      !linkedProps.some(
        (f) =>
          props.treeNode.editorProps.linkedNode?.node ==
            props.treeNode.node.schemaId &&
          props.treeNode.editorProps.linkedNode?.prop == f
      )
    )
      return;
    props.superstate.ui.openPalette(
      <ImageModal
        superstate={props.superstate}
        selectedPath={(image) => saveValue(image)}
      ></ImageModal>,
      windowFromDocument(e.view.document)
    );
  };
  const saveValue = (newValue: string) => {
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
  return props.state?.props.value?.length > 0 ? (
    <img
      className="mk-node-image"
      width={props.state?.styles.width}
      height={props.state?.styles.height}
      style={
        {
          borderRadius: props.state?.styles.borderRadius,
          maxHeight: props.state?.styles.maxHeight,
        } as React.CSSProperties
      }
      src={sourcePath}
    />
  ) : editable ? (
    <div
      className="mk-node-image-placeholder"
      dangerouslySetInnerHTML={{
        __html: props.superstate.ui.getPlaceholderImage("image-select"),
      }}
      style={
        {
          borderRadius: props.state?.styles.borderRadius,
          maxHeight: props.state?.styles.maxHeight,
        } as React.CSSProperties
      }
      onClick={(e) => showModal(e)}
    ></div>
  ) : (
    <></>
  );
};
