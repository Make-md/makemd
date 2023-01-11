import React, { forwardRef } from "react";
import classNames from "classnames";
import { MDBColumn } from "types/mdb";
import { DataTypeView } from "../DataTypeView/DataTypeView";
import MakeMDPlugin from "main";

export interface CardColumnProps {
  id: string;
  children: React.ReactNode;
  columns?: number;
  plugin: MakeMDPlugin;
  field?: MDBColumn;
  label?: string;
  file?: string;
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
}

export const CardColumnView = forwardRef<HTMLDivElement, CardColumnProps>(
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
      plugin,
      field,
      label,
      file,
      placeholder,
      style,
      scrollable,
      shadow,
      unstyled,
      ...props
    }: CardColumnProps,
    ref
  ) => {
    const Component = "div";

    return (
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
              plugin={plugin}
              index={parseInt(id) * -1}
              file={file}
              column={field}
              editable={false}
            ></DataTypeView>
            <div className={"Actions"} {...handleProps}></div>
          </div>
        ) : null}
        {placeholder ? children : <ul>{children}</ul>}
      </Component>
    );
  }
);
