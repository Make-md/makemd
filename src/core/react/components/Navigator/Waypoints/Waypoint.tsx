import { UniqueIdentifier } from "@dnd-kit/core";
import classNames from "classnames";
import { NavigatorContext } from "core/react/context/SidebarContext";
import { Superstate } from "core/superstate/superstate";
import { Area } from "core/types/area";
import React, { forwardRef, useContext, useRef } from "react";
import { windowFromDocument } from "utils/dom";
import { SelectOption, defaultMenu } from "../../UI/Menus/menu/SelectionMenu";
import { eventToModifier } from "../SpaceTree/SpaceTreeItem";

export interface SortablePinnedSpaceItemProps extends PinnedSpaceProps {
  id: UniqueIdentifier;
}

export const SortablePinnedSpaceItem = ({
  id,
  index,
  ...props
}: SortablePinnedSpaceItemProps) => {
  return <PinnedSpace index={index} {...props} />;
};

type PinnedSpaceProps = {
  superstate: Superstate;
  index: number;
  pin: Area;
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

export const PinnedSpace = forwardRef<HTMLDivElement, PinnedSpaceProps>(
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
    const innerRef = useRef(null);
    const {
      activePath: activePath,
      waypoints,
      setEditArea,
      setWaypoints,
      setModifier,
    } = useContext(NavigatorContext);
    const onDragStarted = (e: React.DragEvent<HTMLDivElement>) => {
      if (dragStart && pin) {
        dragStart(index);
      }
    };

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
    return pin ? (
      <div
        onContextMenu={(e) => {
          const menuOptions: SelectOption[] = [
            {
              name: "Edit Area",
              icon: "ui//edit",
              onClick: (e) => {
                setEditArea(true);
              },
            },
            {
              name: "Close",
              icon: "ui//close",
              value: "close",
              onClick: () => {
                setWaypoints(waypoints.filter((f, i) => i != index));
                superstate.saveSettings();
              },
            },
          ];
          superstate.ui.openMenu(
            (e.target as HTMLElement).getBoundingClientRect(),
            defaultMenu(superstate.ui, menuOptions),
            windowFromDocument(e.view.document)
          );
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
            "mk-waypoints-item",
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
            setWaypoints([
              ...waypoints,
              { sticker: "ui//spaces", name: "Waypoint", paths: [] },
            ]);
            superstate.saveSettings();
          }}
          className={classNames(
            "mk-waypoints-item",
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

PinnedSpace.displayName = "PinnedSpace";
