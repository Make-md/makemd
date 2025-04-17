import { saveSpaceCache } from "core/superstate/utils/spaces";
import { isString } from "lodash";
import { Superstate } from "makemd-core";
import React, { useEffect, useMemo, useState } from "react";
import { SpaceState } from "shared/types/PathState";
import { SpaceDefinition } from "shared/types/spaceDef";
import { windowFromDocument } from "shared/utils/dom";
import { PathCrumb } from "../UI/Crumbs/PathCrumb";
import { showLinkMenu } from "../UI/Menus/properties/linkMenu";

export const SpaceItemProperty = (props: {
  superstate: Superstate;
  space: SpaceState;
  compactMode: boolean;
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [metadata, setMetadata] = useState<SpaceDefinition>(
    props.space.metadata ?? {}
  );

  const saveMetadata = (metadata: SpaceDefinition) => {
    setMetadata(metadata);
    saveSpaceCache(props.superstate, props.space.space, metadata);
  };

  const linkCaches = useMemo(
    () =>
      (metadata?.links ?? [])
        .map((f) => props.superstate.pathsIndex.get(f))
        .filter((f) => f),
    [metadata]
  );

  useEffect(() => {
    const updateSpace = (payload: { path: string }) => {
      if (payload.path == props.space.path) {
        const newMetadata = props.superstate.spacesIndex.get(
          props.space.path
        )?.metadata;
        if (newMetadata) setMetadata(newMetadata);
      }
    };
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      updateSpace
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        updateSpace
      );
    };
  }, [props.space]);
  const addLink = (e: React.MouseEvent) => {
    e.preventDefault();
    showLinkMenu(
      (e.target as HTMLButtonElement).getBoundingClientRect(),
      windowFromDocument(e.view.document),
      props.superstate,
      (path) => {
        if (isString(path)) {
          const newLinks = [...metadata.links, path];
          saveMetadata({
            ...metadata,
            links: newLinks,
          });
        }
      }
    );
  };
  const unpin = (path: string) => {
    const newLinks = metadata.links.filter((f) => f != path);
    saveMetadata({
      ...metadata,
      links: newLinks,
    });
  };
  return (
    <div className="mk-space-editor-links">
      <div className="mk-space-editor-links-header">
        <div
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//pin"),
          }}
        ></div>
        <span>Pinned Items</span>
      </div>
      <div className="mk-props-list">
        {linkCaches.map((f, i) => (
          <PathCrumb
            key={i}
            superstate={props.superstate}
            path={f.path}
            source={props.space.path}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                unpin(f.path);
              }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//pin-off"),
                }}
              ></div>
            </button>
          </PathCrumb>
        ))}
        <button
          className="mk-toolbar-button"
          onClick={(e) => {
            addLink(e);
          }}
        >
          <div
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
          ></div>
          Add Item
        </button>
      </div>
    </div>
  );
};
