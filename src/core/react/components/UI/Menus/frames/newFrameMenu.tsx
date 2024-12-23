import {
  contextNode,
  flowNode,
  groupNode,
  iconNode,
  imageNode,
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
import { FrameNode, FrameRoot, FrameSchema } from "types/mframe";

import i18n from "core/i18n";

import { BlinkMode, openBlinkModal } from "core/react/components/Blink/Blink";
import { defaultViewTypes } from "core/schemas/viewTypes";
import type { Superstate } from "core/superstate/superstate";
import { createInlineTable } from "core/utils/contexts/inlineTable";
import { preprocessCode } from "core/utils/frames/linker";
import { frameSchemaToTableSchema } from "core/utils/frames/nodes";
import { wrapQuotes } from "core/utils/strings";
import { SelectOption } from "makemd-core";
import { Rect } from "types/Pos";
import { SpaceInfo } from "types/mdb";
import { uniqueNameFromString } from "utils/array";
import { defaultMenu, SelectOptionType } from "../menu/SelectionMenu";

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

export const showNewFrameMenu = (
  rect: Rect,
  win: Window,
  superstate: Superstate,
  space: SpaceInfo,
  addNode: (node: FrameNode) => void,
  options: { searchable: boolean } = { searchable: true }
) => {
  const insertPresetNode = async (value: string) => {
    if (value == "note") {
      openBlinkModal(superstate, BlinkMode.Open, win, (path) => {
        addNode({
          ...flowNode.node,
          props: { value: wrapQuotes(path) },
          styles: {
            "--mk-min-mode": `true`,
            "--mk-expanded": `true`,
          },
        });
      });
    } else if (value == "table") {
      const table = await createInlineTable(superstate, space.path);
      addNode({
        ...contextNode.node,
        props: { value: wrapQuotes(`./#*${table}`) },
      });
    } else if (value == "link") {
      openBlinkModal(superstate, BlinkMode.Open, win, (path) => {
        addNode({
          ...flowNode.node,
          props: { value: wrapQuotes(path) },
        });
      });
    }
  };
  const insertNode = (item: FrameNode, id: string) => {
    addNode({
      ...item,
      type: "frame",
      ref: "spaces://$kit/#*" + id,
    });
  };
  const insertElement = (item: FrameNode) => {
    addNode({
      ...item,
    });
  };
  const presets = [
    {
      name: i18n.commands.newNote,
      value: "presetnote",
      onClick: () => {
        insertPresetNode("note");
      },
      icon: "ui//mk-make-flow",
    },
    {
      name: i18n.commands.internalLink,
      value: "presetlink",
      onClick: () => {
        insertPresetNode("link");
      },
      icon: "ui//mk-make-link",
    },
    {
      name: i18n.commands.table,
      value: "presettable",
      onClick: () => {
        insertPresetNode("table");
      },
      icon: "ui//mk-make-table",
    },
  ];
  const newViewSchema = async (value: string) => {
    const schemaTable = await superstate.spaceManager.framesForSpace(
      space.path
    );
    const uniqueId = uniqueNameFromString(
      value,
      schemaTable.map((f) => f.id)
    );

    const viewLayout = defaultViewTypes[value];
    const newSchema = {
      name: viewLayout.name,
      id: uniqueId,
      type: "view",
      def: {
        db: "files",
      },
      predicate: JSON.stringify({
        view: viewLayout.view,
        listView: viewLayout.listView,
        listGroup: viewLayout.listGroup,
        listItem: viewLayout.listItem,
      }),
    } as FrameSchema;
    superstate.spaceManager
      .saveFrameSchema(space.path, uniqueId, () =>
        frameSchemaToTableSchema(newSchema)
      )
      .then(() => {
        return addNode({
          ...contextNode.node,
          props: { value: wrapQuotes(`./#*${newSchema.id}`) },
        });
      });
  };
  const contextViews = Object.keys(defaultViewTypes).map((f) => {
    const view = defaultViewTypes[f];
    return {
      name: view.name,
      value: view.view,
      onClick: () => {
        newViewSchema(f);
      },
      icon: view.icon,
    };
  });

  const defaultElements: FrameRoot[] = [
    textNode,
    imageNode,
    dividerNode,
    iconNode,
    groupNode,
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

  const selectOptions: SelectOption[] = [
    ...presets,
    {
      name: "List View",
      value: "frame",
      type: SelectOptionType.Submenu,
      onSubmenu: (offset: Rect) => {
        return superstate.ui.openMenu(
          offset,
          defaultMenu(superstate.ui, contextViews),
          win
        );
      },
      icon: "ui//mk-make-list",
    },

    ...defaultElements.map((f) => ({
      name: f.node.name,
      onClick: () => {
        insertElement(f.node);
      },
      value: f.node.name,
      icon: f.def?.icon,
    })),
    ...defaultFrames.map((f) => ({
      name: f.node.name,
      value: "frame" + f.node.name,
      onClick: () => {
        insertNode(f.node, f.def.id);
      },
      icon: f.def?.icon,
    })),
  ];
  superstate.ui.openMenu(
    rect,
    {
      ui: superstate.ui,
      multi: false,
      editable: false,
      value: [],
      options: selectOptions,
      searchable: options.searchable,
      showAll: true,
    },
    win
  );
};
