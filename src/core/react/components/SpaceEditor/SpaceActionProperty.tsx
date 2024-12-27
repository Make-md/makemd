import { InputModal } from "core/react/components/UI/Modals/InputModal";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { actionPathForSpace } from "core/utils/contexts/embed";
import { Superstate, i18n } from "makemd-core";
import React, { useContext, useEffect, useState } from "react";
import { stickerForSchema } from "schemas/mdb";
import { Command } from "shared/types/commands";
import { windowFromDocument } from "shared/utils/dom";
import { defaultMenu } from "../UI/Menus/menu/SelectionMenu";
import { CollapseToggleSmall } from "../UI/Toggles/CollapseToggleSmall";
export const SpaceActionProperty = (props: {
  superstate: Superstate;
  compactMode: boolean;
}) => {
  const { pathState } = useContext(PathContext);
  const { spaceState } = useContext(SpaceContext);
  const [collapsed, setCollapsed] = useState(true);
  const [actions, setActions] = React.useState<Command[]>([]);
  useEffect(() => {
    refreshData({ path: pathState.path });
  }, []);
  const refreshData = (payload: { path: string }) => {
    if (payload.path == pathState?.path)
      props.superstate.spaceManager
        .commandsForSpace(pathState.path)
        .then((f) => setActions(f));
  };

  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "actionStateUpdated",
      refreshData
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "actionStateUpdated",
        refreshData
      );
    };
  }, [pathState]);

  const newAction = (e: React.MouseEvent) => {
    props.superstate.ui.openModal(
      i18n.labels.newAction,
      <InputModal
        value=""
        saveLabel={i18n.buttons.save}
        saveValue={(value) => {
          props.superstate.spaceManager.createCommand(spaceState.path, {
            id: value,
            name: value,
            type: "actions",
          });
        }}
      ></InputModal>,
      windowFromDocument(e.view.document)
    );
  };
  const onContextMenu = (e: React.MouseEvent, action: Command) => {
    e.preventDefault();
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const actions = [];
    actions.push({
      name: "Run Action",
      icon: "lucide//play",
      onClick: () =>
        props.superstate.cli.runCommand(
          actionPathForSpace(spaceState, action.schema.id),
          { iterations: 0, instanceProps: {}, props: {} }
        ),
    });
    actions.push({
      name: "Delete Action",
      icon: "ui//trash",
      onClick: () =>
        props.superstate.spaceManager.deleteCommand(
          spaceState.path,
          action.schema.id
        ),
    });
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, actions),
      windowFromDocument(e.view.document)
    );
  };
  return actions.length > 0 ? (
    props.compactMode ? (
      <div className="mk-props-pill" onClick={() => setCollapsed((f) => !f)}>
        {actions.length} Actions
      </div>
    ) : (
      <div className="mk-path-context-row">
        <div className="mk-path-context-field">
          <div
            className="mk-path-context-field-icon"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mouse-pointer-click"),
            }}
          ></div>
          <div className="mk-path-context-field-key">Actions</div>
        </div>
        <div className="mk-path-context-value">
          <div
            className="mk-props-pill"
            onClick={() => setCollapsed((f) => !f)}
          >
            {actions.length} Actions
            <CollapseToggleSmall
              superstate={props.superstate}
              collapsed={collapsed}
            ></CollapseToggleSmall>
          </div>
          {!collapsed && (
            <div className="mk-props-list">
              {actions.map((f, i) => (
                <div
                  key={i}
                  className="mk-path"
                  onContextMenu={(e) => onContextMenu(e, f)}
                >
                  <div
                    className="mk-path-icon"
                    dangerouslySetInnerHTML={{
                      __html: props.superstate.ui.getSticker(
                        stickerForSchema(f.schema)
                      ),
                    }}
                  ></div>
                  <div
                    onClick={(e) => {
                      props.superstate.ui.openPath(
                        actionPathForSpace(spaceState, f.schema.id),
                        e.metaKey
                      );
                    }}
                  >
                    {f.schema.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  ) : (
    <></>
  );
};
