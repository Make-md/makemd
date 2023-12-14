import i18n from "core/i18n";
import {
  SelectMenuProps,
  SelectOption,
  defaultMenu,
  menuInput,
} from "core/react/components/UI/Menus/menu";
import { isMouseEvent } from "core/react/hooks/useLongPress";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "core/superstate/superstate";
import { uniq } from "lodash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { onlyUniqueProp } from "utils/array";
import { parseMultiString } from "utils/parsers";
import { serializeMultiString } from "utils/serializers";
import { CellEditMode, TableCellMultiProp } from "../TableView/TableView";

export const OptionCell = (
  props: TableCellMultiProp & {
    options: string;
    saveOptions: (options: string, value: string) => void;
  }
) => {
  const parsedValue = useMemo(
    () => parseFieldValue(props.options, "option"),
    [props.options]
  );
  const serializeValue = (
    newOptions: SelectOption[],
    value: Record<string, any>
  ) => {
    return JSON.stringify({
      ...value,
      options: newOptions.map((f) => ({ name: f.name, value: f.value })),
    });
  };
  const initialValue = (
    props.multi
      ? parseMultiString(props.initialValue) ?? []
      : [props.initialValue]
  ).filter((f) => f);

  const initialOptions = [
    ...(((parsedValue.options as { name: string; value: string }[]) ?? [])
      .filter((f) => f.value)
      .map((t) => ({ name: t.name, value: t.value, removeable: true })) ?? []),
    ...initialValue.map((f) => ({ name: f, value: f, removeable: true })),
  ]
    .filter(onlyUniqueProp("value"))
    .filter((f) => f.value.length > 0);

  const [options, setOptions] = useState<SelectOption[]>(initialOptions);
  const [value, setValue] = useState<string[]>(initialValue);
  useEffect(() => {
    setValue(
      (props.multi
        ? parseMultiString(props.initialValue) ?? []
        : [props.initialValue]
      ).filter((f) => f)
    );
  }, [props.initialValue]);

  const removeValue = (v: string) => {
    const newValues = value.filter((f) => f != v);
    setValue(newValues);
    props.saveOptions(
      serializeValue(options, parsedValue),
      serializeMultiString(newValues)
    );
  };
  const removeOption = (option: string) => {
    const newOptions = options.filter((f) => f.value != option);
    const newValues = value.filter((f) => f != option);
    setOptions(newOptions);
    setValue(newValues);
    props.saveOptions(
      serializeValue(
        newOptions.map((f) => f.value),
        parsedValue
      ),
      serializeMultiString(newValues)
    );
  };
  const saveOptions = (_options: string[], _value: string[]) => {
    if (!props.multi) {
      setOptions(
        _options
          .filter((f) => f.length > 0)
          .map((t) => ({ name: t, value: t, removeable: true }))
      );
      setValue(_value);
      props.saveOptions(
        serializeValue(
          _options
            .filter((f) => f.length > 0)
            .map((t) => ({ name: t, value: t })),
          parsedValue
        ),
        serializeMultiString(_value)
      );
    } else {
      const newValues = uniq([...value, _value[0]]);
      setOptions(
        _options.map((t) => ({ name: t, value: t, removeable: true }))
      );
      setValue(newValues);
      props.saveOptions(
        serializeValue(
          _options
            .filter((f) => f.length > 0)
            .map((t) => ({ name: t, value: t })),
          parsedValue
        ),
        serializeMultiString(newValues)
      );
    }
  };
  const renameOption = (option: string, newValue: string) => {
    const newOptions = options.map((t) =>
      t.value == option ? { ...t, name: newValue, value: newValue } : t
    );
    const newValues = value.map((t) => (t == option ? newValue : t));
    setOptions(newOptions);
    setValue(newValues);
    props.saveOptions(
      serializeValue(newOptions, parsedValue),
      serializeMultiString(newValues)
    );
  };

  const showOptionMenu = (e: React.MouseEvent, option: string) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push(menuInput(option, (value) => renameOption(option, value)));

    props.superstate.ui.openMenu(
      isMouseEvent(e)
        ? { x: e.pageX, y: e.pageY }
        : {
            // @ts-ignore
            x: e.nativeEvent.locationX,
            // @ts-ignore
            y: e.nativeEvent.locationY,
          },
      defaultMenu(props.superstate.ui, menuOptions)
    );
  };

  const menuProps = (): SelectMenuProps => ({
    multi: false,
    editable: true,
    ui: props.superstate.ui,
    value: value,
    options: !props.multi
      ? [{ name: i18n.menu.none, value: "" }, ...options]
      : options,
    saveOptions,
    removeOption,
    onMoreOption: showOptionMenu,
    placeholder: i18n.labels.optionItemSelectPlaceholder,
    searchable: true,
    showAll: true,
    onHide: () => props.setEditMode(null),
  });
  return (
    <OptionCellBase
      superstate={props.superstate}
      baseClass="mk-cell-option"
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
  baseClass: string;
  menuProps: () => SelectMenuProps;
  valueClass?: (value: any) => string;
  getLabelString?: (value: any) => string;
  multi: boolean;
  editMode: CellEditMode;
  openItem?: (value: any) => void;
  removeValue: (value: any) => void;
  superstate: Superstate;
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
    menuRef.current = props.superstate.ui.openMenu(
      { x: offset.left - 4, y: offset.bottom - 4 },
      menuProps()
    );
  };
  const editable = props.editMode > 0;
  return (
    <div className={props.baseClass} ref={ref}>
      {value.length > 0 ? (
        value.map((o, i) => (
          <div key={i} className="mk-cell-option-item">
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
                      __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
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
                    __html: props.superstate.ui.getSticker(
                      "ui//mk-ui-collapse-sm"
                    ),
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
          <div onClick={(e) => !props.multi && showMenu()}>
            {i18n.labels.select}
          </div>
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
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//mk-ui-plus"),
          }}
        />
      ) : (
        <></>
      )}
    </div>
  );
};
