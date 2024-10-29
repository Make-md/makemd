import { Superstate, i18n } from "makemd-core";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { FilesystemSpaceInfo } from "types/mdb";
import { pathToString } from "utils/path";

export interface NoteViewProps {
  superstate: Superstate;
  source?: string;
  path: string;
  load: boolean;
  properties?: Record<string, any>;
  classname?: string;
  forceNote?: boolean;
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
    const pathState = props.superstate.pathsIndex.get(path.basePath);
    const notePath =
      pathState?.type == "space"
        ? props.superstate.spacesIndex.get(props.path)?.space.notePath
        : path.fullPath;
    const fileExists =
      props.forceNote ?? notePath
        ? await props.superstate.spaceManager.pathExists(notePath)
        : false;
    if (!notePath || !fileExists) {
      if (!force) {
        setExistsPas(true);
        setLoaded(false);
        return;
      } else {
        const parent =
          pathState?.type == "space"
            ? (
                props.superstate.spacesIndex.get(props.path)
                  ?.space as FilesystemSpaceInfo
              ).folderPath
            : props.superstate.spaceManager.parentPathForPath(path.basePath);
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
      props.superstate.ui.openPath(notePath, false, div, properties);
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

  useEffect(() => {
    const reloadFlow = () => {
      if (
        flowRef.current &&
        !flowRef.current.hasChildNodes() &&
        props.load &&
        !existsPas
      ) {
        loadPath();
      }
    };
    props.superstate.ui.eventsDispatch.addListener(
      "activeStateChanged",
      reloadFlow
    );

    return () => {
      flowRef.current = null;
      props.superstate.ui.eventsDispatch.removeListener(
        "activeStateChanged",
        reloadFlow
      );
    };
  }, []);

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
