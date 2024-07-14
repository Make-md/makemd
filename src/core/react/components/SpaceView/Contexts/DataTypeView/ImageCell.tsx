import ImageModal from "core/react/components/UI/Modals/ImageModal";
import React, { useMemo, useRef } from "react";
import { windowFromDocument } from "utils/dom";
import { parseMultiString } from "utils/parsers";
import { serializeMultiString } from "utils/serializers";
import { CellEditMode, TableCellMultiProp } from "../TableView/TableView";

export const ImageCell = (props: TableCellMultiProp) => {
  const { initialValue, multi } = props;
  const [value, setValue] = React.useState<string[]>(
    parseMultiString(initialValue)
  );
  const menuRef = useRef(null);

  const sourcePaths = useMemo(() => {
    if (value?.length > 0) {
      return value.map((f) => props.superstate.ui.getUIPath(f));
    }
    return [];
  }, [value]);
  // When the input is blurred, we'll call our table meta's updateData function

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(parseMultiString(initialValue));
  }, [initialValue]);

  const deleteValue = (index: number) => {
    if (multi) {
      const newValue = [...value];
      newValue.splice(index, 1);
      setValue(newValue);
      props.saveValue(serializeMultiString(newValue));
    } else {
      props.saveValue("");
    }
  };

  const saveValue = (index: number, image: string) => {
    if (props.multi) {
      if (index == -1) {
        props.saveValue(serializeMultiString([...value, image]));
      } else {
        props.saveValue(
          serializeMultiString(value.map((f, i) => (i == index ? image : f)))
        );
      }
    } else {
      props.saveValue(image);
    }
  };
  const showModal = (index: number, e: React.MouseEvent) => {
    props.superstate.ui.openPalette(
      (_props: { hide: () => void }) => (
        <ImageModal
          superstate={props.superstate}
          hide={_props.hide}
          selectedPath={(image) => saveValue(index, image)}
        ></ImageModal>
      ),
      windowFromDocument(e.view.document)
    );

    props.setEditMode(null);
  };
  return (
    <div className="mk-cell-image">
      {sourcePaths.map((f, i) => (
        <div key={i} className="mk-cell-image-item">
          <img
            onClick={(e) =>
              props.superstate.ui.openPath(
                initialValue,
                e.metaKey ? "tab" : false
              )
            }
            src={f}
          />
          {props.editMode > CellEditMode.EditModeNone ? (
            <div className="mk-image-selector">
              <div
                onClick={(e) => showModal(i, e)}
                className="mk-hover-button mk-icon-xsmall"
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//edit"),
                }}
              ></div>
              <div
                onClick={() => deleteValue(i)}
                className={"mk-hover-button mk-icon-xsmall"}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//close"),
                }}
              ></div>
            </div>
          ) : (
            <></>
          )}
        </div>
      ))}
      {props.editMode > CellEditMode.EditModeNone ? (
        props.multi ? (
          <div
            onClick={(e) => showModal(-1, e)}
            className="mk-cell-option-new mk-icon-small"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
          />
        ) : value.length == 0 ? (
          <div onClick={(e) => showModal(-1, e)} className="mk-cell-clickable">
            Select
          </div>
        ) : null
      ) : (
        <></>
      )}
    </div>
  );
};
