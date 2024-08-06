import {
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import classNames from "classnames";
import { MenuObject, calculateBoundsBasedOnPosition } from "core/utils/ui/menu";
import { isPhone } from "core/utils/ui/screen";
import { UIManager } from "makemd-core";
import React, { cloneElement, useEffect } from "react";
import { Anchors, Rect } from "types/Pos";
import { MobileDrawer } from "../Drawer";

export const MenuWrapper = (props: {
  rect: Rect;
  ui: UIManager;
  anchor: Anchors;
  hide: (supress?: boolean) => void;
  children: any;
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const ref = React.useRef(null);
  // const [rect, setRect] = React.useState<Rect>(props.rect);
  const [isReady, setIsReady] = React.useState(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key == "Escape") {
        props.hide(true);
        return true;
      }
      return false;
    };
    function handleClickOutside(event: MouseEvent) {
      const checkElement = (el: HTMLElement) => {
        if (
          el.hasClass("mk-menu") ||
          el.hasClass("mk-menu-wrapper") ||
          el.hasClass("mk-modal")
        ) {
          return true;
        }
        return false;
      };
      let dom: HTMLElement = event.target as HTMLElement;
      while (!checkElement(dom) && dom.parentElement) {
        dom = dom.parentElement;
      }

      if (checkElement(dom)) {
        return;
      }
      if (ref.current && !ref.current.contains(event.target)) {
        props.hide(true);
      }
    }
    props.ui.inputManager.on("click", handleClickOutside);
    props.ui.inputManager.on("contextmenu", handleClickOutside);
    props.ui.inputManager.on("keydown", onKeyDown);
    return () => {
      props.ui.inputManager.off("click", handleClickOutside);
      props.ui.inputManager.off("contextmenu", handleClickOutside);
      props.ui.inputManager.off("keydown", onKeyDown);
    };
  }, [props.hide]);

  useEffect(() => {
    if (!isPhone(props.ui)) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0].target.getBoundingClientRect();

      // setRect((p) =>
      //   calculateBoundsBasedOnPosition(
      //     props.rect,
      //     rect,
      //     {
      //       width: window.innerWidth,
      //       height: window.innerHeight,
      //     },
      //     props.anchor
      //   )
      // );
      setIsReady(true);
    });
    if (ref.current) resizeObserver.observe(ref.current);

    return () => resizeObserver.disconnect(); // clean up
  }, [props.rect]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <div
        className={`mk-menu-wrapper ${
          !isPhone(props.ui) || isReady ? "mk-ready" : ""
        }`}
        ref={ref}
        // style={
        //   isTouchScreen(props.ui)
        //     ? {
        //         position: "absolute",
        //         left: `${rect.x}px`,
        //         top: `${rect.y}px`,
        //       }
        //     : {}
        // }
      >
        {props.children}
      </div>
    </DndContext>
  );
};

export const showMenu = (props: {
  rect: Rect;
  ui: UIManager;
  anchor: Anchors;
  win: Window;
  fc: JSX.Element;
  props?: any;
  onHide?: () => void;
  onSubmenu?: (
    openSubmenu: (offset: Rect, onHide: () => void) => MenuObject
  ) => MenuObject;
  className?: string;
  force?: boolean;
}): MenuObject => {
  const portalElement = props.win.document.createElement("div");
  const isDrawer = isPhone(props.ui) && !props.force;
  if (isDrawer) {
    portalElement.classList.add("mk-menu-mobile");
  } else {
    portalElement.classList.add("mk-menu");
  }

  props.win.document.body.appendChild(portalElement);

  let submenu: MenuObject = null;

  const hideFunction = () => {
    let hasBeenCalled = false;
    return (supress: boolean) => {
      if (props.onHide && !supress) props.onHide();
      if (submenu) submenu.hide(true);
      if (hasBeenCalled) return;
      hasBeenCalled = true;
      setTimeout(() => {
        root.unmount();
        props.win.document.body.removeChild(portalElement);
      }, 50);
    };
  };
  const hide = hideFunction();

  const root = props.ui.createRoot(portalElement);
  const updateRoot = (newProps: any) => {
    if (isDrawer) {
      root.render(
        <MobileDrawer
          fc={props.fc}
          hide={(supress?: boolean) => hide(supress)}
          newProps={newProps}
          className={classNames("mk-drawer-menu", props.className)}
        ></MobileDrawer>
      );
      return;
    }
    root.render(
      <MenuWrapper
        rect={props.rect}
        ui={props.ui}
        hide={(supress?: boolean) => hide(supress)}
        anchor={props.anchor}
      >
        {cloneElement(props.fc, {
          hide: (supress?: boolean) => hide(supress),
          onSubmenu: (
            openSubmenu: (offset: Rect, onHide: () => void) => MenuObject
          ) => {
            const menu = openSubmenu(props.rect, () => {
              if (props.onHide) {
                props.onHide();
              }
              hide(true);
            });
            if (submenu) {
              submenu.hide(true);
            }
            submenu = menu;
          },
          ...newProps,
        })}
      </MenuWrapper>
    );
  };

  updateRoot(props.props);
  if (!isDrawer) {
    portalElement.style.position = "absolute";
    portalElement.style.left = `${props.rect.x}px`;
    portalElement.style.top = `${props.rect.y}px`;

    const resizeObserver = new ResizeObserver((entries) => {
      const newPos = calculateBoundsBasedOnPosition(
        props.rect,
        entries[0].target.getBoundingClientRect(),
        {
          width: props.win.innerWidth,
          height: props.win.innerHeight,
        },
        props.anchor
      );
      portalElement.style.left = `${newPos.x}px`;
      portalElement.style.top = `${newPos.y}px`;

      // portalElement.style.height = `${newPos.height}px`;
      // portalElement.style.height = `${newPos.height}px`;
      // portalElement.style.width = `${newPos.width}px`;
    });

    // start observing a DOM node
    resizeObserver.observe(portalElement);
    // Ensure the portalElement stays within the window
    return {
      update: updateRoot,
      hide: hide,
    } as MenuObject;
  }
};
