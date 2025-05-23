import { PathCrumb } from "core/react/components/UI/Crumbs/PathCrumb";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import {
  addPathToSpaceAtIndex,
  newPathInSpace,
} from "core/superstate/utils/spaces";
import {
  deletePropertyMultiValue,
  updateContextValue,
} from "core/utils/contexts/context";
import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import i18n from "shared/i18n";
import { SpaceTables } from "shared/types/mdb";
import { uniq } from "shared/utils/array";
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
    contextTable: SpaceTables;
    contextPath: string;
  }
) => {
  const fieldValue = useMemo(
    () => parseFieldValue(props.propertyValue, "context"),
    [props.propertyValue]
  );
  const spacePath = useMemo(
    () =>
      fieldValue
        ? props.superstate.spaceManager.resolvePath(
            fieldValue.space,
            props.contextPath
          )
        : null,
    [fieldValue.space, props.contextPath]
  );
  const parseValue = (v: string, multi: boolean) =>
    (multi ? parseMultiString(v) ?? [] : [v]).filter((f) => f);

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
  const allValues = useMemo(() => uniq([...value]), [value]);
  const saveValue = (_values: string[]) => {
    if (props.multi) {
      props.saveValue(serializeMultiString(_values));
    } else {
      props.saveValue(serializeMultiDisplayString(_values));
    }
  };
  const removeValue = async (v: string) => {
    //remove the value in linked property first and dont calculate and force refresh to make sure
    if (fieldValue.field?.length > 0)
      await updateContextValue(
        props.superstate.spaceManager,
        props.superstate.spacesIndex.get(spacePath).space,
        v,
        fieldValue.field,
        props.path,
        deletePropertyMultiValue,
        null,
        true,
        false
      );
    await updateContextValue(
      props.superstate.spaceManager,
      props.superstate.spacesIndex.get(props.contextPath).space,
      props.path,
      props.property.name,
      v,
      deletePropertyMultiValue,
      null,
      true,
      true
    );
    if (fieldValue.field?.length > 0) {
      //force refresh linked so that all views are uptodate
      props.superstate.reloadContextByPath(spacePath, { force: true });
    }
    const newValues = value.filter((f) => f != v);
    setValue(newValues);
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
          source={props.contextPath}
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
