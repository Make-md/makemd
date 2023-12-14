import { showNewFrameMenu } from "core/react/components/UI/Menus/frames/newFrameMenu";
import ImageModal from "core/react/components/UI/Modals/ImageModal";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { FramesMDBContext } from "core/react/context/FramesMDBContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { SpaceState } from "core/types/superstate";
import { findParent } from "core/utils/frames/ast";
import React, { useContext, useMemo, useState } from "react";
import { URI } from "types/path";
import { FrameNodeView } from "./Frames/EditorNodes/FrameNodeView";
export const SpaceGalleryView = (props: {
  superstate: Superstate;
  path: URI;
  spaceCache: SpaceState;
}) => {
  const { spaceInfo } = useContext(SpaceContext);
  const { frameSchema } = useContext(FramesMDBContext);
  const {
    instance,
    nodes,
    saveNodes,
    moveNodeFromSchema,
    fastSaveState,
    dragNode,
    setDragNode,
    addNode,
    setHoverNode,
  } = useContext(FramesEditorContext);
  const ref = React.useRef<HTMLDivElement>();
  const [editMode, setEditMode] = useState(0);
  const changeCover = (e: React.MouseEvent) => {
    props.superstate.ui.openPalette((_props: { hide: () => void }) => (
      <ImageModal
        superstate={props.superstate}
        hide={_props.hide}
        selectedPath={(image) =>
          saveNodes([
            {
              ...instance.root.node,
              styles: {
                width: `'100%'`,
                height: `'100%'`,
                background: `'url("${props.superstate.ui.getUIPath(image)}")'`,
                backgroundSize: `'cover'`,
              },
            },
          ])
        }
      ></ImageModal>
    ));
  };
  const dragTreeNode = useMemo(() => {
    if (dragNode === null) {
      return null;
    }

    const node = findParent(instance.root, dragNode)?.children.find(
      (f) => f.id == dragNode
    );

    return node;
  }, [dragNode, instance.root]);

  return (
    <div className={`mk-space-gallery-container`}>
      <div className="mk-space-gallery-controls">
        <button onClick={(e) => changeCover(e)}>
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-make-image"),
            }}
          ></div>
        </button>
        <button
          onClick={(e) =>
            showNewFrameMenu(e, props.superstate, spaceInfo, addNode)
          }
        >
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-make-image"),
            }}
          ></div>
        </button>
        <button onClick={(e) => setEditMode((p) => (p == 2 ? 0 : 2))}>
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-ui-edit"),
            }}
          ></div>
          {editMode}
        </button>
      </div>
      <div className={`mk-space-gallery`} ref={ref}>
        {instance.root && (
          <>
            <FrameNodeView
              editMode={editMode}
              superstate={props.superstate}
              treeNode={instance.root}
              instance={instance}
            ></FrameNodeView>
          </>
        )}
      </div>
    </div>
  );
};
