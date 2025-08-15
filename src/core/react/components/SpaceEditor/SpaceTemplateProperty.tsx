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
import { isString } from "lodash";
import { Superstate, i18n } from "makemd-core";
import React, { useContext } from "react";
import { windowFromDocument } from "shared/utils/dom";
import { defaultMenu } from "../UI/Menus/menu/SelectionMenu";
export const SpaceTemplateProperty = (props: {
  superstate: Superstate;
  templates: string[];
}) => {
  const { templates } = props;
  const { pathState } = useContext(PathContext);
  const { spaceState } = useContext(SpaceContext);
  const newAction = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    showLinkMenu(
      offset,
      windowFromDocument(e.view.document),
      props.superstate,
      (space) => {
        if (isString(space))
          saveSpaceTemplate(props.superstate, pathState.path, space);
      }
    );
    e.stopPropagation();
  };
  const showMenu = (e: React.MouseEvent, f: string) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const menuOptions = [];
    menuOptions.push({
      name: i18n.labels.setAsDefault,
      icon: "ui//clipboard-pen",
      onClick: () => setTemplateInSpace(props.superstate, pathState.path, f),
    });
    menuOptions.push({
      name: i18n.menu.delete,
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
      description: i18n.descriptions.templateNameFormula,
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
  return (
    <div className="mk-space-editor-smart">
      <div className="mk-space-editor-smart-header">
        <div
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//clipboard-pen"),
          }}
        ></div>
        <span>{i18n.labels.createNewItemsUsing}</span>
        <span>{i18n.labels.withName}</span>
        <button
          className="mk-toolbar-button"
          aria-label={i18n.labels.editFormula}
          onClick={(e) => editFormula(e)}
        >
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//formula"),
            }}
          ></div>
          {i18n.properties.fileProperty.label}
        </button>
      </div>

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
                __html: props.superstate.ui.getSticker("ui//clipboard-pen"),
              }}
            ></div>
            <div>{f}</div>
            {spaceState.metadata.template == f && (
              <div
                className="mk-path-icon"
                aria-label={i18n.labels.default}
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
    </div>
  );
};
