import MakeMDPlugin from "main";
import React, { useContext } from "react";
import { CardsView } from "./CardsView/CardsView";
import { FlowListView } from "./FlowListView/FlowListView";
import { MDBContext } from "./MDBContext";
import { TableView } from "./TableView/TableView";
import { useErrorBoundary } from 'preact/hooks'
export const ContextListView = (props: { plugin: MakeMDPlugin }) => {
  const { schema } = useContext(MDBContext);
  const [error, resetError] = useErrorBoundary();
  if (error)
  console.log(error)
  return schema ? (
    schema.type == "flow" ? (
      <FlowListView plugin={props.plugin}></FlowListView>
    ) : schema.type == "table" ? (
      <TableView plugin={props.plugin}></TableView>
    ) : (
      <CardsView plugin={props.plugin}></CardsView>
    )
  ) : (
    <></>
  );
};
