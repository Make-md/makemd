import { SelectOption } from "core/react/components/UI/Menus/menu";
import React from "react";

const SelectMenuPillComponent = (props: {
  classNames: Record<string, string>;
  onDelete: (e: React.MouseEvent) => void;
  tag: SelectOption;
}) => {
  return (
    <button
      type="button"
      className={props.classNames.selectedTag}
      onClick={props.onDelete}
    >
      <span className={props.classNames.selectedTagName}>{props.tag.name}</span>
    </button>
  );
};

export default SelectMenuPillComponent;
