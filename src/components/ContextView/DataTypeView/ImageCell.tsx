import { imageModal } from "components/ui/modals/imageModal";
import { TFile } from "obsidian";
import React, { useEffect, useMemo, useRef } from "react";
import { getAbstractFileAtPath } from "utils/file";
import { uiIconSet } from "utils/icons";
import { CellEditMode, TableCellProp } from "../TableView/TableView";

export const ImageCell = (props: TableCellProp) => {
  const { initialValue, saveValue } = props;
  const [value, setValue] = React.useState(initialValue);
  const menuRef = useRef(null);
  useEffect(() => {
    if (props.editMode == CellEditMode.EditModeActive) {
      if (!menuRef.current) showModal();
    }
  }, []);
  const file = useMemo(() => {
    const f = getAbstractFileAtPath(app, value);
    return f ? app.vault.getResourcePath(f as TFile) : value;
  }, [value]);
  // When the input is blurred, we'll call our table meta's updateData function

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const showModal = () => {
    let vaultChangeModal = new imageModal(
      props.plugin,
      props.plugin.app,
      (image) => saveValue(image)
    );
    vaultChangeModal.open();
    props.setEditMode(null);
  };
  return (
    <div className="mk-cell-image">
      <img src={file} />
      {props.editMode > 0 ? (
        <div className="mk-image-selector">
          <div
            onClick={showModal}
            className="mk-hover-button mk-icon-xsmall"
            dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-edit"] }}
          ></div>
          {value?.length > 0 && (
            <div
              onClick={() => saveValue("")}
              className={"mk-hover-button mk-icon-xsmall"}
              dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-close"] }}
            ></div>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
