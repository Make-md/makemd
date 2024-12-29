import MakeBasicsPlugin from "basics/basics";
import { i18n } from "makemd-core";
import React, { forwardRef, useEffect, useRef, useState } from "react";

const removeLeadingSlash = (path: string) =>
  path.charAt(0) == "/" ? path.substring(1) : path;

const pathToString = (path: string) => {
  if (path.lastIndexOf("/") != -1) {
    if (path.lastIndexOf(".") != -1)
      return removeLeadingSlash(
        path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf("."))
      );
    return path.substring(path.lastIndexOf("/") + 1);
  }
  if (path.lastIndexOf(".") != -1) {
    return path.substring(0, path.lastIndexOf("."));
  }

  return path;
};
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

    const path = props.plugin.enactor.uriByString(props.path, props.source);

    const pathExists = await props.plugin.enactor.pathExists(path.basePath);
    const isFolder = props.plugin.enactor.isSpace(path.basePath);
    const filePath =
      isFolder && props.forceNote
        ? props.plugin.enactor.spaceNotePath(props.path)
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
          ? props.plugin.enactor.spaceFolderPath(props.path)
          : props.plugin.enactor.parentPath(path.basePath);
        if (!parent) return;
        const newPath = await props.plugin.enactor.createNote(
          parent,
          pathToString(props.path)
        );
        setExistsPas(false);
        await props.plugin.enactor.openPath(newPath, div);
      }
    } else {
      setExistsPas(false);
      props.plugin.enactor.openPath(filePath, div);
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
    props.plugin.enactor.addActiveStateListener(reloadFlow);

    return () => {
      flowRef.current = null;
      props.plugin.enactor.removeActiveStateListener(reloadFlow);
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
