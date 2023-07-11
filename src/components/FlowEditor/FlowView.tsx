import MakeMDPlugin from "main";
import React, { useEffect, useRef } from "react";
import { spawnLeafFromFile } from "utils/flow/flowEditor";
import { pathByString } from "utils/path";

interface FlowViewProps {
  plugin: MakeMDPlugin;
  path: string;
  load: boolean;
  from?: number;
  to?: number;
}

export const FlowView = (props: FlowViewProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const loadFile = async () => {
    const div = ref.current;

    const { path: link, ref: refStr, type } = pathByString(props.path);

    const portalType = type == "tag" || type == "folder" ? "context" : "doc";
    await spawnLeafFromFile(
      props.plugin,
      link,
      div,
      portalType,
      refStr,
      props.from,
      props.to
    );
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
  }, [props.load, props.path, props.from, props.to]);

  return <div className="mk-flowspace-editor" ref={ref}></div>;
};
