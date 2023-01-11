import { FlowView } from "components/FlowEditor/FlowView";
import MakeMDPlugin from "main";
import React, { useEffect, useState } from "react";

export const Backlinks = (props: { plugin: MakeMDPlugin; path: string }) => {
  const [backlinks, setBacklinks] = useState([]);
  useEffect(() => {
    if (!props.path) return;
    setBacklinks(
      Object.keys(app.metadataCache.resolvedLinks).filter(
        (f) => props.path in app.metadataCache.resolvedLinks[f]
      )
    );
  }, [props.path]);
  return (
    <div>
      {backlinks.map((f) => (
        <>
          <div className="mk-file-context-title">{f}</div>
          <FlowView plugin={props.plugin} load={true} path={f}></FlowView>
        </>
      ))}
    </div>
  );
};
