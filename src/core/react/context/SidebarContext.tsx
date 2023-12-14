import { DropModifiers } from "core/react/components/Navigator/SpaceTree/SpaceTreeItem";
import { Superstate } from "core/superstate/superstate";
import { TreeNode } from "core/superstate/utils/spaces";
import { SpaceDefGroup } from "core/types/space";
import { PathState, SpaceState } from "core/types/superstate";
import { pathByDef } from "core/utils/spaces/query";
import _ from "lodash";
import React, { createContext, useEffect, useMemo, useState } from "react";

type NavigatorContextProps = {
  dragPaths: string[];
  setDragPaths: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPaths: TreeNode[];
  setSelectedPaths: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  activePath: string;
  setActivePath: React.Dispatch<React.SetStateAction<string>>;
  activeViewSpace: SpaceState;

  waypoints: PathState[];
  setWaypoints: (paths: string[]) => void;
  saveActiveSpace: (path: string) => void;
  activeQuery: SpaceDefGroup[];
  setActiveQuery: React.Dispatch<React.SetStateAction<SpaceDefGroup[]>>;
  queryResults: string[];
  queryMode: boolean;
  setQueryMode: React.Dispatch<React.SetStateAction<boolean>>;
  modifier: DropModifiers;
  setModifier: React.Dispatch<React.SetStateAction<DropModifiers>>;
};

export const NavigatorContext = createContext<NavigatorContextProps>({
  dragPaths: [],
  setDragPaths: _.noop,
  selectedPaths: [],
  setSelectedPaths: _.noop,
  activePath: null,
  setActivePath: _.noop,
  activeViewSpace: null,
  waypoints: [],
  setWaypoints: _.noop,
  saveActiveSpace: _.noop,
  activeQuery: [],
  setActiveQuery: _.noop,
  queryResults: [],
  queryMode: false,
  setQueryMode: _.noop,
  modifier: null,
  setModifier: _.noop,
});

export const SidebarProvider: React.FC<
  React.PropsWithChildren<{ superstate: Superstate }>
> = (props) => {
  const [modifier, setModifier] = useState<DropModifiers>(null);
  const [dragPaths, setDragPaths] = useState<string[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<TreeNode[]>([]);
  const [activePath, setActivePath] = useState<string>(null);
  const [activeQuery, setActiveQuery] = useState<SpaceDefGroup[]>([]);
  const [queryMode, setQueryMode] = useState<boolean>(false);

  const [waypoints, setWaypoints] = useState<PathState[]>([]);

  const queryResults = useMemo(() => {
    const paths: string[] = [];
    props.superstate.pathsIndex.forEach((f) => {
      if (!f.hidden && pathByDef(activeQuery, f)) {
        paths.push(f.path);
      }
    });
    return paths;
  }, [activeQuery]);

  const [activeViewSpace, setActiveViewSpace] = useState<SpaceState>();

  const setActiveViewSpaceByPath = (path: string) => {
    setQueryMode(false);
    props.superstate.settings.activeView = path;
    props.superstate.saveSettings();
  };
  const saveWaypoints = (paths: string[]) => {
    props.superstate.settings.waypoints = paths;
    props.superstate.saveSettings();
  };
  const refreshSpaces = (payload: { path: string }) => {
    if (
      [...waypoints, props.superstate.settings.activeView].includes(
        payload.path
      )
    ) {
      setWaypoints(
        props.superstate.settings.waypoints
          .map((f) => props.superstate.pathsIndex.get(f))
          .filter((f) => f)
      );
      setActiveViewSpace(
        props.superstate.spacesIndex.get(props.superstate.settings.activeView)
      );
    }
  };
  const reloadPaths = () => {
    setWaypoints(
      props.superstate.settings.waypoints
        .map((f) => props.superstate.pathsIndex.get(f))
        .filter((f) => f)
    );
    setActiveViewSpace(
      props.superstate.spacesIndex.get(props.superstate.settings.activeView)
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
        selectedPaths: selectedPaths,
        setSelectedPaths: setSelectedPaths,
        activePath: activePath,
        setActivePath: setActivePath,
        activeViewSpace,
        activeQuery,
        setActiveQuery,
        waypoints,
        setWaypoints: saveWaypoints,
        saveActiveSpace: setActiveViewSpaceByPath,
        queryResults,
        queryMode,
        setQueryMode,
        modifier,
        setModifier,
      }}
    >
      {props.children}
    </NavigatorContext.Provider>
  );
};
