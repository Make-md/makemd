import "css/FlowComponent.css";
import MakeMDPlugin from "main";
import React from "react";
import { mdbContextByPath } from "utils/contexts/contexts";
import { ContextListView } from "./ContextListView";
import { MDBProvider } from "./MDBContext";

export interface EmbedContextViewComponentProps {
  path: string;
  plugin: MakeMDPlugin;
  schema?: string;
}

export const EmbedContextViewComponent = (
  props: EmbedContextViewComponentProps
) => {
  const context = mdbContextByPath(props.plugin, props.path);
  return (
    <>
      {context && (
        <MDBProvider
          plugin={props.plugin}
          context={context}
          schema={props.schema}
        >
          <div>
            <ContextListView plugin={props.plugin}></ContextListView>
          </div>
        </MDBProvider>
      )}
    </>
  );
};
