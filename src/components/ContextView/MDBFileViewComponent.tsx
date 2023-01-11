import "css/FlowComponent.css";
import MakeMDPlugin from "main";
import React from "react";
import {
  getFolderFromPath
} from "utils/file";
import { filePathToString } from "utils/tree";
import { ContextListView } from "./ContextListView";
import { FilterBar } from "./FilterBar/FilterBar";
import { MDBProvider } from "./MDBContext";

export interface MDBFileViewComponentProps {
  dbPath: string;
  plugin: MakeMDPlugin;
}

const mdbTypeByDBPath = (plugin: MakeMDPlugin, dbpath: string) => {
  return dbpath.endsWith(plugin.settings.folderContextFile + ".mdb")
    ? "folder"
    : "tag";
};

export const MDBFileViewComponent = (props: MDBFileViewComponentProps) => {
  const type = mdbTypeByDBPath(props.plugin, props.dbPath);
  const folder =
    type == "tag" ? null : getFolderFromPath(app, props.dbPath).path;
  const tag =
    type == "tag" ? filePathToString(props.dbPath).replace(".mdb", "") : null;
  return (
    <MDBProvider
      plugin={props.plugin}
      dbPath={props.dbPath}
      folder={folder}
      tag={tag}
    >
      {props.dbPath && (
        <div>
          <FilterBar plugin={props.plugin}></FilterBar>
          <ContextListView plugin={props.plugin}></ContextListView>
        </div>
      )}
    </MDBProvider>
  );
};
