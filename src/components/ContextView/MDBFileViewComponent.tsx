import "css/FlowComponent.css";
import MakeMDPlugin from "main";
import React from "react";
import { mdbContextByDBPath } from "utils/contexts/contexts";
import { ContextListView } from "./ContextListView";
import { FilterBar } from "./FilterBar/FilterBar";
import { MDBProvider } from "./MDBContext";

export interface MDBFileViewComponentProps {
  dbPath: string;
  plugin: MakeMDPlugin;
}

export const MDBFileViewComponent = (props: MDBFileViewComponentProps) => {
  const context = mdbContextByDBPath(props.plugin, props.dbPath);
  return (
    <MDBProvider plugin={props.plugin} context={context}>
      {props.dbPath && (
        <div>
          <FilterBar plugin={props.plugin}></FilterBar>
          <ContextListView plugin={props.plugin}></ContextListView>
        </div>
      )}
    </MDBProvider>
  );
};
