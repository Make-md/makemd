import { Superstate } from "makemd-core";
import React from "react";
import { ActionTree } from "shared/types/actions";
import { Command } from "shared/types/commands";
import { Metadata } from "shared/types/metadata";
import { FilterGroupDef } from "shared/types/spaceDef";
import { SpaceQuery } from "../SpaceQuery";
export const APIPropertyEditor = (props: {
  command: Command;
  superstate: Superstate;
  actionTree: ActionTree;
  saveTree: (actionTree: ActionTree) => void;
  fields: Metadata[];
}) => {
  return props.command.schema.id == "filter" ? (
    <SpaceQuery
      superstate={props.superstate}
      filters={props.actionTree.props["$function"] ?? []}
      setFilters={(filters: FilterGroupDef[]) => {
        props.saveTree({
          ...props.actionTree,
          props: {
            ...props.actionTree.props,
            $function: filters,
          },
        });
      }}
      fields={props.fields}
      sections={[]}
      removeable={true}
    ></SpaceQuery>
  ) : (
    <></>
  );
};
