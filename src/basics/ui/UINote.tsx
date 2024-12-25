import MakeBasicsPlugin from "basics/basics";
import { i18n } from "makemd-core";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { FilesystemSpaceInfo } from "types/mdb";
import { pathToString } from "utils/path";

export interface NoteViewProps {
  plugin: MakeBasicsPlugin;
  source?: string;
  path: string;
  load: boolean;
  properties?: Record<string, any>;
  classname?: string;
  forceNote?: boolean;
}

export const UINote = forwardRef((props: NoteViewProps, ref) => {
  const flowRef = useRef<HTMLDivElement>(null);
  const [existsPas, setExistsPas] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadPath = async (force?: boolean) => {
    const div = flowRef.current;

    const path = props.plugin.uriByString(props.path, props.source);

    const pathExists = await props.plugin.app.vault.adapter.exists(
      path.basePath
    );
    const isFolder = props.plugin.isSpace(path.basePath);
    const filePath =
      isFolder && props.forceNote
        ? props.plugin.spaceNotePath(props.path)
        : pathExists
        ? path.fullPath
        : null;

    if (!filePath) {
      if (!force) {
        setExistsPas(true);
        setLoaded(false);
        return;
      } else {
        const parent = isFolder
          ? (
              props.plugin.superstate.spacesIndex.get(props.path)
                ?.space as FilesystemSpaceInfo
            ).folderPath
          : props.plugin.superstate.spaceManager.parentPathForPath(
              path.basePath
            );
        if (!parent) return;
        const newPath = await props.plugin.createNote(
          parent,
          pathToString(props.path)
        );
        setExistsPas(false);
        await props.plugin.openPath(newPath, div);
      }
    } else {
      setExistsPas(false);
      props.plugin.openPath(filePath, div);
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
    props.plugin.superstate.ui.eventsDispatch.addListener(
      "activeStateChanged",
      reloadFlow
    );

    return () => {
      flowRef.current = null;
      props.plugin.superstate.ui.eventsDispatch.removeListener(
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
UINote.displayName = "UINote";
