import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { FrameSelectionContext } from "core/react/context/FrameSelectionContext";
import i18n from "shared/i18n";

import { stringIsConst } from "core/utils/frames/frames";
import { wrapQuotes } from "core/utils/strings";
import React, { useContext, useMemo, useRef } from "react";
import { FrameEditorMode } from "shared/types/frameExec";

import useLongPress from "core/react/hooks/useLongPress";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";

export const TextNodeView = (props: FrameNodeViewProps) => {
  const {
    selectionMode,
    selection,
    selectable,
    selected: frameSelected,
    select,
  } = useContext(FrameSelectionContext);
  const fileNameRef = useRef(null);
  const { updateNode, nodes, deleteNode } = useContext(FramesEditorRootContext);
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
  const onBlur = (e: React.ChangeEvent<HTMLDivElement>) => {
    const newValue = e.target.innerHTML;
    updateValue(newValue);
  };
  const onKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.key == "Delete" || e.key == "Backspace") {
      if ((e.target as HTMLDivElement).innerHTML == "")
        deleteNode(props.treeNode.node);
    }
    if (e.key == "a" && e.metaKey) {
      e.preventDefault();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(e.target as HTMLDivElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    if (e.key == "Enter") {
      (e.target as HTMLDivElement).blur();
      e.preventDefault();
    }
    if (e.key == "Escape") {
      (e.target as HTMLDivElement).blur();
      e.preventDefault();
    }
  };
  const onClick = (e: React.MouseEvent) => {
    if (editable) {
      e.stopPropagation();
    }
  };
  const onMouseDown = (e: React.MouseEvent) => {
    if (editable) e.stopPropagation();
    if (
      selectionMode == FrameEditorMode.Group &&
      !props.treeNode.isRef &&
      selectable
    ) {
      select(props.treeNode.id);
      e.stopPropagation();
    }
  };
  const onLongPress = () => {
    if (editable) {
      select(props.treeNode.node.id, false);
      return;
    }
  };
  useLongPress(fileNameRef, onLongPress);

  const selected = selection.includes(props.treeNode.id);
  const { linkedProps } = useContext(FrameInstanceContext);

  const editable = useMemo(() => {
    if (selectionMode == FrameEditorMode.Read) return false;

    if (props.treeNode.isRef) {
      if (props.treeNode.editorProps.linkedNode && frameSelected) return true;
      return false;
    }
    if (
      linkedProps.some(
        (f) =>
          props.treeNode.editorProps.linkedNode?.node ==
            props.treeNode.node.schemaId &&
          props.treeNode.editorProps.linkedNode?.prop == f
      )
    )
      return true;
    if (!props.treeNode.node.props.value) return true;
    if (!stringIsConst(props.treeNode.node.props.value)) return false;
    if (selectionMode == FrameEditorMode.Page) return true;
    if (selectionMode == FrameEditorMode.Group && selected) return true;
    return false;
  }, [props.treeNode, selectionMode, frameSelected, selected, linkedProps]);

  return (
    props.state && (
      <div
        className={`mk-frame-text`}
        data-placeholder={
          editable || selectable ? i18n.labels.textPlaceholder : ""
        }
        dangerouslySetInnerHTML={{
          __html: props.state.props?.value,
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onBlur={onBlur}
        onDrop={(e) => e.preventDefault()}
        onKeyDown={onKeyDown}
        onKeyPress={onKeyPress}
        onKeyUp={onKeyUp}
        ref={fileNameRef}
        contentEditable={editable}
        // style={
        //   {
        //     ...props.state?.styles,
        //   } as React.CSSProperties
        // }
      ></div>
    )
  );
};
