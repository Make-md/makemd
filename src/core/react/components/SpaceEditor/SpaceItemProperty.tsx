import { saveSpaceCache } from "core/superstate/utils/spaces";
import { i18n, SelectOption, SelectOptionType, Superstate } from "makemd-core";
import React, { useEffect, useMemo, useState } from "react";
import { SpaceState } from "shared/types/PathState";
import { SpaceDefinition } from "shared/types/spaceDef";
import { windowFromDocument } from "shared/utils/dom";
import { PathCrumb } from "../UI/Crumbs/PathCrumb";
import { defaultMenu } from "../UI/Menus/menu/SelectionMenu";
import { CollapseToggleSmall } from "../UI/Toggles/CollapseToggleSmall";

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
  const directChildren = useMemo(() => {
    return [...props.superstate.spacesMap.getInverse(props.space.path)]
      .map((f) => props.superstate.pathsIndex.get(f))
      .filter((f) => f.parent == props.space.path);
  }, [props.space]);
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
  return props.compactMode ? (
    <div className="mk-props-pill" onClick={() => setCollapsed((f) => !f)}>
      <div
        className="mk-path-context-field-icon"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//file-stack"),
        }}
      ></div>
      {linkCaches.length + directChildren.length} Items
    </div>
  ) : (
    <div className="mk-path-context-row">
      <div className="mk-path-context-field">
        <div
          className="mk-path-context-field-icon"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//file-stack"),
          }}
        ></div>
        <div
          className="mk-path-context-field-key"
          aria-label={i18n.descriptions.spaceItems}
        >
          Items
        </div>
      </div>
      <div className="mk-path-context-value">
        <div className="mk-props-value">
          <div className="mk-props-list">
            <div
              className="mk-props-pill"
              onClick={() => setCollapsed((f) => !f)}
            >
              {linkCaches.length + directChildren.length} Items
              <CollapseToggleSmall
                superstate={props.superstate}
                collapsed={collapsed}
              ></CollapseToggleSmall>
            </div>
            <button
              className="mk-toolbar-button"
              aria-label={i18n.buttons.addSmartSearch}
              onClick={(e) => {
                const menuOptions: SelectOption[] = [];
                menuOptions.push({
                  name: i18n.buttons.addSmartSearch,
                  icon: "ui//live",
                  onClick: () => {
                    saveMetadata({
                      ...metadata,
                      filters: [
                        ...(metadata.filters ?? []),
                        {
                          type: "any",
                          trueFalse: true,
                          filters: [],
                        },
                      ],
                    });
                  },
                });
                menuOptions.push({
                  name: i18n.buttons.subFolders,
                  icon: "ui//folder",
                  type: SelectOptionType.Submenu,
                  onSubmenu: (rect, onHide) => {
                    const menuOptions: SelectOption[] = [];
                    menuOptions.push({
                      name: "Include all items in subfolders",
                      onClick: () => {
                        saveMetadata({
                          ...metadata,
                          recursive: "file",
                        });
                      },
                    });
                    menuOptions.push({
                      name: "Include all folders and items in subfolders",
                      onClick: () => {
                        saveMetadata({
                          ...metadata,
                          recursive: "all",
                        });
                      },
                    });
                    menuOptions.push({
                      name: "Don't include items in subfolder",
                      onClick: () => {
                        saveMetadata({
                          ...metadata,
                          recursive: "",
                        });
                      },
                    });
                    return props.superstate.ui.openMenu(
                      rect,
                      defaultMenu(props.superstate.ui, menuOptions),
                      windowFromDocument(e.view.document),
                      null,
                      onHide
                    );
                  },
                });
                const rect = e.currentTarget.getBoundingClientRect();
                props.superstate.ui.openMenu(
                  rect,
                  defaultMenu(props.superstate.ui, menuOptions),
                  windowFromDocument(e.view.document)
                );
              }}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//plus"),
              }}
            ></button>
          </div>
          {!collapsed && (
            <div className="mk-props-list">
              {linkCaches.map((f, i) => (
                <PathCrumb
                  key={i}
                  superstate={props.superstate}
                  path={f.path}
                  source={props.space.path}
                ></PathCrumb>
              ))}
              {directChildren.map((f, i) => (
                <PathCrumb
                  key={i}
                  superstate={props.superstate}
                  path={f.path}
                  source={props.space.path}
                ></PathCrumb>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
