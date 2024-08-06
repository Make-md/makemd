import { MobileDrawer } from "core/react/components/UI/Drawer";
import { ModalWrapper } from "core/react/components/UI/Modals/modalWrapper";
import { isTouchScreen } from "core/utils/ui/screen";
import React, { cloneElement } from "react";
import { Root } from "react-dom/client";
import { ObsidianUI } from "./ui";

export const showModal = (props: {
  ui: ObsidianUI;
  fc: JSX.Element;
  title?: string;
  isPalette?: boolean;
  className?: string;
  props?: any;
  win?: Window;
}) => {
  const portalElement = props.win.document.createElement("div");

  if (isTouchScreen(props.ui.manager)) {
    portalElement.classList.add("mk-modal-wrapper-mobile");
  } else {
    portalElement.classList.add("mk-modal-wrapper");
  }

  props.win.document.body.appendChild(portalElement);
  const hideFunction = (root: Root) => {
    let hasBeenCalled = false;
    return () => {
      if (hasBeenCalled) return;
      root.unmount();
      props.win.document.body.removeChild(portalElement);
      hasBeenCalled = true;
    };
  };

  const root = props.ui.createRoot(portalElement);
  const hide = hideFunction(root);
  const updateRoot = (newProps: any) => {
    if (isTouchScreen(props.ui.manager)) {
      root.render(
        <MobileDrawer
          fc={props.fc}
          hide={() => hide()}
          newProps={newProps}
          className={`${
            props.isPalette ? "mk-drawer-palette" : "mk-drawer-modal"
          } ${props.className ? props.className : ""}`}
        />
      );
      return;
    }
    root.render(
      <ModalWrapper
        ui={props.ui.manager}
        hide={() => hide()}
        className={`${props.isPalette ? "mk-palette" : "mk-modal"} ${
          props.className ? props.className : ""
        }`}
      >
        {!props.isPalette && (
          <div className="mk-modal-header">
            {props.title && <div className="mk-modal-title">{props.title}</div>}
            <div
              className="mk-x-small"
              dangerouslySetInnerHTML={{
                __html: props.ui.getSticker("ui//close"),
              }}
              onClick={() => hide()}
            ></div>
          </div>
        )}

        {cloneElement(props.fc, {
          hide: () => hide(),
          ...newProps,
        })}
      </ModalWrapper>
    );
  };
  updateRoot(props.props);
  return {
    hide: hide,
    update: updateRoot,
  };
};
