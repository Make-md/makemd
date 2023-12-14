import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { ContextMDBContext } from "core/react/context/ContextMDBContext";
import { Superstate } from "core/superstate/superstate";
import { useErrorBoundary } from "preact/hooks";
import React, { useContext } from "react";
import { CardsView } from "./CardsView/CardsView";
import { ContextFrameView } from "./ContextBuilder/ContextFrameView";
import { FilterBar } from "./FilterBar/FilterBar";
import { FlowListView } from "./FlowListView/FlowListView";
import { TableView } from "./TableView/TableView";
export const ContextListView = (props: {
  superstate: Superstate;
  minMode?: boolean;
}) => {
  const { predicate, editMode } = useContext(ContextEditorContext);
  const { dbSchema } = useContext(ContextMDBContext);
  const [error, resetError] = useErrorBoundary();

  if (error) console.log(error);
  return (
    <>
      {!props.minMode && <FilterBar superstate={props.superstate}></FilterBar>}
      {editMode == 1 ? (
        <ContextFrameView superstate={props.superstate}></ContextFrameView>
      ) : predicate ? (
        predicate.view == "flow" ? (
          <FlowListView superstate={props.superstate}></FlowListView>
        ) : predicate.view == "table" || predicate.view == "db" ? (
          <TableView superstate={props.superstate}></TableView>
        ) : (
          <CardsView superstate={props.superstate}></CardsView>
        )
      ) : (
        <></>
      )}{" "}
    </>
  );
};
