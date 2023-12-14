import i18n from "core/i18n";
import { SelectMenuProps } from "core/react/components/UI/Menus/menu";
import React, { useRef } from "react";
import { TableCellProp } from "../TableView/TableView";

export const SpaceCell = (props: TableCellProp) => {
  const openLink = async () => {
    props.superstate.ui.openPath(props.initialValue, false);
  };
  const menuRef = useRef(null);

  const ref = useRef(null);
  const menuProps = (): SelectMenuProps => ({
    multi: false,
    ui: props.superstate.ui,
    editable: true,
    value: [props.initialValue],
    options: props.superstate.allSpaces().map((f) => ({
      name: f.name,
      value: f.name,
      description: f.name,
    })),
    saveOptions: (_, value) => props.saveValue(value[0]),
    removeOption: () => {},
    placeholder: i18n.labels.optionItemSelectPlaceholder,
    searchable: true,
    showAll: true,
    onHide: () => props.setEditMode(null),
  });
  const showMenu = () => {
    const offset = (ref.current as HTMLElement).getBoundingClientRect();
    menuRef.current = props.superstate.ui.openMenu(
      { x: offset.left - 4, y: offset.bottom - 4 },
      menuProps()
    );
  };

  return (
    <div ref={ref}>
      <div className="mk-cell-option-item">
        <div onClick={() => openLink()}>{props.initialValue}</div>

        <span></span>
        <div
          onClick={(e) => showMenu()}
          className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//mk-ui-collapse-sm"),
          }}
        />
      </div>
    </div>
  );
};
