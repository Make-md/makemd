import i18n from "core/i18n";
import { EmbedViewComponent } from "core/react/components/SpaceView/Editor/EmbedView/EmbedContextViewComponent";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { Superstate } from "core/superstate/superstate";
import { wrapQuotes } from "core/utils/strings";
import React, { useContext } from "react";
import { defaultContextSchemaID } from "schemas/mdb";
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

export const SpaceNodeView = (props: {
  treeNode: FrameTreeNode;
  superstate: Superstate;
  instance: FrameRunInstance;
  editable: boolean;
}) => {
  const fullPath = props.instance.state[props.treeNode.id]?.props?.value;

  const { saveNodes } = useContext(FramesEditorContext);
  const selectLink = (e: any) => {
    showSpacesMenu(e, props.superstate, (link: string) =>
      saveNodes([
        {
          ...props.treeNode.node,
          props: {
            ...props.treeNode.node.props,
            value: wrapQuotes(link + "#^" + defaultContextSchemaID),
          },
        },
      ])
    );
  };

  return props.instance.state[props.treeNode.id] && fullPath ? (
    <>
      <EmbedViewComponent
        superstate={props.superstate}
        path={fullPath}
        minMode={props.instance.state[props.treeNode.id]?.props?.minMode}
      ></EmbedViewComponent>
    </>
  ) : (
    <div className="mk-frame-placeholder" onClick={(e) => selectLink(e)}>
      {i18n.labels.selectSpace}
    </div>
  );
};
