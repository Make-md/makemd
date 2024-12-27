import { UniqueIdentifier } from "@dnd-kit/core";
import classNames from "classnames";
import { NavigatorContext } from "core/react/context/SidebarContext";
import useLongPress from "core/react/hooks/useLongPress";
import { SelectOption, Superstate } from "makemd-core";
import React, { forwardRef, useContext, useRef } from "react";
import { Focus } from "shared/types/focus";
import { Rect } from "shared/types/Pos";
import { windowFromDocument } from "shared/utils/dom";
import { defaultMenu } from "../../UI/Menus/menu/SelectionMenu";
import { eventToModifier } from "../SpaceTree/SpaceTreeItem";

export interface SortablePinnedSpaceItemProps extends PinnedSpaceProps {
  id: UniqueIdentifier;
}

export const SortablePinnedSpaceItem = ({
  id,
  index,
  ...props
}: SortablePinnedSpaceItemProps) => {
  return <FocusItem index={index} {...props} />;
};

type PinnedSpaceProps = {
  superstate: Superstate;
  index: number;
  pin: Focus;
  clone?: boolean;
  ghost?: boolean;
  style?: React.CSSProperties;
  highlighted: boolean;
  indicator?: boolean;
  dragStart?: (id: UniqueIdentifier) => void;
  dragOver?: (id: UniqueIdentifier, x: number) => void;
  dragEnded?: () => void;
  dragActive?: boolean;
};

export const FocusItem = forwardRef<HTMLDivElement, PinnedSpaceProps>(
  (
    {
      pin,
      indicator,
      highlighted,
      superstate,
      style,
      clone,
      ghost,
      dragStart,
      dragOver,
      dragEnded,
      index,
    },
    ref
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const {
      activePath: activePath,
      focuses: focuses,
      setEditFocus: setEditFocus,
      setFocuses: setFocuses,
      setModifier,
    } = useContext(NavigatorContext);
    const onDragStarted = (e: React.DragEvent<HTMLDivElement>) => {
      if (dragStart && pin) {
        dragStart(index);
      }
    };
    const onLongPress = () => {
      const rect = innerRef.current.getBoundingClientRect();
      openContextMenu(rect);
    };
    useLongPress(innerRef, onLongPress);
    const onDragEnded = (e: React.DragEvent<HTMLDivElement>) => {
      if (dragEnded) {
        dragEnded();
      }
    };
    const innerProps = {
      draggable: true,
      onDragStart: onDragStarted,
      onDragEnd: onDragEnded,
      onDrop: onDragEnded,
    };

    const openContextMenu = (rect: Rect) => {
      const menuOptions: SelectOption[] = [
        {
          name: "Edit Focus",
          icon: "ui//edit",
          onClick: (e) => {
            setEditFocus(true);
          },
        },
        {
          name: "Close",
          icon: "ui//close",
          value: "close",
          onClick: () => {
            setFocuses(focuses.filter((f, i) => i != index));
            superstate.saveSettings();
          },
        },
      ];
      superstate.ui.openMenu(
        rect,
        defaultMenu(superstate.ui, menuOptions),
        windowFromDocument(innerRef.current.ownerDocument)
      );
    };
    return pin ? (
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          openContextMenu(rect);
        }}
        ref={innerRef}
        className="mk-waypoint"
        onClick={(e) => {
          superstate.settings.currentWaypoint = index;
          superstate.saveSettings();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setModifier(eventToModifier(e));
          if (!innerRef.current) return;
          const rect = innerRef.current.getBoundingClientRect();

          const x = e.clientX - rect.left; //x position within the element.

          if (dragOver && pin) dragOver(index, x);
        }}
        {...innerProps}
      >
        <div
          ref={ref}
          aria-label={pin.name}
          className={classNames(
            "mk-focuses-item",
            "clickable-icon",
            "nav-action-button",
            (superstate.settings.currentWaypoint == index || highlighted) &&
              "mk-active",
            indicator && "mk-indicator",
            clone && "mk-clone",
            ghost && "mk-ghost"
          )}
          style={{
            ...style,
          }}
          dangerouslySetInnerHTML={{
            __html: superstate.ui.getSticker(pin.sticker),
          }}
        ></div>
      </div>
    ) : (
      <div ref={innerRef} className="mk-waypoint">
        <div
          ref={ref}
          onClick={(e) => {
            setFocuses([
              ...focuses,
              { sticker: "ui//spaces", name: "Waypoint", paths: [] },
            ]);
            superstate.saveSettings();
          }}
          className={classNames(
            "mk-focuses-item",
            "clickable-icon",
            "nav-action-button",
            highlighted && "mk-active",
            indicator && "mk-indicator",
            clone && "mk-clone",
            ghost && "mk-ghost"
          )}
        ></div>
      </div>
    );
  }
);

FocusItem.displayName = "PinnedSpace";
