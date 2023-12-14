import ImageModal from "core/react/components/UI/Modals/ImageModal";
import React, { useEffect, useMemo, useRef } from "react";
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
  const sourcePath = useMemo(() => {
    return props.superstate.ui.getUIPath(value);
  }, [value]);
  // When the input is blurred, we'll call our table meta's updateData function

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const showModal = () => {
    props.superstate.ui.openPalette((_props: { hide: () => void }) => (
      <ImageModal
        superstate={props.superstate}
        hide={_props.hide}
        selectedPath={(image) => saveValue(image)}
      ></ImageModal>
    ));

    props.setEditMode(null);
  };
  return (
    <div className="mk-cell-image">
      <img src={sourcePath} />
      {props.editMode > 0 ? (
        <div className="mk-image-selector">
          <div
            onClick={showModal}
            className="mk-hover-button mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-ui-edit"),
            }}
          ></div>
          {value?.length > 0 && (
            <div
              onClick={() => saveValue("")}
              className={"mk-hover-button mk-icon-xsmall"}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
              }}
            ></div>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
