import "css/FlowComponent.css";
import React from "react";
import { tagContextFromTag } from "utils/contexts/contexts";
import { ContextListView } from "./ContextListView";
import { FilterBar } from "./FilterBar/FilterBar";
import { ContextViewComponentProps } from "./FolderContextViewComponent";
import { MDBProvider } from "./MDBContext";

export const TagContextViewComponent = (props: ContextViewComponentProps) => {
  const path = tagContextFromTag(props.plugin, props.tag);

  return (
    <div className="mk-folder-scroller">
      <div className="mk-folder-header">
        <div className="inline-title">{props.tag}</div>
      </div>
      <MDBProvider plugin={props.plugin} dbPath={path} tag={props.tag}>
        <FilterBar plugin={props.plugin}></FilterBar>
        <ContextListView plugin={props.plugin}></ContextListView>
      </MDBProvider>
    </div>
  );
};
