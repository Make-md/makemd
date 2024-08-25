import i18n from "core/i18n";
import { addTagToPath, deleteTagFromPath } from "core/superstate/utils/tags";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { TableCellProp } from "../TableView/TableView";
import { OptionCellBase } from "./OptionCell";

export const TagCell = (props: TableCellProp) => {
  const [metadataTags, setMetadataTags] = useState<string[]>([]);
  const [value, setValue] = useState([]);
  useEffect(() => {
    setMetadataTags(
      props.superstate.pathsIndex.get(props.path).metadata?.tags ?? []
    );
    setValue([...(props.superstate.tagsMap.get(props.path) ?? [])]);
  }, []);
  useEffect(() => {
    const updateValue = (payload: { path: string }) => {
      if (payload.path == props.path) {
        setMetadataTags(
          props.superstate.pathsIndex.get(props.path).metadata?.tags ?? []
        );
        setValue([...(props.superstate.tagsMap.get(props.path) ?? [])]);
      }
    };
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      updateValue
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        updateValue
      );
    };
  }, [props.path]);
  const removeValue = (v: string) => {
    deleteTagFromPath(props.superstate, props.path, v);
  };

  const saveOptions = (_options: string[], _value: string[]) => {
    const newValue = _value[0];
    addTagToPath(props.superstate, props.path, newValue);
  };

  const menuProps = () => {
    const options = props.superstate.spaceManager.readTags().map((f) => ({
      name: f,
      value: f,
    }));

    return {
      ui: props.superstate.ui,
      multi: false,
      editable: true,
      value: value,
      options: options,
      saveOptions,
      placeholder: i18n.labels.tagItemSelectPlaceholder,
      searchable: true,
      showAll: true,
      onHide: () => props.setEditMode(null),
    };
  };
  return (
    <OptionCellBase
      superstate={props.superstate}
      baseClass="mk-cell-tags"
      removeValue={removeValue}
      menuProps={menuProps}
      selectLabel={props.compactMode ? props.property.name : i18n.labels.select}
      value={value}
      multi={true}
      editMode={props.editMode}
      labelElement={(_props: PropsWithChildren<{ value: string }>) => (
        <div className="mk-cell-tags-label">
          {_props.value}
          {metadataTags.some((f) => f.toLowerCase() == _props.value) &&
            _props.children}
        </div>
      )}
    ></OptionCellBase>
  );
};
