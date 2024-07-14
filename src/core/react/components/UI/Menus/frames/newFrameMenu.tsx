import { newPathInSpace } from "core/superstate/utils/spaces";
import {
  contextNode,
  flowNode,
  groupNode,
  iconNode,
  imageNode,
  spacerNode,
  textNode,
} from "schemas/kits/base";
import {
  buttonNode,
  callout,
  circularProgressNode,
  dividerNode,
  progressNode,
  ratingNode,
  tabsNode,
  toggleNode,
} from "schemas/kits/ui";
import { FrameNode, FrameRoot } from "types/mframe";

import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";
import { createInlineTable } from "core/utils/contexts/inlineTable";
import { preprocessCode } from "core/utils/frames/linker";
import { wrapQuotes } from "core/utils/strings";
import { Rect } from "types/Pos";
import { SpaceInfo } from "types/mdb";
import { uniqueNameFromString } from "utils/array";

export const linkRoot = (
  parent: string,
  root: FrameRoot,
  schemaId: string,
  nodeIds: string[]
): FrameNode[] => {
  //assign IDs and relink props
  const relinkProps = (
    oldParent: string,
    newParent: string,
    node: FrameNode
  ) => {
    return {
      ...node,
      parentId: node.parentId == oldParent ? newParent : node.parentId,
      props: Object.keys(node?.props ?? {}).reduce((p, c) => {
        return {
          ...p,
          [c]: preprocessCode(node.props[c], oldParent, newParent),
        };
      }, node.props),
      actions: Object.keys(node?.actions ?? {}).reduce((p, c) => {
        return {
          ...p,
          [c]: preprocessCode(node.actions[c], oldParent, newParent),
        };
      }, node.actions),
      styles: Object.keys(node?.styles ?? {}).reduce((p, c) => {
        return {
          ...p,
          [c]: preprocessCode(node.styles[c], oldParent, newParent),
        };
      }, node.styles),
    };
  };
  const assignIDs = (
    parent: FrameRoot,
    parentId: string,
    ids: string[]
  ): [FrameNode[], string[]] => {
    const [newNodes, newID] = (parent.children ?? []).reduce<
      [FrameNode[], string[]]
    >(
      (p, c, i) => {
        const [oldNodes, _ids] = p;
        const newNodeID = uniqueNameFromString(c.node.id, _ids);
        const [childNodes, __ids] = assignIDs(c, newNodeID, [
          ..._ids,
          newNodeID,
        ]);
        const newNode: FrameNode = {
          ...c.node,
          id: newNodeID,
          schemaId: schemaId,
          parentId: parentId,
        };
        const returnNodes = [...oldNodes, newNode, ...childNodes].map((f) =>
          f.id != c.node.id
            ? relinkProps(c.node.id, newNodeID, f)
            : relinkProps(c.node.id, newNodeID, newNode)
        );
        return [returnNodes, __ids];
      },
      [[], ids]
    );

    return [newNodes, newID] as [FrameNode[], string[]];
  };
  const newParent: FrameNode = {
    ...root.node,
    id: uniqueNameFromString(root.node.id, nodeIds),
    parentId: parent,
    schemaId: schemaId,
  };
  const [newNodes, newIds] = assignIDs(root, newParent.id, [
    newParent.id,
    ...nodeIds,
  ]);
  const returnNodes: FrameNode[] = [newParent, ...newNodes].map((f) =>
    f.id != newParent.id
      ? relinkProps(root.node.id, newParent.id, f)
      : relinkProps(root.node.id, newParent.id, newParent)
  );
  return returnNodes;
};

type NewItem = {
  type: "preset" | "default" | "kit" | "element";
  value: any;
};

export const showNewFrameMenu = (
  rect: Rect,
  win: Window,
  superstate: Superstate,
  space: SpaceInfo,
  addNode: (node: FrameNode) => void,
  options: { searchable: boolean } = { searchable: true }
) => {
  const presets = [
    {
      name: i18n.commands.newNote,
      value: { type: "preset", value: "note" },
      section: "default",
      icon: "ui//mk-make-flow",
    },
    {
      name: i18n.commands.table,
      value: { type: "preset", value: "table" },
      section: "default",
      icon: "ui//mk-make-table",
    },
  ];
  const defaultElements: FrameRoot[] = [
    flowNode,
    contextNode,
    textNode,
    imageNode,
    dividerNode,
    iconNode,
    groupNode,
    spacerNode,
    // contentNode,
  ];
  const defaultFrames: FrameRoot[] = [
    buttonNode,
    ratingNode,
    toggleNode,
    callout,
    progressNode,
    circularProgressNode,
    tabsNode,
  ];
  const selectOptions = [
    ...presets,
    ...defaultElements.map((f) => ({
      name: f.node.name,
      value: { type: "element", value: f },
      section: "element",
      icon: f.def?.icon,
    })),
    ...defaultFrames.map((f) => ({
      name: f.node.name,
      value: { type: "default", value: f },
      section: "element",
      icon: f.def?.icon,
    })),
  ];
  const insertNode = async (item: NewItem) => {
    if (item.type == "preset") {
      if (item.value == "note") {
        const _space = superstate.spacesIndex.get(space.path);

        if (_space) {
          const newPath = await newPathInSpace(
            superstate,
            _space,
            "md",
            null,
            true
          );

          addNode({
            ...flowNode.node,
            props: { value: wrapQuotes(newPath) },
          });
        }
      } else if (item.value == "table") {
        const table = await createInlineTable(superstate, space.path);
        addNode({
          ...contextNode.node,
          props: { value: wrapQuotes(`${space.path}/#*${table}`) },
        });
      } else if (item.value == "link") {
      }
    } else if (item.type == "default") {
      addNode({
        ...item.value.node,
        type: "frame",
        ref: "spaces://$kit/#*" + item.value.def.id,
      });
    } else if (item.type == "element") {
      addNode({
        ...item.value.node,
      });
    }
  };
  superstate.ui.openMenu(
    rect,
    {
      ui: superstate.ui,
      multi: false,
      editable: false,
      value: [],
      options: selectOptions,
      saveOptions: (_, value: any[]) => insertNode(value[0]),
      searchable: options.searchable,
      showAll: true,
    },
    win
  );
};
