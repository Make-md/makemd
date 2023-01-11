import React, {
  useContext, useMemo
} from "react";

import MakeMDPlugin from "main";

import { FlowView } from "components/FlowEditor/FlowView";
import "css/Table.css";
import { TFile } from "obsidian";
import { getAbstractFileAtPath } from "utils/file";
import { fileNameToString } from "utils/tree";
import { MDBContext } from "../MDBContext";

export const FlowListView = (props: { plugin: MakeMDPlugin }) => {
  const {
    filteredData: data,
  } = useContext(MDBContext);

  const flowItems = useMemo(() => {
    return data
      .map((f) => getAbstractFileAtPath(app, f.File))
      .filter((f) => f instanceof TFile && f.extension == "md");
  }, [data]);

  return (
    <div className="mk-flow-container">
      {flowItems.map((f) => (
        <div>
          <span>{fileNameToString(f.name)}</span>
          <FlowView plugin={props.plugin} path={f.path} load={true}></FlowView>
        </div>
      ))}
    </div>
  );
};
