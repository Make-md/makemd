import classNames from "classnames";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { Superstate } from "core/superstate/superstate";
import { PathPropertyName } from "core/types/context";
import React, { forwardRef, useContext } from "react";
import { DBRow, SpaceTableColumn } from "types/mdb";
import { DataTypeView } from "../DataTypeView/DataTypeView";

export interface CardColumnProps {
  id: string;
  children: React.ReactNode;
  columns?: number;
  superstate: Superstate;
  field?: SpaceTableColumn;
  label?: string;
  path?: string;
  style?: React.CSSProperties;
  horizontal?: boolean;
  hover?: boolean;
  handleProps?: React.HTMLAttributes<any>;
  scrollable?: boolean;
  shadow?: boolean;
  placeholder?: boolean;
  unstyled?: boolean;
  onClick?(): void;
  onRemove?(): void;
  renderItem?(args: {
    children: React.ReactNode;
    value: DBRow;
  }): React.ReactElement;
}

const CardColumnView = forwardRef<HTMLDivElement, CardColumnProps>(
  (
    {
      id,
      children,
      columns = 1,
      handleProps,
      horizontal,
      hover,
      onClick,
      onRemove,
      superstate,
      field,
      label,
      path: path,
      placeholder,
      style,
      scrollable,
      shadow,
      unstyled,
      renderItem,
      ...props
    }: CardColumnProps,
    ref
  ) => {
    const Component = "div";
    const { updateValue, updateFieldValue, contextTable } =
      useContext(ContextEditorContext);
    return renderItem ? (
      renderItem({
        children,
        value: { name: field?.name, value: label },
      })
    ) : (
      <Component
        {...props}
        ref={ref}
        style={
          {
            ...style,
            "--columns": columns,
          } as React.CSSProperties
        }
        className={classNames(
          "mk-list-group",
          unstyled && "unstyled",
          horizontal && "horizontal",
          hover && "hover",
          placeholder && "placeholder",
          scrollable && "scrollable",
          shadow && "shadow"
        )}
        onClick={onClick}
        tabIndex={onClick ? 0 : undefined}
      >
        {label != null && field ? (
          <div className={"mk-list-group-header"}>
            <DataTypeView
              initialValue={label}
              superstate={superstate}
              row={{ [PathPropertyName]: path }}
              column={field}
              editable={false}
              updateValue={(value) =>
                updateValue(
                  field.name,
                  value,
                  field.table,
                  parseInt(id) * -1,
                  path
                )
              }
              updateFieldValue={(value, fieldValue) =>
                updateFieldValue(
                  field.name,
                  fieldValue,
                  value,
                  field.table,
                  parseInt(id) * -1,
                  path
                )
              }
              contextTable={contextTable}
            ></DataTypeView>
            <div className={"Actions"} {...handleProps}></div>
          </div>
        ) : null}
        {placeholder ? children : <ul>{children}</ul>}
      </Component>
    );
  }
);
CardColumnView.displayName = "CardColumnView";
export default CardColumnView;
