import "css/FlowComponent.css";
import MakeMDPlugin from "main";
import React from "react";
import {
  folderContextFromFolder,
  tagContextFromTag
} from "utils/contexts/contexts";
import { viewTypeByString } from "utils/file";
import { ContextListView } from "./ContextListView";
import { MDBProvider } from "./MDBContext";

export interface InlineContextViewComponentProps {
  path: string;
  plugin: MakeMDPlugin;
  schema?: string;
}

export const InlineContextViewComponent = (
  props: InlineContextViewComponentProps
) => {
  const type = viewTypeByString(props.path);
  const path =
    type == "tag"
      ? tagContextFromTag(props.plugin, props.path)
      : folderContextFromFolder(props.plugin, props.path);
  const folder = type == "tag" ? null : props.path;
  const tag = type == "tag" ? props.path : null;
  return (
    <MDBProvider
      plugin={props.plugin}
      dbPath={path}
      folder={folder}
      tag={tag}
      schema={props.schema}
    >
      {path && <ContextListView plugin={props.plugin}></ContextListView>}
    </MDBProvider>
  );
};
