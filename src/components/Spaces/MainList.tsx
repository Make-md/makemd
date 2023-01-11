import {
  closestCenter,
  DndContext,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { FileExplorerComponent } from "components/Spaces/TreeView/FileExplorerVirtualized";
import MakeMDPlugin from "main";
import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import * as recoilState from "recoil/pluginState";
import { SpaceSwitcher } from "./SpaceSwitcher/SpaceSwitcher";
import { TagContextList } from "./TagContextList/TagContextList";
import { useErrorBoundary } from 'preact/hooks'

export const MainList = (props: { plugin: MakeMDPlugin }) => {
  const [activeView, setActiveView] = useRecoilState(recoilState.activeView);
  const [spaces, setSpaces] = useRecoilState(recoilState.spaces);
  const [activeViewSpace, setActiveViewSpace] = useRecoilState(
    recoilState.activeViewSpace
  );
  const [error, resetError] = useErrorBoundary();
  if (error) 
  console.log(error);
  useEffect(() => {
    if (
      activeView == "space" &&
      !spaces.some((f) => f.name == activeViewSpace && f.pinned == "true")
    ) {
      setActiveView("root");
    }
  }, [spaces]);

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
      return <FileExplorerComponent plugin={props.plugin} />;
    } else if (viewType == "tags") {
      return <TagContextList plugin={props.plugin}></TagContextList>;
    } else if (viewType == "space") {
      return (
        <FileExplorerComponent plugin={props.plugin} activeSpace={space} />
      );
    }
    return <FileExplorerComponent plugin={props.plugin} />;
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
    >
      <SpaceSwitcher plugin={props.plugin}></SpaceSwitcher>
      {viewForState(activeView, activeViewSpace)}
    </DndContext>
  );
};
