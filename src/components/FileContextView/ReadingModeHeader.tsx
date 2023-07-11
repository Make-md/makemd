import MakeMDPlugin from "main";
import React, { useEffect, useRef, useState } from "react";
import { ActivePathEvent, eventTypes } from "types/types";
import { getAbstractFileAtPath } from "utils/file";
import { InlineFileContextView } from "./InlineFileContextView";

export const ReadingModeHeader = (props: {
  plugin: MakeMDPlugin;
  filePath: string;
}) => {
  const [path, setPath] = useState(props.filePath);
  const ref = useRef(null);
  useEffect(() => {
    setPath(props.filePath);
  }, [props.filePath]);
  const changeActiveFile = (evt: CustomEvent<ActivePathEvent>) => {
    if (ref.current.closest(".mod-active") && evt.detail.path.type == "file")
      setPath(evt.detail.path.path);
  };
  useEffect(() => {
    window.addEventListener(eventTypes.activePathChange, changeActiveFile);
    return () => {
      window.removeEventListener(eventTypes.activePathChange, changeActiveFile);
    };
  }, [path]);
  return (
    <div ref={ref}>
      <InlineFileContextView
        plugin={props.plugin}
        file={getAbstractFileAtPath(app, path)}
        showHeader={true}
        showBanner={true}
        editable={false}
      ></InlineFileContextView>
    </div>
  );
};
