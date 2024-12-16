import i18n from "core/i18n";
import { PathCrumb } from "core/react/components/UI/Crumbs/PathCrumb";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import {
  addPathToSpaceAtIndex,
  newPathInSpace,
} from "core/superstate/utils/spaces";
import { PathPropertyName } from "core/types/context";
import {
  deletePropertyMultiValue,
  updateContextValue,
} from "core/utils/contexts/context";
import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { uniq } from "utils/array";
import { parseMultiString } from "utils/parsers";
import {
  serializeMultiDisplayString,
  serializeMultiString,
} from "utils/serializers";
import { TableCellMultiProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

export const ContextCell = (
  props: TableCellMultiProp & {
    source: string;
  }
) => {
  const { spaceState } = useContext(SpaceContext);
  const { contextTable } = useContext(ContextEditorContext);
  const fieldValue = useMemo(
    () => parseFieldValue(props.propertyValue, "context", props.superstate),
    [props.propertyValue]
  );
  const spacePath = useMemo(
    () =>
      fieldValue
        ? props.superstate.spaceManager.resolvePath(
            fieldValue.space,
            spaceState?.path
          )
        : null,
    [fieldValue.space, spaceState]
  );
  const parseValue = (v: string, multi: boolean) =>
    (multi ? parseMultiString(v) ?? [] : [v]).filter((f) => f);

  const [propValues, setPropValues] = useState([]);
  useEffect(() => {
    if (!fieldValue?.field || !contextTable[spacePath]) {
      return;
    }
    setPropValues(
      contextTable[spacePath].rows.reduce((p, c) => {
        if (parseMultiString(c[fieldValue.field]).includes(props.path)) {
          return [...p, c[PathPropertyName]];
        }
        return p;
      }, [])
    );
  }, [spacePath, fieldValue, contextTable]);

  const options = [...props.superstate.spacesMap.getInverse(spacePath)]
    .map((f) => props.superstate.pathsIndex.get(f))
    .filter((f) => f)
    .map((f) => ({
      name: f.name,
      icon: f.label.sticker,
      description: f.path,
      value: f.path,
    }));
  const [value, setValue] = useState<string[]>(
    parseValue(props.initialValue, props.multi)
  );
  const allValues = useMemo(
    () => uniq([...value, ...propValues]),
    [value, propValues]
  );
  const saveValue = (_values: string[]) => {
    if (props.multi) {
      props.saveValue(serializeMultiString(_values));
    } else {
      props.saveValue(serializeMultiDisplayString(_values));
    }
  };
  const removeValue = (v: string) => {
    if (propValues.includes(v)) {
      const newPropValues = propValues.filter((f) => f != v);
      setPropValues(newPropValues);
      updateContextValue(
        props.superstate.spaceManager,
        props.superstate.spacesIndex.get(spacePath).space,
        v,
        fieldValue.spaceField,
        props.path,
        deletePropertyMultiValue
      );
    } else {
      const newValues = value.filter((f) => f != v);
      setValue(newValues);
      saveValue(newValues.map((f) => f));
    }
  };
  useEffect(() => {
    setValue(parseValue(props.initialValue, props.multi));
  }, [props.initialValue, props.multi]);

  const saveOptions = (_options: string[], _value: string[]) => {
    const currentPaths = [
      ...props.superstate.spacesMap.getInverse(spacePath),
    ].filter((f) => !_value.includes(f));
    if (currentPaths.length > 0) {
      currentPaths.forEach((f) => {
        const space = props.superstate.spacesIndex.get(spacePath);
        if (props.superstate.pathsIndex.get(f)) {
          addPathToSpaceAtIndex(props.superstate, space, f);
        } else {
          newPathInSpace(props.superstate, space, "md", f, true);
        }
      });
    }
    if (!props.multi) {
      setValue(_value);
      saveValue(_value);
    } else {
      const newValue = _value[0];
      if (newValue) {
        const newValues = [...value, newValue];
        setValue(newValues);
        saveValue(newValues);
      }
    }
  };

  const menuProps = () => {
    const _options = !props.multi
      ? [{ name: i18n.menu.none, value: "" }, ...options]
      : options;
    return {
      ui: props.superstate.ui,
      multi: false,
      editable: true,
      value: allValues.map((f) => f.path),
      options: _options,
      saveOptions,
      placeholder: i18n.labels.contextItemSelectPlaceholder,
      searchable: true,
      showAll: true,
      onHide: () => props.setEditMode(null),
    };
  };

  return (
    <OptionCellBase
      baseClass="mk-cell-context"
      superstate={props.superstate}
      menuProps={menuProps}
      removeValue={removeValue}
      selectLabel={props.compactMode ? props.property.name : i18n.labels.select}
      labelElement={(_props: PropsWithChildren<{ value: string }>) => (
        <PathCrumb
          superstate={props.superstate}
          path={_props.value}
          source={spaceState?.path}
        >
          {_props.children}
        </PathCrumb>
      )}
      value={allValues}
      multi={props.multi}
      editMode={props.editMode}
    ></OptionCellBase>
  );
};
