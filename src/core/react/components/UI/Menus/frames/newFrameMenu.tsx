import {
  contextNode,
  flowNode,
  groupNode,
  iconNode,
  imageNode,
  textNode,
  visualizationNode,
} from "schemas/kits/base";
import {
  buttonNode,
  callout,
  dividerNode,
  progressNode,
  ratingNode,
  tabsNode,
  toggleNode,
} from "schemas/kits/ui";
import { FrameNode, FrameRoot, FrameSchema } from "shared/types/mframe";

import i18n from "shared/i18n";

import { defaultViewTypes } from "core/schemas/viewTypes";
import { preprocessCode } from "core/utils/frames/linker";
import { wrapQuotes } from "core/utils/strings";
import type { Superstate } from "makemd-core";
import { SelectOption, SelectOptionType } from "makemd-core";
import { BlinkMode } from "shared/types/blink";
import { Rect } from "shared/types/Pos";
import { SpaceInfo } from "shared/types/spaceInfo";
import { uniqueNameFromString } from "shared/utils/array";
import { createInlineTable } from "shared/utils/makemd/inlineTable";
import { frameSchemaToTableSchema } from "shared/utils/makemd/schema";
import { defaultMenu } from "../menu/SelectionMenu";
import { visualizationConfigFields } from "schemas/kits/visualization";
import { MDBFrame } from "shared/types/mframe";
import { createVisualizationRows, createNewVisualizationFrame } from "core/utils/visualization/visualizationUtils";

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
      superstate.ui.quickOpen(BlinkMode.Open, rect, win, (path) => {
        addNode({
          ...flowNode.node,
          props: { value: wrapQuotes(path) },
          styles: {
            "--mk-min-mode": `true`,
            "--mk-expanded": `true`,
            width: `'100%'`,
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
      superstate.ui.quickOpen(BlinkMode.Open, rect, win, (path) => {
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
  const insertElement = (item: FrameNode | FrameRoot) => {
    // If it's a FrameRoot with children, we need to insert all nodes
    if ('children' in item && item.children) {
      const nodes = linkRoot("", item as FrameRoot, "", []);
      nodes.forEach(node => addNode(node));
    } else {
      const node = 'node' in item ? item.node : item;
      addNode({
        ...node,
      });
    }
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

  const createVisualizationWithType = async (chartType: string): Promise<string> => {
    try {
      const schemaTable = await superstate.spaceManager.framesForSpace(space.path);
      const configId = uniqueNameFromString(
        'vis',
        schemaTable.map((f) => f.id)
      );

      // First create the frame schema
      const newSchema: FrameSchema = {
        id: configId,
        name: 'vis',
        type: 'vis',
        def: {
          db: '' // Initialize with empty data source
        }
      };

      // Save the frame schema first
      await superstate.spaceManager.saveFrameSchema(
        space.path, 
        configId, 
        () => frameSchemaToTableSchema(newSchema)
      );

      // Create a new visualization frame with the specified chart type
      const visualizationFrame = createNewVisualizationFrame(configId);
      
      // Update the chart type in the main row
      const mainRow = visualizationFrame.rows.find(row => row.name === 'main');
      if (mainRow) {
        const props = JSON.parse(mainRow.props);
        props.chartType = chartType;
        mainRow.props = JSON.stringify(props);
      }

      // Save the frame data
      await superstate.spaceManager.saveFrame(space.path, visualizationFrame);
      return configId;
    } catch (error) {
      console.error('Error creating visualization:', error);
      return '';
    }
  };

  const cardNode: FrameRoot = {
    def: {
      id: 'cardNode',
      icon: "lucide//credit-card",
      description: "Card container with styled background",
    },
    node: {
      id: "card",
      schemaId: "card",
      name: "Card",
      rank: 0,
      parentId: "",
      styles: {
        layout: `"column"`,
        width: `'100%'`,
        height: `'100px'`,
        sem: `'card'`,
      },
      type: "group",
    }
  };

  const buttonGroupNode: FrameRoot = {
    def: {
      id: 'buttonNode',
      icon: "ui//mouse-pointer-click",
      description: "Button container with styled appearance",
    },
    node: {
      id: "button",
      schemaId: "button",
      name: "Button",
      rank: 0,
      parentId: "",
      styles: {
        layout: `"row"`,

        sem: `'button'`,
      },
      type: "group",
    },
    children: [
     
    ]
  };

  const defaultElements: FrameRoot[] = [
    textNode,
    imageNode,
    dividerNode,
    iconNode,
    groupNode,
    cardNode,
    buttonGroupNode,
    // contentNode,
  ];
  const defaultFrames: FrameRoot[] = [
    ratingNode(),
    toggleNode(),
    callout(),
    progressNode(),
    tabsNode(),
  ];

  // Chart types for chart submenu
  const chartTypes = [
    { type: "bar", name: "Bar Chart", icon: "lucide//bar-chart" },
    { type: "line", name: "Line Chart", icon: "lucide//activity" },
    { type: "scatter", name: "Scatter Plot", icon: "lucide//scatter-chart" },
    { type: "pie", name: "Pie Chart", icon: "lucide//pie-chart" },
    { type: "area", name: "Area Chart", icon: "lucide//area-chart" },
    { type: "radar", name: "Radar Chart", icon: "lucide//radar" },
  ];

  const visualizationOptions = chartTypes.map((chart) => ({
    name: chart.name,
    value: chart.type,
    icon: chart.icon,
    onClick: async () => {
      const configId = await createVisualizationWithType(chart.type);
      addNode({
        ...visualizationNode.node,
        props: {
          value: wrapQuotes(configId),
        },
      });
    },
  }));

  const selectOptions: SelectOption[] = [
    ...presets,
    {
      name: i18n.commands.chart,
      value: "chart",
      type: SelectOptionType.Submenu,
      onSubmenu: (offset: Rect) => {
        return superstate.ui.openMenu(
          offset,
          defaultMenu(superstate.ui, visualizationOptions),
          win
        );
      },
      icon: "lucide//bar-chart-3",
    },
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
        insertElement(f);
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
