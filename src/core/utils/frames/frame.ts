import * as acorn from "acorn";
import { simple } from "acorn-walk";
import _ from "lodash";
import { Superstate } from "makemd-core";
import { defaultFrameSchema } from "schemas/frames";
import { fieldSchema } from "shared/schemas/fields";
import { FrameExecutable, LinkedContext, LinkedNode } from "shared/types/frameExec";
import { DBTables, SpaceTable } from "shared/types/mdb";
import { FrameRoot, FrameTreeProp, MDBFrames, MFrame } from "shared/types/mframe";
import { SpaceInfo } from "shared/types/spaceInfo";
import { deepOmit } from "../objects";
import { flattenToFrameNodes } from "./ast";
import { stringIsConst } from "./frames";
import { relinkProps } from "./linker";
import { nodeToFrame } from "./nodes";

export const executableChanged = (a: FrameExecutable, b: FrameExecutable) => {
  return !_.isEqual(
    deepOmit(a, [
      "execPropsOptions",
      "execProps",
      "execStyles",
      "execActions",
      "parent",
    ]),
    deepOmit(b, [
      "execPropsOptions",
      "execProps",
      "execStyles",
      "execActions",
      "parent",
    ])
  )
}

export const stateChangedForProps = (
  propSetters: string[],
  props: FrameTreeProp,
  newState: FrameTreeProp,
  schemaID: string
) => {
  return propSetters.filter(
    (f) => newState[schemaID]?.props[f] && !_.isEqual(newState[schemaID].props[f], props?.[f])
  );
};

export const parseLinkedPropertyToValue = (property: string) => {
  if (!property) return null;
  if (property.startsWith("$contexts")) {
    const { context, prop } = parseContextNode(property);
    return prop;
  } else {
    const linkedNode = parseLinkedNode(property);
    return linkedNode?.prop;
  }
};

export const parseContextNode = (pathString: string) : LinkedContext => {
  if (!pathString || stringIsConst(pathString)) return null;
  const path : string[] = [];
  const isMultiLine = pathString.includes('\n');
  if (isMultiLine) {
      // If the code block is multi-line, prepend the last line with `return`.
      const lines = pathString.split('\n').filter(line => line.trim() !== '');
      lines[lines.length - 1] = `${lines[lines.length - 1].replace("return ", "")}`;
      pathString = lines.join('\n');
      
  }
  try {
  const ast = acorn.parse(pathString, {ecmaVersion: 2020});
  


  simple(ast, {
      MemberExpression(node) {
        //@ts-ignore
        if (node.object.type === 'Identifier' && !path.includes(node.object.name)) {
          //@ts-ignore
          path.push(node.object.name);
      }
        //@ts-ignore
          if (node.computed) {
              // Handle bracket notation
              // This is simplistic and assumes a simple literal inside brackets
              //@ts-ignore
              path.push(node.property.value);
          } else {
              // Handle dot notation
              //@ts-ignore
              path.push(node.property.name);
          }
      }
  });
} catch  (e){
  console.log(e)
}
  if (path.length < 3) return null;
  return {
    context: path[1],
    prop: path[2],
  }
}

export const parseLinkedNode = (pathString: string) : LinkedNode => {
  if (!pathString || stringIsConst(pathString)) return null;
  const path : string[] = [];
  const isMultiLine = pathString.includes('\n');
  if (isMultiLine) {
      // If the code block is multi-line, prepend the last line with `return`.
      const lines = pathString.split('\n').filter(line => line.trim() !== '');
      lines[lines.length - 1] = `${lines[lines.length - 1].replace("return ", "")}`;
      pathString = lines.join('\n');
      
  }
  try {
  const ast = acorn.parse(pathString, {ecmaVersion: 2020});
  


  simple(ast, {
      MemberExpression(node) {
        //@ts-ignore
        if (node.object.type === 'Identifier' && !path.includes(node.object.name)) {
          //@ts-ignore
          path.push(node.object.name);
      }
        //@ts-ignore
          if (node.computed) {
              // Handle bracket notation
              // This is simplistic and assumes a simple literal inside brackets
              //@ts-ignore
              path.push(node.property.value);
          } else {
              // Handle dot notation
              //@ts-ignore
              path.push(node.property.name);
          }
      }
  });
} catch  (e){
  console.log(e)
}
  if (path.length < 3) return null;
  return {
    node: path[0],
    prop: path[2],
  }
}

const saveFrameRoot = async (superstate: Superstate, tableData: SpaceTable, space: SpaceInfo, frameRoot: FrameRoot) => {

  if (!tableData) return;
  
const treeNodes = flattenToFrameNodes(frameRoot, tableData.schema.id);

  const newTable = {
    ...tableData,
    cols: tableData.cols ?? [],
    rows: [
      ...treeNodes,
    ].map((f) => nodeToFrame(relinkProps('$root', tableData.schema.id, f, tableData.schema.id))) as MFrame[],
  };

  await superstate.spaceManager.saveFrame(space.path, newTable)
};

export const replaceFrameWithFrameRoot = async (superstate: Superstate, space: SpaceInfo, schema: string, root: FrameRoot) => {
  
  return superstate.spaceManager
  .readFrame(space.path, schema).then((tagDB) =>
  saveFrameRoot(superstate, tagDB, space, root)
  );

};
export const mdbFrameToDBTables = (tables: MDBFrames, uniques?: { [x: string]: string[]; }): DBTables => {
  return Object.keys(tables).reduce((p, c) => {
    return {
      ...p,
      [c]: {
        uniques: defaultFrameSchema.uniques,
        cols: defaultFrameSchema.cols,
        rows: tables[c].rows
      },
    };
  }, {
    m_fields: {
      uniques: fieldSchema.uniques,
      cols: fieldSchema.cols,
      rows: Object.values(tables).flatMap(f => f.cols),
    }
  }) as DBTables;

};

