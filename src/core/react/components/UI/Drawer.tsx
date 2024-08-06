import classNames from "classnames";
import React, { cloneElement, useMemo } from "react";
import { Drawer } from "vaul";
export const MobileDrawer = (props: {
  fc: JSX.Element;
  title?: string;
  hide: (suppress: boolean) => void;
  className: string;
  newProps: any;
}) => {
  const { newProps } = props;
  const [open, setOpen] = React.useState(true);
  const drawerCount = useMemo(() => {
    const drawerCounts = document.querySelectorAll(".mk-drawer-content").length;
    return drawerCounts;
  }, []);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
      }}
      shouldScaleBackground
      onClose={() => {
        setOpen(false);
        props.hide(true);
      }}
      noBodyStyles
    >
      <Drawer.Portal>
        <Drawer.Content
          className={classNames("mk-drawer-content", props.className)}
          style={
            {
              "--drawer-index": drawerCount,
            } as React.CSSProperties
          }
        >
          <Drawer.Handle className="mk-drawer-handle" />
          <Drawer.Title
            className="mk-drawer-title"
            hidden={!(props.title?.length > 0)}
          >
            {props.title}
          </Drawer.Title>
          {cloneElement(props.fc, {
            hide: (supress?: boolean) => {
              setOpen(false);
              props.hide(supress);
            },
            ...newProps,
          })}
        </Drawer.Content>
        <Drawer.Overlay
          className="mk-drawer-overlay"
          style={
            {
              "--drawer-index": drawerCount,
            } as React.CSSProperties
          }
        />
      </Drawer.Portal>
    </Drawer.Root>
  );
};
