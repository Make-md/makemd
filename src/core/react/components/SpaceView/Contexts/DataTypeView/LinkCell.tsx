import { PathCrumb } from "core/react/components/UI/Crumbs/PathCrumb";
import React, { PropsWithChildren, useEffect, useState } from "react";
import i18n from "shared/i18n";
import { uniq } from "shared/utils/array";
import { parseMultiString } from "utils/parsers";
import {
  serializeMultiDisplayString,
  serializeMultiString,
} from "utils/serializers";
import { TableCellMultiProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

export const LinkCell = (props: TableCellMultiProp & { source?: string }) => {
  const parseValue = (v: string) =>
    props.multi
      ? parseMultiString(v) ?? []
      : [v]
          .filter((f) => f)
          .map((f) =>
            props.superstate.spaceManager.resolvePath(f, props.source)
          );
  useEffect(() => {
    setValue(parseValue(props.initialValue));
  }, [props.initialValue]);

  const [value, setValue] = useState(parseValue(props.initialValue));

  const removeValue = (v: string) => {
    const newValues = value.filter((f) => f != v);
    setValue(newValues);
    saveValue(newValues);
  };
  const saveValue = (_values: string[]) => {
    if (props.multi) {
      props.saveValue(serializeMultiString(_values));
    } else {
      props.saveValue(serializeMultiDisplayString(_values));
    }
  };
  const saveOptions = (_: string[], _value: string[]) => {
    if (!props.multi) {
      setValue(_value);
      saveValue(_value);
    } else {
      const newValue = _value[0];
      if (newValue) {
        const newValues = uniq([...value, newValue]);
        setValue(newValues);
        saveValue(newValues);
      }
    }
  };
  const menuProps = () => {
    const currentPath = props.source || "";
    
    const options = [...props.superstate.pathsIndex.values()]
      .filter((f) => !f.hidden)
      .map((f) => ({
        name: f.name,
        value: f.path,
        description: f.path,
      }))
      .sort((a, b) => {
        // Check if paths are related to current path
        const aIsChild = currentPath && a.value.startsWith(currentPath + "/");
        const bIsChild = currentPath && b.value.startsWith(currentPath + "/");
        const aIsCurrent = a.value === currentPath;
        const bIsCurrent = b.value === currentPath;
        
        // Prioritize current path first
        if (aIsCurrent && !bIsCurrent) return -1;
        if (!aIsCurrent && bIsCurrent) return 1;
        
        // Then prioritize children of current path
        if (aIsChild && !bIsChild) return -1;
        if (!aIsChild && bIsChild) return 1;
        
        // For items with same priority, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
      
    const _options = !props.multi
      ? [{ name: i18n.menu.none, value: "" }, ...options]
      : options;
    return {
      ui: props.superstate.ui,
      multi: false,
      editable: true,
      value: value.map((f) => f),
      options: _options,
      saveOptions,
      placeholder: i18n.labels.linkItemSelectPlaceholder,
      detail: true,
      searchable: true,
      // onHide: () => props.setEditMode(null),
    };
  };

  const openLink = async (o: string) => {
    const pathExists = await props.superstate.spaceManager.pathExists(o);
    if (pathExists) {
      props.superstate.ui.openPath(o, false);
    } else {
      await props.superstate.spaceManager.createItemAtPath("/", "md", o);
      props.superstate.ui.openPath(o, false);
    }
  };
  return (
    <OptionCellBase
      superstate={props.superstate}
      baseClass="mk-cell-link"
      removeValue={removeValue}
      selectLabel={props.compactMode ? props.property.name : i18n.labels.select}
      menuProps={menuProps}
      labelElement={(_props: PropsWithChildren<{ value: string }>) => (
        <PathCrumb superstate={props.superstate} path={_props.value}>
          {_props.children}
        </PathCrumb>
      )}
      value={value}
      multi={props.multi}
      editMode={props.editMode}
    ></OptionCellBase>
  );
};
