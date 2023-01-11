import MakeMDPlugin from "main";
import React, { useEffect, useRef } from "react";
import { viewTypeByString } from "utils/file";
import { spawnLeafFromFile } from "utils/flow/flowEditor";

interface FlowViewProps {
  plugin: MakeMDPlugin;
  path: string;
  load: boolean;
}

export const FlowView = (props: FlowViewProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const loadFile = () => {
    const div = ref.current;
    const type = viewTypeByString(props.path);
    const portalType = type == "tag" || type == "folder" ? "context" : "doc";
    spawnLeafFromFile(props.plugin, props.path, div, portalType);
  };

  const toggleFlow = () => {
    if (props.load) {
      loadFile();
    } else {
      ref.current.empty();
    }
  };
  useEffect(() => {
    toggleFlow();
  }, [props.load, props.path]);

  return <div className="mk-flowspace-editor" ref={ref}></div>;
};
