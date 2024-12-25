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

    const pathState = props.superstate.pathsIndex.get(path.basePath);
    const pathExists = await props.superstate.spaceManager.pathExists(
      path.basePath
    );
    const filePath =
      pathState?.type == "space" && props.forceNote
        ? props.superstate.spacesIndex.get(props.path)?.space.notePath
        : pathState || pathExists
        ? path.fullPath
        : null;

    if (!filePath) {
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
        await props.superstate.ui.openPath(newPath, false, div);
      }
    } else {
      setExistsPas(false);
      props.superstate.ui.openPath(filePath, false, div);
    }

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
