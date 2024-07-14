import { DropModifiers } from "core/react/components/Navigator/SpaceTree/SpaceTreeItem";
import { Superstate } from "core/superstate/superstate";
import { TreeNode } from "core/superstate/utils/spaces";
import { Area } from "core/types/area";
import { PathState } from "core/types/superstate";
import _ from "lodash";
import React, { createContext, useEffect, useState } from "react";

type NavigatorContextProps = {
  dragPaths: string[];
  setDragPaths: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPaths: TreeNode[];
  setSelectedPaths: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  activePath: string;
  setActivePath: React.Dispatch<React.SetStateAction<string>>;
  activeViewSpaces: PathState[];
  activeArea: number;
  setActiveArea: React.Dispatch<React.SetStateAction<number>>;
  waypoints: Area[];
  setWaypoints: (paths: Area[]) => void;
  saveActiveSpace: (path: string) => void;
  closeActiveSpace: (path: string) => void;
  modifier: DropModifiers;
  setModifier: React.Dispatch<React.SetStateAction<DropModifiers>>;
  editArea: boolean;
  setEditArea: React.Dispatch<React.SetStateAction<boolean>>;
};

export const NavigatorContext = createContext<NavigatorContextProps>({
  dragPaths: [],
  setDragPaths: _.noop,
  selectedPaths: [],
  setSelectedPaths: _.noop,
  activePath: null,
  setActivePath: _.noop,
  activeArea: 0,
  setActiveArea: _.noop,
  activeViewSpaces: [],
  waypoints: [],
  setWaypoints: _.noop,
  saveActiveSpace: _.noop,
  closeActiveSpace: _.noop,
  modifier: null,
  setModifier: _.noop,
  editArea: false,
  setEditArea: _.noop,
});

export const SidebarProvider: React.FC<
  React.PropsWithChildren<{ superstate: Superstate }>
> = (props) => {
  const [modifier, setModifier] = useState<DropModifiers>(null);
  const [dragPaths, setDragPaths] = useState<string[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<TreeNode[]>([]);
  const [activePath, setActivePath] = useState<string>(null);
  const [editArea, setEditArea] = useState(false);
  const [waypoints, setWaypoints] = useState<Area[]>(
    props.superstate.waypoints
  );

  const [activeArea, setActiveArea] = useState<number>(
    props.superstate.settings.currentWaypoint
  );

  const [activeViewSpaces, setActiveViewSpaces] = useState<PathState[]>(
    (props.superstate.waypoints[activeArea]?.paths ?? [])
      .map((f) => props.superstate.pathsIndex.get(f))
      .filter((f) => f)
  );

  const setActiveViewSpaceByPath = (path: string) => {
    const newWaypoint = props.superstate.waypoints[activeArea] ?? {
      sticker: "",
      name: "Waypoint",
      paths: [],
    };
    newWaypoint.paths = [...newWaypoint.paths.filter((f) => f != path), path];
    if (activeArea > props.superstate.waypoints.length) {
      props.superstate.spaceManager.saveWaypoints([
        ...props.superstate.waypoints,
        newWaypoint,
      ]);
    }
    const newWaypoints = props.superstate.waypoints.map((f, i) =>
      i == activeArea ? newWaypoint : f
    );
    props.superstate.spaceManager.saveWaypoints(newWaypoints.filter((f) => f));
  };

  const closeActiveViewSpace = (path: string) => {
    const newWaypoint = props.superstate.waypoints[activeArea] ?? {
      sticker: "",
      name: "Waypoint",
      paths: [],
    };
    newWaypoint.paths = [...newWaypoint.paths.filter((f) => f != path)];
    if (activeArea > props.superstate.waypoints.length) {
      props.superstate.spaceManager.saveWaypoints([
        ...props.superstate.waypoints,
        newWaypoint,
      ]);
    }
    const newWaypoints = props.superstate.waypoints.map((f, i) =>
      i == activeArea ? newWaypoint : f
    );
    props.superstate.spaceManager.saveWaypoints(newWaypoints.filter((f) => f));
  };

  const saveWaypoints = (paths: Area[]) => {
    props.superstate.spaceManager.saveWaypoints(paths.filter((f) => f));
  };

  const refreshSpaces = (payload: { path: string }) => {
    if (
      props.superstate.waypoints[
        props.superstate.settings.currentWaypoint
      ]?.paths?.includes(payload.path)
    ) {
      setActiveViewSpaces(
        (
          props.superstate.waypoints[props.superstate.settings.currentWaypoint]
            ?.paths ?? []
        ).map((f) => props.superstate.pathsIndex.get(f))
      );
    }
  };
  const reloadPaths = () => {
    setWaypoints(props.superstate.waypoints);
    const _activeArea = props.superstate.settings.currentWaypoint;
    setActiveArea(_activeArea);
    setActiveViewSpaces(
      (props.superstate.waypoints[_activeArea]?.paths ?? [])
        .map((f) => props.superstate.pathsIndex.get(f))
        .filter((f) => f)
    );
  };

  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      refreshSpaces
    );
    props.superstate.eventsDispatcher.addListener(
      "settingsChanged",
      reloadPaths
    );
    props.superstate.eventsDispatcher.addListener(
      "superstateUpdated",
      reloadPaths
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        refreshSpaces
      );
      props.superstate.eventsDispatcher.removeListener(
        "settingsChanged",
        reloadPaths
      );
      props.superstate.eventsDispatcher.removeListener(
        "superstateUpdated",
        reloadPaths
      );
    };
  }, []);
  return (
    <NavigatorContext.Provider
      value={{
        dragPaths,
        setDragPaths,
        activeArea,
        selectedPaths: selectedPaths,
        setSelectedPaths: setSelectedPaths,
        activePath: activePath,
        setActiveArea: setActiveArea,
        setActivePath: setActivePath,
        activeViewSpaces,
        waypoints,
        setWaypoints: saveWaypoints,
        saveActiveSpace: setActiveViewSpaceByPath,
        closeActiveSpace: closeActiveViewSpace,
        modifier,
        setModifier,
        editArea,
        setEditArea,
      }}
    >
      {props.children}
    </NavigatorContext.Provider>
  );
};
