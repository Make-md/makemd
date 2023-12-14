import i18n from "core/i18n";
import StickerModal from "core/react/components/UI/Modals/StickerModal";
import { Sticker } from "core/react/components/UI/Stickers/Sticker";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { Superstate } from "core/superstate/superstate";
import { wrapQuotes } from "core/utils/strings";
import React, { useContext } from "react";
import { FrameRunInstance, FrameTreeNode } from "types/mframe";

export const IconNodeView = (props: {
  treeNode: FrameTreeNode;
  superstate: Superstate;
  instance: FrameRunInstance;
  editable: boolean;
}) => {
  const { saveNodes } = useContext(FramesEditorContext);
  const selectIcon = () => {
    props.superstate.ui.openPalette((_props: { hide: () => void }) => (
      <StickerModal
        ui={props.superstate.ui}
        hide={_props.hide}
        selectedSticker={(emoji) =>
          saveNodes([
            {
              ...props.treeNode.node,
              props: { ...props.treeNode.node.props, value: wrapQuotes(emoji) },
            },
          ])
        }
      />
    ));
  };
  return (
    props.instance.state[props.treeNode.id] &&
    (props.instance.state[props.treeNode.id].props?.value?.length > 0 ? (
      <Sticker
        sticker={props.instance.state[props.treeNode.id].props?.value}
        ui={props.superstate.ui}
      ></Sticker>
    ) : props.editable ? (
      <div onClick={() => selectIcon()} className="mk-frame-placeholder">
        {i18n.labels.selectIcon}
      </div>
    ) : (
      <></>
    ))
  );
};
