import { ActionTree } from "core/types/actions";
import { Metadata } from "core/types/metadata";
import { SpaceDefGroup } from "core/types/space";
import { Superstate } from "makemd-core";
import React, { useMemo } from "react";
import { Command } from "types/commands";
import { SpaceProperty } from "types/mdb";
import { windowFromDocument } from "utils/dom";
import { SpaceQuery } from "../SpaceQuery";
import { FormulaEditor } from "./FormulaEditor";
export const BuiltinPropertyEditor = (props: {
  command: Command;
  superstate: Superstate;
  actionTree: ActionTree;
  saveTree: (actionTree: ActionTree) => void;
  fields: SpaceProperty[];
  values: { [key: string]: any };
  path: string;
}) => {
  const allOptions: Metadata[] = useMemo(() => {
    const options = props.fields.map((f) => ({
      id: f.name,
      field: f.name,
      vType: f.type,
      label: f.name,
      defaultFilter: "is",
      type: "property",
      description: "",
    }));

    return options;
  }, []);
  const editFormula = (e: React.MouseEvent) => {
    const _props = {
      superstate: props.superstate,
      saveFormula: (value: string) =>
        props.saveTree({
          ...props.actionTree,
          props: {
            ...props.actionTree.props,
            $function: value,
          },
        }),
      formula: props.actionTree.props["$function"],
      value: props.values,
      fields: props.fields,
      path: props.path,
    };
    props.superstate.ui.openCustomMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      <FormulaEditor {..._props}></FormulaEditor>,
      { ..._props },
      windowFromDocument(e.view.document),
      "bottom"
    );
  };
  return props.command.schema.id == "formula" ? (
    <button onClick={(e) => editFormula(e)}>Edit Formula</button>
  ) : props.command.schema.id == "filter" ? (
    <SpaceQuery
      superstate={props.superstate}
      filters={props.actionTree.props["$function"] ?? []}
      setFilters={(filters: SpaceDefGroup[]) => {
        props.saveTree({
          ...props.actionTree,
          props: {
            ...props.actionTree.props,
            $function: filters,
          },
        });
      }}
      fields={allOptions}
      sections={[]}
      removeable={true}
    ></SpaceQuery>
  ) : (
    <></>
  );
};
