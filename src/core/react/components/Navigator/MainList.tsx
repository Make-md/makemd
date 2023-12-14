import {
  closestCenter,
  DndContext,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SpaceTreeComponent } from "core/react/components/Navigator/SpaceTree/SpaceTreeView";
import { Superstate } from "core/superstate/superstate";
import { useErrorBoundary } from "preact/hooks";
import React, { useEffect } from "react";
import { MainMenu } from "./MainMenu";
import { SpaceSwitcher } from "./Waypoints/Waypoints";

export const MainList = (props: { superstate: Superstate }) => {
  const [indexing, setIndexing] = React.useState(false);
  const [error, resetError] = useErrorBoundary();
  if (error) console.log(error);

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
  useEffect(() => {
    const reindex = async () => {
      setIndexing(true);
    };
    const finishedIndex = async () => {
      setIndexing(false);
    };
    props.superstate.eventsDispatcher.addListener("superstateReindex", reindex);
    props.superstate.eventsDispatcher.addListener(
      "superstateUpdated",
      finishedIndex
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "superstateReindex",
        reindex
      );
      props.superstate.eventsDispatcher.removeListener(
        "superstateUpdated",
        finishedIndex
      );
    };
  }, []);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
    >
      <div className="mk-progress-bar">
        {indexing && <div className="mk-progress-bar-value"></div>}
      </div>
      <SpaceSwitcher superstate={props.superstate}></SpaceSwitcher>
      {props.superstate.ui.getScreenType() != "mobile" && (
        <MainMenu superstate={props.superstate}></MainMenu>
      )}
      <SpaceTreeComponent superstate={props.superstate} />
    </DndContext>
  );
};
