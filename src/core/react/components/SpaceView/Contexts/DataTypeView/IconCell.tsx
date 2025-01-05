import React, { useEffect, useMemo, useRef } from "react";
import StickerModal from "shared/components/StickerModal";
import i18n from "shared/i18n";
import { windowFromDocument } from "shared/utils/dom";
import { parseMultiString } from "utils/parsers";
import { CellEditMode, TableCellMultiProp } from "../TableView/TableView";

export const IconCell = (props: TableCellMultiProp) => {
  const value = useMemo(
    () =>
      props.multi
        ? parseMultiString(props.initialValue) ?? []
        : [props.initialValue],
    [props.initialValue]
  );

  const ref = useRef(null);

  useEffect(() => {
    if (props.editMode == CellEditMode.EditModeActive) {
      ref?.current?.focus();
    }
  }, [props.editMode]);

  const triggerStickerMenu = (e: React.MouseEvent) => {
    props.superstate.ui.openPalette(
      <StickerModal
        ui={props.superstate.ui}
        selectedSticker={(emoji) => props.saveValue(emoji)}
      />,
      windowFromDocument(e.view.document)
    );
  };

  return (
    <div className="mk-cell-icon">
      {value.map((v, i) =>
        v?.length > 0 ? (
          <div
            className="mk-cell-clickable"
            key={i}
            aria-label={i18n.buttons.changeIcon}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker(v),
            }}
            onClick={(e) => triggerStickerMenu(e)}
          ></div>
        ) : (
          <div
            key={i}
            className="mk-cell-placeholder"
            onClick={(e) => triggerStickerMenu(e)}
          >
            {i18n.labels.selectIcon}
          </div>
        )
      )}
    </div>
  );
};
