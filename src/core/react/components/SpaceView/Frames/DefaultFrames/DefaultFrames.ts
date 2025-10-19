import i18n from "shared/i18n";
import { Predicate } from "shared/types/predicate";

import { nodeToFrame } from "core/utils/frames/nodes";
import { contextNode, flowNode, groupNode } from "schemas/kits/base";
import { defaultFrameListViewID, defaultFrameListViewSchema, defaultMainFrameSchema, mainFrameID } from "schemas/mdb";
import { defaultContextSchemaID } from "shared/schemas/context";
import { defaultContextFields } from "shared/schemas/fields";
import { SpaceProperty } from "shared/types/mdb";
import { FrameNode, MDBFrames } from "shared/types/mframe";

 const defaultMainFrame : FrameNode[] = [
  {
    ...groupNode.node,
    id: "main",
    type: "group",
    rank: 0,
    schemaId: "main",
    props: {
      note: '',
      space: ''
    },
    types: {
      note: 'link',
      space: 'space'
    },
    propsValue: {
      note: JSON.stringify({
        alias: i18n.defaults.spaceNote
      }),
      space: JSON.stringify({
        alias: i18n.defaults.spaceContext
      })
    },
    styles: {
      layout: `"column"`,
    },
  },
  
  {
    ...contextNode.node,
    id: "context",
    rank: 0,
    props: {
      value: `$contexts.$space.space`,
    },
    styles: { width: `"100%"` },
    parentId: "main",
    schemaId: "main",
  },
];


const folderNoteMainFrame : FrameNode[] = [
    {
      ...groupNode.node,
      id: "main",
      type: "group",
      rank: 0,
      schemaId: "main",
      props: {
        note: '',
        space: ''
      },
      types: {
        note: 'link',
        space: 'space'
      },
      propsValue: {
        note: JSON.stringify({
          alias: i18n.defaults.spaceNote
        }),
        space: JSON.stringify({
          alias: i18n.defaults.spaceContext
        })
      },
      styles: {
        layout: `"column"`,
      },
    },
    
    {
      ...flowNode.node,
      rank: 1,
      props: {
        value: `$contexts.$space.note`,
        
      },
      styles: { width: `"100%"`, "--mk-min-mode": `true`, "--mk-expanded": `true`, padding: `"0px"` },
      parentId: "main",
      schemaId: "main",
    },
    {
      ...contextNode.node,
      id: "context",
      rank: 2,
      props: {
        value: `$contexts.$space.space`,
      },
      styles: { width: `"100%"` },
      parentId: "main",
      schemaId: "main",
    },
  ];

  export const DefaultEverViewTables : MDBFrames = {

  [defaultFrameListViewID]: {
    schema: {id: defaultFrameListViewID,
      name: i18n.labels.all,
      type: "view",
      def: JSON.stringify({db: defaultContextSchemaID, icon: 'ui//file-stack'}),
    predicate: JSON.stringify({listView:"spaces://$kit/#*listView", listGroup: "spaces://$kit/#*listGroup", listItem: "spaces://$kit/#*overviewItem", view: 'list' } as Predicate)},
    cols: defaultContextFields.rows as SpaceProperty[],
  rows: []
  }
  };
  
  export const DefaultFolderNoteMDBTables : MDBFrames = {
    main: { schema: defaultMainFrameSchema(mainFrameID),
    cols: [],
    rows: folderNoteMainFrame.map((f) => nodeToFrame(f))
  },
  [defaultFrameListViewID]: {
    schema: defaultFrameListViewSchema,
    cols: defaultContextFields.rows as SpaceProperty[],
  rows: []
  }
  };

  export const DefaultMDBTables : MDBFrames = {
    main: { schema: defaultMainFrameSchema(mainFrameID),
    cols: [],
    rows: defaultMainFrame.map((f) => nodeToFrame(f))
  },
  [defaultFrameListViewID]: {
    schema: defaultFrameListViewSchema,
    cols: defaultContextFields.rows as SpaceProperty[],
  rows: []
  }
  };

  export const DefaultSpaceCols : SpaceProperty[] = [{name: 'space', type: 'space', schemaId: 'main', value: JSON.stringify({
    alias: i18n.defaults.spaceContext
  })}, {name: 'note', type: 'link', schemaId: 'main', value: JSON.stringify({
    alias: i18n.defaults.spaceNote
  })}]