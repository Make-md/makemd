import i18n from "core/i18n";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { wrapQuotes } from "core/utils/strings";
import React, { useContext, useRef } from "react";
import { FrameRunInstance, FrameTreeNode } from "types/mframe";

export const TextNodeView = (props: {
  treeNode: FrameTreeNode;
  instance: FrameRunInstance;
  editable: boolean;
}) => {
  const fileNameRef = useRef(null);
  const { saveNodes } = useContext(FramesEditorContext);
  const onBlur = (e: React.ChangeEvent<HTMLDivElement>) => {
    const newValue = e.target.innerHTML;
    if (newValue != props.instance.state[props.treeNode.id].props?.value) {
      saveNodes([
        {
          ...props.treeNode.node,
          props: { ...props.treeNode.node.props, value: wrapQuotes(newValue) },
        },
      ]);
    }
  };
  const onKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
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

  return (
    props.instance.state[props.treeNode.id] && (
      <div
        className={`mk-frame-text`}
        placeholder={props.editable && i18n.labels.textPlaceholder}
        dangerouslySetInnerHTML={{
          __html: props.instance.state[props.treeNode.id].props?.value,
        }}
        onBlur={onBlur}
        onDrop={(e) => e.preventDefault()}
        onKeyDown={onKeyDown}
        onKeyPress={onKeyPress}
        onKeyUp={onKeyUp}
        ref={fileNameRef}
        contentEditable={props.editable}
        style={
          {
            ...props.instance.state[props.treeNode.id]?.styles,
          } as React.CSSProperties
        }
      ></div>
    )
  );
};
