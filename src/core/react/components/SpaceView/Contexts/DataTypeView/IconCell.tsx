import i18n from "core/i18n";
import StickerModal from "core/react/components/UI/Modals/StickerModal";
import React, { useEffect, useMemo, useRef } from "react";
import { parseMultiString } from "utils/parsers";
import { TableCellMultiProp } from "../TableView/TableView";

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
    if (props.editMode == 2) {
      ref?.current?.focus();
    }
  }, [props.editMode]);

  const triggerStickerMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.superstate.ui.openPalette((_props: { hide: () => void }) => (
      <StickerModal
        ui={props.superstate.ui}
        hide={_props.hide}
        selectedSticker={(emoji) => props.saveValue(emoji)}
      />
    ));
  };

  return (
    <div className="mk-cell-icon">
      {value.map((v, i) => (
        <button
          key={i}
          aria-label={i18n.buttons.changeIcon}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker(v),
          }}
          onClick={(e) => triggerStickerMenu(e)}
        ></button>
      ))}
    </div>
  );
};
