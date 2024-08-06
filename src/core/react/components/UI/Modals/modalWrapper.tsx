import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { UIManager } from "makemd-core";
import React, { useEffect, useTransition } from "react";
import { Transition } from "react-transition-group";

export const ModalWrapper = (props: {
  ui: UIManager;
  hide: () => void;
  children: any;
  className?: string;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "_modal",
    data: { id: "_modal" },
  });

  useDndMonitor({
    onDragOver: (event) => {
      if (isOver) {
        props.hide();
      }
    },
  });

  return (
    <div className={`mk-modal-container`} ref={setNodeRef}>
      <ModalInner ui={props.ui} hide={props.hide} className={props.className}>
        {props.children}
      </ModalInner>
    </div>
  );
};

export const ModalInner = (
  props: React.PropsWithChildren<{
    ui: UIManager;
    hide: () => void;
    className: string;
  }>
) => {
  const ref = React.useRef(null);
  const { setNodeRef, isOver } = useDroppable({
    id: "_modalInner",
    data: { id: "_modalInner" },
  });
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    startTransition(() => null);
  }, []);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key == "Escape") {
        props.hide();
        return true;
      }
      return false;
    };
    function handleClickOutside(event: MouseEvent) {
      // Check if the click is inside the menu
      const checkElement = (el: HTMLElement) => {
        if (
          el.hasClass("mk-menu") ||
          el.hasClass("mk-menu-mobile") ||
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
        props.hide();
      }
    }
    props.ui.inputManager.on("mousedown", handleClickOutside);
    props.ui.inputManager.on("contextmenu", handleClickOutside);
    props.ui.inputManager.on("keydown", onKeyDown);
    return () => {
      props.ui.inputManager.off("mousedown", handleClickOutside);
      props.ui.inputManager.off("contextmenu", handleClickOutside);
      props.ui.inputManager.off("keydown", onKeyDown);
    };
  }, [props.hide]);
  const transitionStyles = {
    entering: { opacity: 1 },
    entered: { opacity: 1 },
    exiting: { opacity: 0 },
    exited: { opacity: 0 },
    unmounted: { opacity: 0 },
  };
  return (
    <Transition timeout={300} appear={true} in={true} nodeRef={ref}>
      {(state) => (
        <div
          className={`${props.className}`}
          style={{
            transition: `all 100ms ease-in`,
            transform: "translateY(0px)",
            ...transitionStyles[state],
          }}
          ref={(el) => {
            setNodeRef(el);
            ref.current = el;
          }}
        >
          {props.children}
        </div>
      )}
    </Transition>
  );
};
