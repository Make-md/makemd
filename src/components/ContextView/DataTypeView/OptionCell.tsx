import {
   showSelectMenu
} from "components/ui/menus/menuItems";
import { SelectOption, SelectMenuProps } from "components/ui/menus/selectMenu";
import i18n from "i18n";
import React, { useEffect, useRef, useState } from "react";
import { splitString } from "utils/contexts/predicate/predicate";
import { uiIconSet } from "utils/icons";
import { onlyUniqueProp } from "utils/tree";
import { CellEditMode, TableCellMultiProp } from "../TableView/TableView";

export const OptionCell = (
  props: TableCellMultiProp & {
    options: string;
    saveOptions: (options: string, value: string) => void;
  }
) => {
  const initialValue = (
    props.multi ? splitString(props.initialValue) ?? [] : [props.initialValue]
  ).filter((f) => f);

  const initialOptions = [
    ...(splitString(props.options)
      .filter((f) => f)
      .map((t) => ({ name: t, value: t })) ?? []),
    ...initialValue.map((f) => ({ name: f, value: f })),
  ].filter(onlyUniqueProp("value"));

  const [options, setOptions] = useState<SelectOption[]>(initialOptions);
  const [value, setValue] = useState<string[]>(initialValue);
  const [saveState, setSaveState] = useState(false);
  useEffect(() => {
    setValue(
      (props.multi
        ? splitString(props.initialValue) ?? []
        : [props.initialValue]
      ).filter((f) => f)
    );
  }, [props.initialValue]);

  const removeValue = (v: string) => {
    const newValues = value.filter((f) => f != v);
    setValue(newValues);
    props.saveOptions(
      options.map((f) => f.value).join(","),
      newValues.join(",")
    );
  };

  const saveOptions = (_options: string[], _value: string[]) => {
    if (!props.multi) {
      setOptions(
        _options.filter((f) => f.length > 0).map((t) => ({ name: t, value: t }))
      );
      setValue(_value);
    } else {
      setOptions(_options.map((t) => ({ name: t, value: t })));
      setValue(_value);
    }
  };
  useEffect(() => {
    if (saveState) {
      props.saveOptions(
        options
          .filter((f) => f.value.length > 0)
          .map((f) => f.value)
          .join(","),
        value.join(",")
      );
      props.setEditMode(null);
      setSaveState(false);
    }
  }, [saveState]);
  const menuProps = (): SelectMenuProps => ({
    multi: props.multi,
    editable: true,
    value: value,
    options: !props.multi ? [{ name: i18n.menu.none, value: "" }, ...options] : options,
    saveOptions,
    placeholder: i18n.labels.optionItemSelectPlaceholder,
    searchable: true,
    showAll: true,
    onHide: () => {
      setSaveState(true);
    },
  });
  return (
    <OptionCellBase
      value={value}
      menuProps={menuProps}
      multi={props.multi}
      editMode={props.editMode}
      removeValue={removeValue}
    ></OptionCellBase>
  );
};

export const OptionCellBase = (props: {
  value: any[];
  menuProps: () => SelectMenuProps;
  valueClass?: (value: any) => string;
  getLabelString?: (value: any) => string;
  multi: boolean;
  editMode: CellEditMode;
  openItem?: (value: any) => void;
  removeValue: (value: any) => void;
}) => {
  const {
    value,
    menuProps,
    removeValue,
    getLabelString,
    openItem,
    valueClass,
  } = props;
  const menuRef = useRef(null);
  useEffect(() => {
    if (props.editMode == 2) {
      if (!menuRef.current) showMenu();
    }
  }, [props.editMode]);
  const ref = useRef(null);
  const showMenu = () => {
    const offset = (ref.current as HTMLElement).getBoundingClientRect();
    menuRef.current = showSelectMenu(
      { x: offset.left - 4, y: offset.bottom - 4 },
      menuProps()
    );
  };
  const editable = props.editMode > 0;
  return (
    <div className="mk-cell-option" ref={ref}>
      {value.length > 0 ? (
        value.map((o) => (
          <div className="mk-cell-option-item">
            {(getLabelString ? getLabelString(o).length > 0 : o.length > 0) ? (
              <>
                <div
                  className={valueClass && valueClass(o)}
                  onClick={() => openItem && openItem(o)}
                >
                  {getLabelString ? getLabelString(o) : o}
                </div>
                {editable && props.multi ? (
                  <div
                    className="mk-icon-xsmall"
                    onClick={() => removeValue(o)}
                    dangerouslySetInnerHTML={{
                      __html: uiIconSet["mk-ui-close"],
                    }}
                  ></div>
                ) : (
                  <></>
                )}
              </>
            ) : (
              <div>{i18n.labels.select}</div>
            )}
            {editable && !props.multi && value.length > 0 ? (
              <>
                <span></span>
                <div
                  onClick={(e) => editable && !props.multi && showMenu()}
                  className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
                  dangerouslySetInnerHTML={{
                    __html: uiIconSet["mk-ui-collapse-sm"],
                  }}
                />
              </>
            ) : (
              <></>
            )}
          </div>
        ))
      ) : editable && !props.multi ? (
        <div className="mk-cell-option-item">
          <div onClick={(e) => !props.multi && showMenu()}>{i18n.labels.select}</div>
        </div>
      ) : props.editMode == -1 ? (
        <div className="mk-cell-option-item mk-cell-empty">
          <div>{i18n.menu.none}</div>
        </div>
      ) : (
        <></>
      )}
      {editable && props.multi ? (
        <div
          onClick={(e) => editable && showMenu()}
          className="mk-cell-option-new mk-icon-small"
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-plus"] }}
        />
      ) : (
        <></>
      )}
    </div>
  );
};
