import i18n from "core/i18n";
import { frameSchemaToMDBSchema, nodeToFrame } from "core/utils/frames/nodes";
import { flowNode, groupNode, spaceNode } from "schemas/frames";
import { defaultContextFields, defaultFrameListViewID, defaultFrameListViewSchema, defaultMainFrameSchema, mainFrameID } from "schemas/mdb";
import { SpaceProperty } from "types/mdb";
import { FrameNode, MDBFrames } from "types/mframe";

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
        class: `'mk-f-main'`
      },
    },
    {
      ...flowNode.node,
      rank: 0,
      props: {
        value: `main.props.note`,
      },
      styles: { width: `'100%'` },
      parentId: "main",
      schemaId: "main",
    },
    {
      ...spaceNode.node,
      id: "context",
      rank: 1,
      props: {
        value: `main.props.space`,
      },
      styles: { width: `'100%'` },
      parentId: "main",
      schemaId: "main",
    },
  ];

  

export const DefaultMDBTables : MDBFrames = {
    main: { schema: defaultMainFrameSchema(mainFrameID),
    cols: [{name: 'space', type: 'space', schemaId: 'main', value: JSON.stringify({
      alias: i18n.defaults.spaceContext
    })}, {name: 'note', type: 'link', schemaId: 'main', value: JSON.stringify({
      alias: i18n.defaults.spaceNote
    })}],
    rows: defaultMainFrame.map((f) => nodeToFrame(f))
},
[defaultFrameListViewID]: {
  schema: frameSchemaToMDBSchema(defaultFrameListViewSchema),
  cols: defaultContextFields.rows as SpaceProperty[],
rows: []


}
  };