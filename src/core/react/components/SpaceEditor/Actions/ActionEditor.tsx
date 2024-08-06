import { Superstate } from "makemd-core";
import React from "react";
import { SpaceProperty } from "types/mdb";
import { ActionTree } from "../../../../types/actions";
import { parseActionString } from "../../../../utils/commands/actions";
import { ActionNode } from "./ActionNode";
export const ActionEditor = (props: {
  superstate: Superstate;
  formula: string;
  path: string;
  saveFormula: (formula: string) => void;
  fields: SpaceProperty[];
  saveOutputType: (outputType: string) => void;
  value: { [key: string]: string };
}) => {
  const [actionTree, setActionTree] = React.useState<ActionTree>(
    parseActionString(props.formula) ?? {
      action: "",
      props: {},
      propsValue: {},
      children: [],
    }
  );
  return (
    <div className="mk-editor-actions-nodes">
      <ActionNode
        hasSiblings={false}
        superstate={props.superstate}
        prevField={null}
        actionTree={actionTree}
        path={props.path}
        fields={props.fields}
        values={props.value}
        saveTree={(tree) => {
          console.log("saving tree", tree);
          props.saveFormula(JSON.stringify(tree));
          setActionTree(tree);
        }}
      ></ActionNode>
    </div>
  );
};
