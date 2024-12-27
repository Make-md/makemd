import { contextPathFromPath } from "core/utils/contexts/context";
import { SelectMenuProps } from "makemd-core";
import React, { useEffect, useRef, useState } from "react";
import i18n from "shared/i18n";
import { windowFromDocument } from "shared/utils/dom";
import { CellEditMode, TableCellProp } from "../TableView/TableView";

export const SpaceCell = (props: TableCellProp & { isTable: boolean }) => {
  const openLink = async () => {
    props.superstate.ui.openPath(props.initialValue, false);
  };
  const menuRef = useRef(null);
  const [spaceObject, setSpaceObject] = useState(null);
  useEffect(() => {
    contextPathFromPath(props.superstate, props.initialValue).then((f) =>
      setSpaceObject(f)
    );
  }, [props.initialValue]);
  const ref = useRef(null);
  const menuProps = (): SelectMenuProps => ({
    multi: false,
    ui: props.superstate.ui,
    editable: true,
    value: [props.initialValue],
    options: props.superstate.allSpaces().map((f) => ({
      name: f.name,
      value: f.path,
      description: f.name,
    })),
    saveOptions: (_, value) => props.saveValue(value[0]),
    removeOption: () => null,
    placeholder: i18n.labels.optionItemSelectPlaceholder,
    searchable: true,
    showAll: true,
    onHide: () => props.setEditMode(null),
  });

  const menuSchemaProps = (): SelectMenuProps => ({
    multi: false,
    ui: props.superstate.ui,
    editable: true,
    value: [spaceObject.schema],
    options: props.superstate.contextsIndex
      .get(spaceObject.space)
      .schemas.map((f) => ({
        name: f.name,
        value: f.id,
        description: f.name,
      })),
    saveOptions: (_, value) =>
      props.saveValue(`${spaceObject?.space}/#^${value[0]}`),
    removeOption: () => null,
    placeholder: i18n.labels.optionItemSelectPlaceholder,
    searchable: true,
    showAll: true,
    onHide: () => props.setEditMode(null),
  });
  const showMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    menuRef.current = props.superstate.ui.openMenu(
      offset,
      menuProps(),
      windowFromDocument(e.view.document)
    );
  };

  const showSchemaMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    menuRef.current = props.superstate.ui.openMenu(
      offset,
      menuSchemaProps(),
      windowFromDocument(e.view.document)
    );
  };

  return (
    <div ref={ref} className="mk-cell-space">
      <div className="mk-cell-option-item">
        <div onClick={() => openLink()}>{spaceObject?.space}</div>
        {props.editMode > CellEditMode.EditModeView && (
          <>
            <span></span>
            <div
              onClick={(e) => showMenu(e)}
              className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//collapse-solid"),
              }}
            />
          </>
        )}
      </div>
      {props.isTable && (
        <div className="mk-cell-option-item">
          <div onClick={() => openLink()}>{spaceObject?.schemaName}</div>
          {spaceObject?.space && (
            <div
              onClick={(e) => showSchemaMenu(e)}
              className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//collapse-solid"),
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
