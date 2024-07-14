import { defaultString } from "core/utils/strings";
import { Superstate } from "makemd-core";
import React from "react";
import { stickerForSchema } from "schemas/mdb";

import { FrameSchema } from "types/mframe";

export const ContextViewCrumb = (
  props: React.PropsWithChildren<{
    superstate: Superstate;
    schema: FrameSchema;
    active: boolean;
    onSelect: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent, schema: FrameSchema) => void;
  }>
) => {
  return (
    <div
      onClick={(e) => props.onSelect(e)}
      onContextMenu={(e) => props.onContextMenu(e, props.schema)}
      className={`mk-context ${props.active ? "mk-active" : ""}`}
    >
      
      {defaultString(props.schema.name, "Untitled")}
      {props.children}
    </div>
  );
};
