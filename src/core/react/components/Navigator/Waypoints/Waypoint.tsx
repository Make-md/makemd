import { UniqueIdentifier } from "@dnd-kit/core";
import classNames from "classnames";
import { triggerSpaceMenu } from "core/react/components/UI/Menus/navigator/spaceContextMenu";
import { NavigatorContext } from "core/react/context/SidebarContext";
import { Superstate } from "core/superstate/superstate";
import { PathState } from "core/types/superstate";
import React, { forwardRef, useContext, useRef } from "react";
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
  pin: PathState;
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
      setDragPaths,
      activeViewSpace,
      activePath: activePath,
      saveActiveSpace,
      setModifier,
    } = useContext(NavigatorContext);
    const onDragStarted = (e: React.DragEvent<HTMLDivElement>) => {
      if (dragStart && pin) {
        dragStart(pin.path);
        setDragPaths([pin.path]);
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
      onDragEnded: onDragEnded,
      onDrop: onDragEnded,
    };
    return pin ? (
      <div
        ref={innerRef}
        className="mk-waypoint"
        onClick={(e) => {
          if (e.metaKey) superstate.ui.openPath(pin.path, false);
          saveActiveSpace(pin.path);
        }}
        onContextMenu={(e) =>
          triggerSpaceMenu(
            superstate,
            pin,
            e,
            activePath,
            "spaces://$waypoints"
          )
        }
        onDragOver={(e) => {
          e.preventDefault();
          setModifier(eventToModifier(e));
          if (!innerRef.current) return;
          const rect = innerRef.current.getBoundingClientRect();

          const x = e.clientX - rect.left; //x position within the element.

          if (dragOver && pin) dragOver(pin.path, x);
        }}
        {...innerProps}
      >
        <div
          ref={ref}
          className={classNames(
            "mk-waypoints-item",
            "clickable-icon",
            "nav-action-button",
            (activeViewSpace?.path == pin?.path || highlighted) && "mk-active",
            indicator && "mk-indicator",
            clone && "mk-clone",
            ghost && "mk-ghost"
          )}
          dangerouslySetInnerHTML={{
            __html: superstate.ui.getSticker(pin.label?.sticker),
          }}
          style={{
            ...style,
            ...(pin.label?.color?.length > 0
              ? ({
                  "--label-color": `${pin.label?.color}`,
                  "--icon-color": `var(--text-normal)`,
                } as React.CSSProperties)
              : ({
                  "--icon-color": `var(--text-muted)`,
                } as React.CSSProperties)),
            ...{ pointerEvents: "none" },
          }}
        ></div>
      </div>
    ) : (
      <div ref={innerRef} className="mk-waypoint">
        <div
          ref={ref}
          className={classNames(
            "mk-waypoints-item",
            "clickable-icon",
            "nav-action-button",
            highlighted && "mk-active",
            indicator && "mk-indicator",
            clone && "mk-clone",
            ghost && "mk-ghost"
          )}
          style={{
            ...style,
            ...{ pointerEvents: "none" },
          }}
        ></div>
      </div>
    );
  }
);

PinnedSpace.displayName = "PinnedSpace";
