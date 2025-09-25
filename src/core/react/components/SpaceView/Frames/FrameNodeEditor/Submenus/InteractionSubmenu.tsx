import React, { useRef } from "react";
import { windowFromDocument } from "shared/utils/dom";
import { ButtonSubmenu } from "./ButtonSubmenu";
import { HoverSubmenuProps } from "./HoverSubmenuProps";
import { StyleSubmenu } from "./StyleSubmenu";
import { TextSubmenu } from "./TextSubmenu";

export const InteractionSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue, savePropValue, updateNode } = props;
  const buttonConfigRef = useRef<any>(null);
  const [showHoverStyles, setShowHoverStyles] = React.useState(false);
  const [showHoverTypography, setShowHoverTypography] = React.useState(false);

  const showClickActionMenu = (e: React.MouseEvent) => {
    const buttonElement = e.currentTarget as HTMLElement;

    // The ButtonSubmenu will handle setting both interactions.onClick and actions.onClick
    const updateNodeForOnClick = (node: any, updates: any) => {
      // The ButtonSubmenu already handles this properly
      if (updates.interactions || updates.actions) {
        // Pass the updates through to the actual updateNode function
        // This should update the FrameNode properly
        updateNode(selectedNode, updates);
      }
    };

    buttonConfigRef.current = props.superstate.ui.openCustomMenu(
      buttonElement.getBoundingClientRect(),
      <ButtonSubmenu
        superstate={props.superstate}
        node={selectedNode}
        state={props.state}
        path={props.pathState.path}
        updateNode={updateNodeForOnClick}
        propName="onClick"
        propLabel="When clicked, run command"
      />,
      {
        superstate: props.superstate,
        node: selectedNode,
        state: props.state,
        updateNode: updateNodeForOnClick,
      },
      windowFromDocument(buttonElement.ownerDocument),
      "bottom"
    );
  };

  const showHoverEffectMenu = (e: React.MouseEvent) => {
    setShowHoverStyles(true);
  };

  const showHoverTypographyMenu = (e: React.MouseEvent) => {
    setShowHoverTypography(true);
  };

  // If showing hover styles, render the StyleSubmenu with hover state
  if (showHoverStyles) {
    return (
      <>
        <StyleSubmenu
          {...props}
          exitMenu={() => setShowHoverStyles(false)}
          styleState="hover"
        />
      </>
    );
  }

  // If showing hover typography, render the TextSubmenu with hover state
  if (showHoverTypography) {
    return (
      <>
        <TextSubmenu
          {...props}
          exitMenu={() => setShowHoverTypography(false)}
          styleState="hover"
        />
      </>
    );
  }

  return (
    <>
      <div
        className="mk-editor-frame-node-button-back"
        aria-label="Back"
        onMouseDown={(e) => {
          props.exitMenu(e);
        }}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//arrow-left"),
        }}
      ></div>
      <div className="mk-frame-submenu-label">Click</div>

      <div
        className="mk-editor-frame-node-button"
        aria-label="Click Action"
        onClick={(e) => showClickActionMenu(e)}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//mouse-pointer-click"),
          }}
        ></div>
      </div>

      <div className="mk-divider"></div>

      <div className="mk-frame-submenu-label">Hover</div>

      <div
        className="mk-editor-frame-node-button"
        aria-label="Hover Style"
        onClick={(e) => showHoverEffectMenu(e)}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//paintbrush"),
          }}
        ></div>
      </div>

      {selectedNode.type === "text" && (
        <div
          className="mk-editor-frame-node-button"
          aria-label="Hover Typography"
          onClick={(e) => showHoverTypographyMenu(e)}
        >
          <div
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//type"),
            }}
          ></div>
        </div>
      )}
    </>
  );
};
