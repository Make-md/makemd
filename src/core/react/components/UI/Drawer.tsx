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
    const drawers = document.querySelectorAll(".mk-drawer-content");
    let drawerIndex = 0;
    drawers.forEach((drawer) => {
      if (drawer instanceof HTMLElement) {
        const index = drawer.getAttribute("data-drawer-index");
        if (index && parseInt(index) >= drawerIndex) {
          drawerIndex = parseInt(index) + 1;
        }
      }
    });
    return drawerIndex;
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
          data-drawer-index={drawerCount}
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
