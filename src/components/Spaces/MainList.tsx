import {
  closestCenter,
  DndContext,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FileExplorerComponent } from "components/Spaces/TreeView/FileExplorerVirtualized";
import MakeMDPlugin from "main";
import { useErrorBoundary } from "preact/hooks";
import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";
import { eventTypes, SpaceChangeEvent } from "types/types";
import { platformIsMobile } from "utils/file";
import { uiIconSet } from "utils/icons";
import { MainMenu } from "./MainMenu";
import { SpaceSwitcher } from "./SpaceSwitcher/SpaceSwitcher";
import { TagContextList } from "./TagContextList/TagContextList";

export const MainList = (props: { plugin: MakeMDPlugin }) => {
  const [activeView, setActiveView] = useRecoilState(recoilState.activeView);
  const [spaces, setSpaces] = useState(props.plugin.index.allSpaces());
  const [activeViewSpace, setActiveViewSpace] = useRecoilState(
    recoilState.activeViewSpace
  );
  const [syncState, setSyncState] = useState(props.plugin.index.syncStatus);
  const [error, resetError] = useErrorBoundary();
  if (error) console.log(error);
  useEffect(() => {
    if (
      activeView == "space" &&
      !spaces.some(
        (f) =>
          f.name == activeViewSpace &&
          (f.pinned == "true" || f.pinned == "pinned")
      )
    ) {
      setActiveView("root");
    }
  }, [spaces]);
  const reloadSync = (evt: SpaceChangeEvent) => {
    if (evt.detail.type == "sync") {
      setSyncState(props.plugin.index.syncStatus);
    }
  };
  useEffect(() => {
    window.addEventListener(eventTypes.spacesChange, reloadSync);
    return () => {
      window.removeEventListener(eventTypes.spacesChange, reloadSync);
    };
  }, [reloadSync]);

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
    })
  );
  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  const viewForState = (viewType: string, space: string) => {
    if (viewType == "root") {
      return (
        <FileExplorerComponent viewType={viewType} plugin={props.plugin} />
      );
    } else if (viewType == "tags") {
      return <TagContextList plugin={props.plugin}></TagContextList>;
    } else if (viewType == "space") {
      return (
        <FileExplorerComponent
          plugin={props.plugin}
          viewType={viewType}
          activeSpace={space}
        />
      );
    } else if (viewType == "all") {
      return (
        <FileExplorerComponent plugin={props.plugin} viewType={viewType} />
      );
    }
    return <FileExplorerComponent plugin={props.plugin} viewType={"root"} />;
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
    >
      {!platformIsMobile() ? (
        props.plugin.settings.spacesCompactMode ? (
          <MainMenu plugin={props.plugin} compactMode={true}></MainMenu>
        ) : (
          <SpaceSwitcher plugin={props.plugin}></SpaceSwitcher>
        )
      ) : (
        <SpaceSwitcher plugin={props.plugin}></SpaceSwitcher>
      )}
      {syncState == 1 && (
        <div className="mk-sync-status">
          <div
            className={`mk-icon-xsmall`}
            dangerouslySetInnerHTML={{
              __html: uiIconSet["mk-ui-sync"],
            }}
          ></div>
          Waiting for Spaces to Sync...
        </div>
      )}
      {viewForState(activeView, activeViewSpace)}
    </DndContext>
  );
};
