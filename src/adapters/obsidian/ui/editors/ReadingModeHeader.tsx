import { PathProvider } from "core/react/context/PathContext";
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
  // const changeActiveFile = (path: string) => {
  //   if (ref.current.closest(".mod-active")) setPath(path);
  // };
  // useEffect(() => {
  //   props.superstate.ui.eventsDispatch.addListener(
  //     "activePathChanged",
  //     changeActiveFile
  //   );
  //   return () => {
  //     props.superstate.ui.eventsDispatch.removeListener(
  //       "activePathChanged",
  //       changeActiveFile
  //     );
  //   };
  // }, []);
  return (
    <div ref={ref}>
      <PathProvider superstate={props.superstate} path={path} readMode={true}>
        <MarkdownHeaderView
          superstate={props.superstate}
          editable={false}
        ></MarkdownHeaderView>
      </PathProvider>
    </div>
  );
};
