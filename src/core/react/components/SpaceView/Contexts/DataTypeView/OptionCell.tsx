import i18n from "core/i18n";
import {
  SelectMenuProps,
  SelectOption,
  defaultMenu,
  menuInput,
  menuSeparator,
} from "core/react/components/UI/Menus/menu/SelectionMenu";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "core/superstate/superstate";
import { serializeOptionValue } from "core/utils/serializer";
import { uniq } from "lodash";
import React, {
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { colors } from "schemas/color";
import { onlyUniqueProp } from "utils/array";
import { windowFromDocument } from "utils/dom";
import { parseMultiString } from "utils/parsers";
import {
  serializeMultiDisplayString,
  serializeMultiString,
} from "utils/serializers";
import { CellEditMode, TableCellMultiProp } from "../TableView/TableView";

export const OptionCell = (
  props: TableCellMultiProp & {
    source: string;
    saveOptions: (options: string, value: string) => void;
  }
) => {
  const parsedValue = useMemo(
    () =>
      parseFieldValue(
        props.propertyValue,
        "option",
        props.superstate,
        props.source
      ),
    [props.propertyValue, props.source]
  );

  const parseOptions = (
    _options: SelectOption[],
    values: string[],
    editMode: CellEditMode,
    editable: boolean
  ): SelectOption[] => {
    return [
      ...(((_options as SelectOption[]) ?? [])
        .filter((f) => f.value)
        .map((t) => ({
          ...t,
          color: editable
            ? t.color?.length > 0
              ? t.color
              : "var(--mk-color-none)"
            : undefined,
          removeable: editable ? editMode >= CellEditMode.EditModeView : false,
        })) ?? []),
      ...values.map((f) => {
        return {
          name: f,
          value: f,
          color: editable ? "var(--mk-color-none)" : undefined,
          removeable: editable ? editMode >= CellEditMode.EditModeView : false,
        };
      }),
    ]
      .filter(onlyUniqueProp("value"))
      .filter((f) => f.value.length > 0);
  };

  const parseValues = (value: string, multi: boolean) => {
    return (multi ? parseMultiString(value) ?? [] : [value]).filter(
      (f) => f && f.length > 0
    );
  };

  const [options, setOptions] = useState<SelectOption[]>(
    parseOptions(
      parsedValue.options ?? [],
      parseValues(props.initialValue, props.multi),
      props.editMode,
      parsedValue.source ? false : true
    )
  );
  const [value, setValue] = useState<string[]>(
    parseValues(props.initialValue, props.multi)
  );

  useEffect(() => {
    setValue(parseValues(props.initialValue, props.multi));
  }, [props.initialValue, props.multi]);

  useEffect(() => {
    setOptions(
      parseOptions(
        parsedValue.options ?? [],
        value,
        props.editMode,
        parsedValue.source ? false : true
      )
    );
  }, [parsedValue, value, props.editMode]);

  const removeValue = (v: string) => {
    if (props.multi) {
      const newValues = value.filter((f) => f != v);
      setValue(newValues);
      props.saveValue(serializeMultiString(newValues));
    } else {
      setValue([]);
      props.saveValue("");
    }
  };
  const removeOption = (option: string) => {
    const newOptions = options.filter((f) => f.value != option);
    const newValues = value.filter((f) => f != option);
    setOptions(newOptions);
    setValue(newValues);
    if (props.multi) {
      props.saveOptions(
        serializeOptionValue(newOptions, parsedValue),
        serializeMultiString(newValues)
      );
    } else {
      props.saveOptions(
        serializeOptionValue(newOptions, parsedValue),
        serializeMultiDisplayString(newValues)
      );
    }
  };
  const savePropValue = (options: SelectOption[], value: string[]) => {
    if (props.multi) {
      props.saveOptions(
        serializeOptionValue(options, parsedValue),
        serializeMultiString(value)
      );
    } else {
      props.saveOptions(
        serializeOptionValue(options, parsedValue),
        serializeMultiDisplayString(value)
      );
    }
  };
  const saveOptions = (_options: string[], _value: string[]) => {
    const newOptions = uniq([..._options, ..._value])
      .filter((f) => f.length > 0)
      .map(
        (t) =>
          options.find((f) => f.value == t) ?? {
            name: t,
            value: t,
          }
      );
    if (!props.multi) {
      if (props.editMode >= CellEditMode.EditModeView) {
        setOptions(newOptions);
      }
      setValue(_value);
      savePropValue(newOptions, _value);
    } else {
      const newValues = uniq([...value, _value[0]]);
      if (props.editMode >= CellEditMode.EditModeView) setOptions(newOptions);
      setValue(newValues);
      savePropValue(newOptions, newValues);
    }
  };
  const saveOption = (option: string, newValue: SelectOption) => {
    const newOptions = options.map((t) => (t.value == option ? newValue : t));
    const newValues: string[] = value;
    setOptions(newOptions);
    setValue(newValues);
    savePropValue(newOptions, newValues);
  };

  const showOptionMenu = (e: React.MouseEvent, optionValue: string) => {
    const option = options.find((f) => f.value == optionValue);
    const menuOptions: SelectOption[] = [];
    menuOptions.push(
      menuInput(option.value, (value) =>
        saveOption(option.value, { ...option, value: value })
      )
    );
    menuOptions.push(menuSeparator);
    menuOptions.push({
      name: "None",
      color: "var(--mk-color-none)",
      onClick: () => {
        saveOption(option.value, { ...option, color: "" });
      },
    });

    colors.forEach((f) => {
      menuOptions.push({
        name: f[0],
        value: f[1],
        color: `${f[1]}`,
        onClick: () => {
          saveOption(option.value, { ...option, color: f[1] });
        },
      });
    });

    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };

  const menuProps = (): SelectMenuProps => ({
    multi: false,
    editable: props.editMode >= CellEditMode.EditModeView,
    ui: props.superstate.ui,
    value: value,
    options: !props.multi
      ? [{ name: i18n.menu.none, value: "" }, ...options]
      : options,
    saveOptions,
    removeOption: props.editMode >= CellEditMode.EditModeView && removeOption,
    onMoreOption: props.editMode >= CellEditMode.EditModeView && showOptionMenu,
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
      removeValue={removeValue}
      selectLabel={props.compactMode ? props.property.name : i18n.labels.select}
      editMode={props.editMode}
      labelElement={(_props: PropsWithChildren<{ value: string }>) => {
        const color =
          options.find((f) => f.value == _props.value)?.color ??
          "var(--mk-color-none)";
        return (
          <div
            className="mk-cell-option-item"
            style={{
              background: `${color}`,
              color:
                color == "var(--mk-color-none)"
                  ? "inherit"
                  : "var(--mk-color-white)",
            }}
          >
            <span>{_props.value}</span>
            {_props.children}
          </div>
        );
      }}
    ></OptionCellBase>
  );
};

export const OptionCellBase = (props: {
  value: any[];
  baseClass: string;
  menuProps?: () => SelectMenuProps;
  labelElement: React.FC<PropsWithChildren<{ value: any }>>;
  multi: boolean;
  editMode: CellEditMode;
  selectLabel: string;
  removeValue?: (value: any) => void;
  superstate: Superstate;
}) => {
  const { value, menuProps } = props;
  const menuRef = useRef(null);

  const ref = useRef(null);
  const showMenu = () => {
    if (menuRef.current) {
      menuRef.current.hide();
      menuRef.current = null;
      return;
    }
    const offset = (ref.current as HTMLElement).getBoundingClientRect();
    menuRef.current = props.superstate.ui.openMenu(
      offset,
      menuProps(),
      windowFromDocument(ref.current.ownerDocument),
      "bottom",
      () => (menuRef.current = null)
    );
  };
  const editable = props.editMode > CellEditMode.EditModeNone;
  return (
    <div className={props.baseClass} ref={ref}>
      {value.length > 0 ? (
        value.map((o, i) => (
          <React.Fragment key={i}>
            {props.labelElement && (
              <props.labelElement value={o}>
                {editable ? (
                  !props.multi && value.length > 0 ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        showMenu();
                      }}
                      className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
                      dangerouslySetInnerHTML={{
                        __html:
                          props.superstate.ui.getSticker("ui//collapse-solid"),
                      }}
                    />
                  ) : props.multi ? (
                    <div
                      className="mk-cell-option-remove mk-icon-xxsmall"
                      onClick={(e) => {
                        e.stopPropagation();
                        props.removeValue(o);
                      }}
                      dangerouslySetInnerHTML={{
                        __html: props.superstate.ui.getSticker("ui//close"),
                      }}
                    ></div>
                  ) : null
                ) : null}
              </props.labelElement>
            )}
          </React.Fragment>
        ))
      ) : editable && !props.multi ? (
        <div
          className="mk-cell-option-item"
          onClick={(e) => {
            showMenu();
          }}
        >
          <div className="mk-cell-empty">{props.selectLabel}</div>
          <div
            className="mk-cell-option-select mk-icon-xxsmall mk-icon-rotated"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//collapse-solid"),
            }}
          />
        </div>
      ) : props.editMode == CellEditMode.EditModeReadOnly ? (
        <div className="mk-cell-option-item mk-cell-empty">
          <div>{i18n.menu.none}</div>
        </div>
      ) : (
        <></>
      )}
      {editable && props.multi ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            editable && showMenu();
          }}
          className="mk-cell-option-new mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//plus"),
          }}
        />
      ) : (
        <></>
      )}
    </div>
  );
};
