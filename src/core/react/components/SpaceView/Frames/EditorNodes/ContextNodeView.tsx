import i18n from "core/i18n";
import { SpaceFragmentViewComponent } from "core/react/components/SpaceView/Editor/EmbedView/SpaceFragmentView";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import { FramesEditorRootContext } from "core/react/context/FrameEditorRootContext";
import { FrameInstanceContext } from "core/react/context/FrameInstanceContext";
import { contextPathFromPath } from "core/utils/contexts/context";
import { wrapQuotes } from "core/utils/strings";
import React, { useContext } from "react";
import { defaultContextSchemaID } from "schemas/mdb";
import { windowFromDocument } from "utils/dom";
import { FrameNodeViewProps } from "../ViewNodes/FrameView";

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

export const ContextNodeView = (
  props: FrameNodeViewProps & {
    containerRef?: React.RefObject<HTMLDivElement>;
    source?: string;
  }
) => {
  const fullPath = props.state?.props?.value;
  const { updateNode } = useContext(FramesEditorRootContext);
  const { id } = useContext(FrameInstanceContext);
  const selectLink = (e: any) => {
    showSpacesMenu(
      e,
      windowFromDocument(e.view.document),
      props.superstate,
      (link: string) =>
        updateNode(props.treeNode.node, {
          props: {
            ...props.treeNode.node.props,
            value: wrapQuotes(link + "#^" + defaultContextSchemaID),
          },
        })
    );
  };
  const setFrameSchema = (schema: string) => {
    if (props.treeNode.node.props.value == "$contexts['$space']['space']") {
      updateNode(props.treeNode.node, {
        props: {
          ...props.treeNode.node.props,
          value: `$contexts['$space']['space']+"/#*${schema}"`,
        },
      });
      return;
    }
    contextPathFromPath(
      props.superstate,
      props.superstate.spaceManager.resolvePath(fullPath, props.source)
    ).then((f) => {
      updateNode(props.treeNode.node, {
        props: {
          ...props.treeNode.node.props,
          value: wrapQuotes(f?.space + "#*" + schema),
        },
      });
    });
  };
  return props.state && fullPath ? (
    <SpaceFragmentViewComponent
      id={id}
      source={props.source}
      showTitle={true}
      superstate={props.superstate}
      path={fullPath}
      minMode={props.state?.styles?.["--mk-min-mode"]}
      containerRef={props.containerRef}
      setFrameSchema={setFrameSchema}
    ></SpaceFragmentViewComponent>
  ) : (
    <div className="mk-frame-placeholder" onClick={(e) => selectLink(e)}>
      {i18n.labels.selectSpace}
    </div>
  );
};
