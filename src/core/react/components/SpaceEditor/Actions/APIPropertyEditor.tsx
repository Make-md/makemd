import { ActionTree } from "core/types/actions";
import { Metadata } from "core/types/metadata";
import { SpaceDefGroup } from "core/types/space";
import { Superstate } from "makemd-core";
import React from "react";
import { Command } from "types/commands";
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
      setFilters={(filters: SpaceDefGroup[]) => {
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
