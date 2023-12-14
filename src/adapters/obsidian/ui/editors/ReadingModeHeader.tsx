import { MarkdownHeaderView, Superstate } from "makemd-core";
import React, { useEffect, useRef, useState } from "react";

export const ReadingModeHeader = (props: {
  superstate: Superstate;
  filePath: string;
}) => {
  const [path, setPath] = useState(props.filePath);
  const ref = useRef(null);
  useEffect(() => {
    setPath(props.filePath);
  }, [props.filePath]);
  const changeActiveFile = (path: string) => {
    if (ref.current.closest(".mod-active")) setPath(path);
  };
  useEffect(() => {
    props.superstate.ui.eventsDispatch.addListener(
      "activePathChanged",
      changeActiveFile
    );
    return () => {
      props.superstate.ui.eventsDispatch.removeListener(
        "activePathChanged",
        changeActiveFile
      );
    };
  }, []);
  return (
    <div ref={ref}>
      <MarkdownHeaderView
        superstate={props.superstate}
        path={path}
        showHeader={true}
        showBanner={true}
        showFolder={true}
        editable={false}
      ></MarkdownHeaderView>
    </div>
  );
};
