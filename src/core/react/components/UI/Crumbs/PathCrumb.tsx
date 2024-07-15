import { PathState } from "core/types/superstate";
import { Superstate } from "makemd-core";
import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { windowFromDocument } from "utils/dom";
import { showPathContextMenu } from "../Menus/navigator/pathContextMenu";
import { PathStickerView } from "../Stickers/PathSticker/PathSticker";

export const PathCrumb = (
  props: PropsWithChildren<{
    superstate: Superstate;
    path: string;
    source?: string;
    hideName?: boolean;
  }>
) => {
  const path = useMemo(
    () =>
      props.source && props.path
        ? props.superstate.spaceManager.resolvePath(props.path, props.source)
        : props.path,
    [props.source, props.path]
  );

  const [cache, setCache] = useState<PathState>(
    props.superstate.pathsIndex.get(path)
  );
  const reloadCache = () => {
    setCache(props.superstate.pathsIndex.get(path));
  };
  const reloadIcon = (payload: { path: string }) => {
    if (payload.path == path) {
      reloadCache();
    }
  };
  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      reloadIcon
    );
    reloadCache();
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        reloadIcon
      );
    };
  }, [path]);

  return (
    <div
      className="mk-path"
      aria-label={path}
      onClick={() => {
        props.superstate.ui.openPath(cache?.path ?? path, false);
      }}
      onContextMenu={(e) => {
        if (cache) {
          e.stopPropagation();
          showPathContextMenu(
            props.superstate,
            cache.path,
            props.source,
            {
              x: e.clientX,
              y: e.clientY,
              width: 0,
              height: 0,
            },
            windowFromDocument(e.view.document)
          );
        }
      }}
    >
      {cache && (
        <PathStickerView superstate={props.superstate} pathState={cache} />
      )}
      <span>{(!props.hideName && cache?.label.name) ?? path}</span>
      {props.children}
    </div>
  );
};
