import type { Superstate } from "makemd-core";
import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { PathState } from "shared/types/PathState";
import { windowFromDocument } from "shared/utils/dom";
import { PathStickerView } from "../../../../../shared/components/PathSticker";
import { showPathContextMenu } from "../Menus/navigator/pathContextMenu";
import { useSpaceManager } from "core/react/context/SpaceManagerContext";
import { resolvePath } from "core/superstate/utils/path";

export const PathCrumb = (
  props: PropsWithChildren<{
    superstate: Superstate;
    path: string;
    source?: string;
    hideName?: boolean;
    hideIcon?: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }>
) => {
  const spaceManager = useSpaceManager();

  const path = useMemo(
    () =>
      props.source && props.path
        ? spaceManager.resolvePath(props.path, props.source)
        : props.path,
    [props.source, props.path, spaceManager]
  );
  
  const [cache, setCache] = useState<PathState | null>(null);
  
  const reloadCache = () => {
    try {
      const pathState = spaceManager.getPathState(path);
      setCache(pathState);
    } catch (error) {
      console.error('Failed to get path state for PathCrumb:', error);
      setCache(null);
    }
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
  }, [path, spaceManager]);

  return (
    <div
      className="mk-path"
      onClick={(e) => {
        if (props.onClick) {
          props.onClick(e);
          return;
        }
        // In preview mode, don't navigate to prevent breaking the preview
        if (spaceManager.isPreviewMode) {
          return;
        }
        props.superstate.ui.openPath(cache?.path ?? path, false);
      }}
      onContextMenu={(e) => {
        // Disable context menu in preview mode
        if (spaceManager.isPreviewMode) {
          return;
        }
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
      {cache && !props.hideIcon && (
        <PathStickerView superstate={props.superstate} pathState={cache} />
      )}
      <span>{(!props.hideName && cache?.label.name) ?? path}</span>
      {props.children}
    </div>
  );
};
