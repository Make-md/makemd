import { DropModifiers } from "core/react/components/Navigator/SpaceTree/SpaceTreeItem";
import { Superstate } from "core/superstate/superstate";
import { TreeNode } from "core/superstate/utils/spaces";
import { Focus } from "core/types/focus";
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
  activeFocus: number;
  setActiveFocus: React.Dispatch<React.SetStateAction<number>>;
  focuses: Focus[];
  setFocuses: (paths: Focus[]) => void;
  saveActiveSpace: (path: string) => void;
  closeActiveSpace: (path: string) => void;
  modifier: DropModifiers;
  setModifier: React.Dispatch<React.SetStateAction<DropModifiers>>;
  editFocus: boolean;
  setEditFocus: React.Dispatch<React.SetStateAction<boolean>>;
};

export const NavigatorContext = createContext<NavigatorContextProps>({
  dragPaths: [],
  setDragPaths: _.noop,
  selectedPaths: [],
  setSelectedPaths: _.noop,
  activePath: null,
  setActivePath: _.noop,
  activeFocus: 0,
  setActiveFocus: _.noop,
  activeViewSpaces: [],
  focuses: [],
  setFocuses: _.noop,
  saveActiveSpace: _.noop,
  closeActiveSpace: _.noop,
  modifier: null,
  setModifier: _.noop,
  editFocus: false,
  setEditFocus: _.noop,
});

export const SidebarProvider: React.FC<
  React.PropsWithChildren<{ superstate: Superstate }>
> = (props) => {
  const [modifier, setModifier] = useState<DropModifiers>(null);
  const [dragPaths, setDragPaths] = useState<string[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<TreeNode[]>([]);
  const [activePath, setActivePath] = useState<string>(null);
  const [editFocus, setEditFocus] = useState(false);
  const [focuses, setFocuses] = useState<Focus[]>(props.superstate.focuses);

  const [activeFocus, setActiveFocus] = useState<number>(
    props.superstate.settings.currentWaypoint
  );

  const [activeViewSpaces, setActiveViewSpaces] = useState<PathState[]>(
    (props.superstate.focuses[activeFocus]?.paths ?? [])
      .map((f) => props.superstate.pathsIndex.get(f))
      .filter((f) => f)
  );

  const setActiveViewSpaceByPath = (path: string) => {
    const newWaypoint = props.superstate.focuses[activeFocus] ?? {
      sticker: "",
      name: "Waypoint",
      paths: [],
    };
    newWaypoint.paths = [...newWaypoint.paths.filter((f) => f != path), path];
    if (activeFocus > props.superstate.focuses.length) {
      props.superstate.spaceManager.saveFocuses([
        ...props.superstate.focuses,
        newWaypoint,
      ]);
    }
    const newFocuses = props.superstate.focuses.map((f, i) =>
      i == activeFocus ? newWaypoint : f
    );
    props.superstate.spaceManager.saveFocuses(newFocuses.filter((f) => f));
  };

  const closeActiveViewSpace = (path: string) => {
    const newWaypoint = props.superstate.focuses[activeFocus] ?? {
      sticker: "",
      name: "Waypoint",
      paths: [],
    };
    newWaypoint.paths = [...newWaypoint.paths.filter((f) => f != path)];
    if (activeFocus > props.superstate.focuses.length) {
      props.superstate.spaceManager.saveFocuses([
        ...props.superstate.focuses,
        newWaypoint,
      ]);
    }
    const newFocuses = props.superstate.focuses.map((f, i) =>
      i == activeFocus ? newWaypoint : f
    );
    props.superstate.spaceManager.saveFocuses(newFocuses.filter((f) => f));
  };

  const saveFocuses = (paths: Focus[]) => {
    props.superstate.spaceManager.saveFocuses(paths.filter((f) => f));
  };

  const refreshSpaces = (payload: { path: string }) => {
    if (
      props.superstate.focuses[
        props.superstate.settings.currentWaypoint
      ]?.paths?.includes(payload.path)
    ) {
      setActiveViewSpaces(
        (
          props.superstate.focuses[props.superstate.settings.currentWaypoint]
            ?.paths ?? []
        )
          .map((f) => props.superstate.pathsIndex.get(f))
          .filter((f) => f)
      );
    }
  };
  const reloadPaths = () => {
    setFocuses(props.superstate.focuses);
    const _activeFocus = props.superstate.settings.currentWaypoint;
    setActiveFocus(_activeFocus);
    setActiveViewSpaces(
      (props.superstate.focuses[_activeFocus]?.paths ?? [])
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
      "focusesChanged",
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
        "focusesChanged",
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
        activeFocus: activeFocus,
        selectedPaths: selectedPaths,
        setSelectedPaths: setSelectedPaths,
        activePath: activePath,
        setActiveFocus: setActiveFocus,
        setActivePath: setActivePath,
        activeViewSpaces,
        focuses: focuses,
        setFocuses: saveFocuses,
        saveActiveSpace: setActiveViewSpaceByPath,
        closeActiveSpace: closeActiveViewSpace,
        modifier,
        setModifier,
        editFocus: editFocus,
        setEditFocus: setEditFocus,
      }}
    >
      {props.children}
    </NavigatorContext.Provider>
  );
};
