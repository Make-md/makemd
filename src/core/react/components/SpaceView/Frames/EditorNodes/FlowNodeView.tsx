import i18n from "core/i18n";
import { PathView } from "core/react/components/PathView/PathView";
import { showLinkMenu } from "core/react/components/UI/Menus/properties/linkMenu";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { Superstate } from "core/superstate/superstate";
import { wrapQuotes } from "core/utils/strings";
import React, { useContext } from "react";
import { FrameRunInstance, FrameTreeNode } from "types/mframe";

function parseContent(input: string): string {
  // Define regular expressions to match ![![content]] and !![[content]]
  const regex1 = /!\[!\[(.*?)\]\]/;
  const regex2 = /!!\[\[(.*?)\]\]/;

  // Apply the regex to the input string
  const match1 = input.match(regex1);
  const match2 = input.match(regex2);

  // If a match was found for the first regex, return the content.
  // If no match was found, check for the second regex. If a match is found, return the content.
  // If no match was found for both, return the original string
  return match1 ? match1[1] : match2 ? match2[1] : input;
}

export const FlowNodeView = (props: {
  treeNode: FrameTreeNode;
  superstate: Superstate;
  instance: FrameRunInstance;
  source?: string;
  editable: boolean;
  menuRef?: React.Ref<unknown>;
}) => {
  const fullPath = props.instance.state[props.treeNode.id]?.props?.value;
  const path = fullPath ? parseContent(fullPath) : null;
  const { saveNodes } = useContext(FramesEditorContext);
  const selectLink = (e: any) => {
    showLinkMenu(e, props.superstate, (link) =>
      saveNodes([
        {
          ...props.treeNode.node,
          props: { ...props.treeNode.node.props, value: wrapQuotes(link) },
        },
      ])
    );
  };
  return props.instance.state[props.treeNode.id] && path ? (
    <>
      <PathView
        source={props.source}
        superstate={props.superstate}
        path={path}
        load={true}
        classname="mk-flow-node"
        ref={props.menuRef}
      ></PathView>
    </>
  ) : (
    <div className="mk-frame-placeholder" onClick={(e) => selectLink(e)}>
      {i18n.labels.selectNote}
    </div>
  );
};
