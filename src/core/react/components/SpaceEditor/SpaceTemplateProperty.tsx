import {
  FormulaEditor,
  FormulaEditorProps,
} from "core/react/components/SpaceEditor/Actions/FormulaEditor";
import { showLinkMenu } from "core/react/components/UI/Menus/properties/linkMenu";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import {
  saveSpaceTemplate,
  setTemplateInSpace,
  setTemplateNameInSpace,
} from "core/superstate/utils/spaces";
import { Superstate, i18n } from "makemd-core";
import React, { useContext, useEffect, useState } from "react";
import { windowFromDocument } from "utils/dom";
import { defaultMenu } from "../UI/Menus/menu/SelectionMenu";
import { CollapseToggleSmall } from "../UI/Toggles/CollapseToggleSmall";
export const SpaceTemplateProperty = (props: {
  superstate: Superstate;
  compactMode: boolean;
}) => {
  const { pathState } = useContext(PathContext);
  const { spaceState } = useContext(SpaceContext);
  const [collapsed, setCollapsed] = useState(true);
  const [templates, setTemplates] = React.useState<string[]>([]);
  useEffect(() => {
    refreshData({ path: pathState.path });
  }, []);
  const refreshData = (payload: { path: string }) => {
    if (payload.path == pathState?.path)
      setTemplates(
        props.superstate.spacesIndex.get(spaceState.path)?.templates
      );
  };
  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      refreshData
    );

    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        refreshData
      );
    };
  }, [pathState]);
  const newAction = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    showLinkMenu(
      offset,
      windowFromDocument(e.view.document),
      props.superstate,
      (space) => {
        saveSpaceTemplate(props.superstate, pathState.path, space);
      }
    );
    e.stopPropagation();
  };
  const showMenu = (e: React.MouseEvent, f: string) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const menuOptions = [];
    menuOptions.push({
      name: "Set as Default",
      icon: "ui//clipboard-pen",
      onClick: () => setTemplateInSpace(props.superstate, pathState.path, f),
    });
    menuOptions.push({
      name: "Delete",
      icon: "ui//trash",
      onClick: () =>
        props.superstate.spaceManager.deleteTemplate(f, spaceState.path),
    });

    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document),
      "bottom"
    );
  };
  const editFormula = (e: React.MouseEvent) => {
    const _props: FormulaEditorProps = {
      superstate: props.superstate,
      saveFormula: (value: string) =>
        setTemplateNameInSpace(props.superstate, pathState.path, value),
      formula: spaceState.metadata.templateName,
      value: {},
      fields: [],
      description: "Automatically set a template name using a formula",
      path: pathState.path,
    };
    props.superstate.ui.openCustomMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      <FormulaEditor {..._props}></FormulaEditor>,
      { ..._props },
      windowFromDocument(e.view.document),
      "bottom"
    );
  };
  return templates?.length > 0 ? (
    props.compactMode ? (
      <div className="mk-props-pill" onClick={() => setCollapsed((f) => !f)}>
        {templates.length} Templates
      </div>
    ) : (
      <div className="mk-path-context-row">
        <div className="mk-path-context-field">
          <div
            className="mk-path-context-field-icon"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//clipboard-pen"),
            }}
          ></div>
          <div className="mk-path-context-field-key">Templates</div>
        </div>
        <div className="mk-path-context-value">
          <div
            className="mk-props-pill"
            onClick={() => setCollapsed((f) => !f)}
          >
            {templates.length} Templates
            <CollapseToggleSmall
              superstate={props.superstate}
              collapsed={collapsed}
            ></CollapseToggleSmall>
          </div>
          <button
            className="mk-toolbar-button"
            aria-label={i18n.labels.editFormula}
            onClick={(e) => editFormula(e)}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//formula"),
            }}
          ></button>
          {!collapsed && (
            <div className="mk-props-list">
              {templates.map((f, i) => (
                <div
                  key={i}
                  className="mk-path"
                  onContextMenu={(e) => showMenu(e, f)}
                >
                  <div
                    className="mk-path-icon"
                    dangerouslySetInnerHTML={{
                      __html:
                        props.superstate.ui.getSticker("ui//clipboard-pen"),
                    }}
                  ></div>
                  <div>{f}</div>
                  {spaceState.metadata.template == f && (
                    <div
                      className="mk-path-icon"
                      aria-label="Default"
                      dangerouslySetInnerHTML={{
                        __html: props.superstate.ui.getSticker("ui//check"),
                      }}
                    ></div>
                  )}
                </div>
              ))}
              <button
                className="mk-toolbar-button"
                aria-label={i18n.labels.newAction}
                onClick={(e) => newAction(e)}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//plus"),
                }}
              ></button>
            </div>
          )}
        </div>
      </div>
    )
  ) : (
    <></>
  );
};
