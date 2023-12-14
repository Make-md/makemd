import { getParentPathFromString } from "adapters/obsidian/utils/file";
import { Superstate } from "core/superstate/superstate";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { pathToString, removeTrailingSlashFromFolder } from "utils/path";

interface PathViewProps {
  superstate: Superstate;
  source?: string;
  path: string;
  load: boolean;
  properties?: Record<string, any>;
  classname?: string;
}

export const PathView = forwardRef((props: PathViewProps, ref) => {
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

    const pathExists = await props.superstate.spaceManager.pathExists(
      path.path
    );
    if (!pathExists) {
      if (!force) {
        setExistsPas(true);
        setLoaded(false);
        return;
      } else {
        const parent = removeTrailingSlashFromFolder(
          getParentPathFromString(path.path)
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
      props.superstate.ui.openPath(props.path, false, div, properties);
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
      if (flowRef?.current) flowRef.current.empty();
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
      ></div>

      {existsPas ? (
        <div
          onClick={() => loadPath(true)}
          className="mk-placeholder"
          style={{ color: "var(--text-faint)" }}
        >
          Create a Note
        </div>
      ) : (
        <></>
      )}
    </>
  );
});

PathView.displayName = "FlowView";
