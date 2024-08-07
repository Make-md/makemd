import { Superstate, i18n } from "makemd-core";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { pathToString } from "utils/path";

export interface NoteViewProps {
  superstate: Superstate;
  source?: string;
  path: string;
  load: boolean;
  properties?: Record<string, any>;
  classname?: string;
}

export const NoteView = forwardRef((props: NoteViewProps, ref) => {
  const flowRef = useRef<HTMLDivElement>(null);
  const [existsPas, setExistsPas] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadPath = async (force?: boolean) => {
    const div = flowRef.current;

    const path = props.superstate.spaceManager.uriByString(
      props.path,
      props.source
    );

    const properties: Record<string, any> = props.properties;
    const pathState = props.superstate.pathsIndex.get(path.fullPath);
    const filePath =
      pathState?.type == "space"
        ? props.superstate.spacesIndex.get(props.path)?.space.notePath
        : pathState?.path;

    if (!filePath) {
      if (!force) {
        setExistsPas(true);
        setLoaded(false);
        return;
      } else {
        const parent = props.superstate.spaceManager.parentPathForPath(
          path.basePath
        );
        if (!parent) return;
        const newPath = await props.superstate.spaceManager.createItemAtPath(
          parent,
          "md",
          pathToString(props.path)
        );
        setExistsPas(false);
        await props.superstate.ui.openPath(newPath, false, div, properties);
      }
    } else {
      setExistsPas(false);
      props.superstate.ui.openPath(filePath, false, div, properties);
    }
    // if (path.refStr?.length > 0) {
    //   const pathPropertiesFromRef ;
    //   const [from, to] = getLineRangeFromRef(
    //     path.path,
    //     path.refStr,
    //     props.superstate.spaceManager
    //   );
    //   properties.from = from;
    //   properties.to = to;
    // }
    setLoaded(true);
  };

  const toggleFlow = () => {
    if (props.load) {
      loadPath();
    } else {
      if (flowRef?.current) flowRef.current.innerHTML = "";
    }
  };

  useEffect(() => {
    toggleFlow();
  }, [props.load, props.path]);
  // useEffect(() => {
  //   toggleFlow();
  // }, []);
  return (
    <>
      <div
        className={`${props.classname ?? ""} mk-flowspace-editor`}
        ref={flowRef}
        onClick={(e) => e.stopPropagation()}
      ></div>

      {existsPas ? (
        <div
          onClick={() => loadPath(true)}
          className="mk-placeholder"
          style={{ color: "var(--mk-ui-text-tertiary)" }}
        >
          {i18n.labels.notePlaceholder.replace(
            "${1}",
            pathToString(props.path)
          )}
        </div>
      ) : (
        <></>
      )}
    </>
  );
});
NoteView.displayName = "FlowView";
