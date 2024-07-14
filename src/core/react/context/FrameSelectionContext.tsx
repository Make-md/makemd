import { Superstate } from "makemd-core";
import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FrameEditorMode } from "types/mframe";
import { FrameInstanceContext } from "./FrameInstanceContext";

// Define the context type
type FrameSelectionContextType = {
  selectable: boolean;
  selected: boolean;
  selection: string[];
  select: (id: string, multi?: boolean) => void;
  selectMulti: (id: string[], multi?: boolean) => void;
  deselect: (id: string) => void;
  selectionMode: FrameEditorMode;
  isParentToSelection: boolean;
  setIsParentToSelection: (selectable: boolean) => void;
  id: string;
};

// Create the context
export const FrameSelectionContext = createContext<FrameSelectionContextType>({
  selectable: false,
  selected: false,
  selection: [],
  selectionMode: FrameEditorMode.Read,
  select: (id: string, multi?: boolean) => null,
  selectMulti: (id: string[], multi?: boolean) => null,
  deselect: (id: string) => null,
  isParentToSelection: false,
  setIsParentToSelection: (selectable: boolean) => null,
  id: "",
});

// Create the context provider component
export const FrameSelectionProvider: React.FC<
  PropsWithChildren<{
    superstate: Superstate;
    id: string;
    editMode?: FrameEditorMode;
    selected?: boolean;
  }>
> = (
  props: PropsWithChildren<{
    superstate: Superstate;
    id: string;
    editMode?: FrameEditorMode;
    selected?: boolean;
  }>
) => {
  const {
    selection: parentSelection,
    selectionMode: parentSelectionMode,
    setIsParentToSelection: setParentSelectable,
  } = useContext(FrameSelectionContext);
  const selected = useMemo(() => {
    return parentSelection.includes(props.id) || props.selected;
  }, [parentSelection, props.id, props.selected]);
  const selectionMode = useMemo(
    () => props.editMode ?? FrameEditorMode.Read,
    [props.editMode]
  );
  const { instance } = useContext(FrameInstanceContext);
  const [selection, setSelection] = useState<string[]>([]);
  const [isParentToSelection, setIsParentToSelection] = useState(false);
  const selectable = useMemo(() => {
    if (selection.length > 0) return true;
    if (isParentToSelection) return true;
    if (selected && selectionMode >= FrameEditorMode.Group) {
      return true;
    }
    if (selectionMode == FrameEditorMode.Page) {
      return true;
    }
    return false;
  }, [selected, selectionMode, selection, isParentToSelection]);
  useEffect(() => {
    const reset = (id: string) => {
      if (id != props.id) {
        setSelection([]);
        setIsParentToSelection(false);
      }
    };
    props.superstate.ui.addResetFunction(reset);

    return () => {
      props.superstate.ui.removeResetFunction(reset);
    };
  }, [setSelection, setIsParentToSelection]);

  const select = (id: string, multi?: boolean) => {
    if (selectionMode == FrameEditorMode.Read) return;
    const prev = selection;
    props.superstate.ui.resetSelection(props.id);
    if (!id) {
      setSelection([]);
      return;
    }
    if (multi) {
      setSelection((prev) => [...selection.filter((f) => f != id), id]);
      setParentSelectable(true);
    } else {
      setSelection([id]);
      setParentSelectable(true);
    }
  };
  const selectMulti = (ids: string[], multi?: boolean) => {
    if (selectionMode == FrameEditorMode.Read) return;
    const prev = selection;
    props.superstate.ui.resetSelection(props.id);
    if (multi) {
      setSelection((prev) => [
        ...selection.filter((f) => !ids.some((g) => g == f)),
        ...ids,
      ]);
      setParentSelectable(true);
    } else {
      setSelection([...ids]);
      setParentSelectable(true);
    }
  };
  const deselect = (id: string) => {
    if (selectionMode == FrameEditorMode.Read) return;

    setSelection((prev) => prev.filter((f) => f != id));
  };

  return (
    <FrameSelectionContext.Provider
      value={{
        selectable,
        selected,
        selection,
        selectionMode,
        select,
        selectMulti,
        isParentToSelection,
        deselect,
        setIsParentToSelection,
        id: props.id,
      }}
    >
      {props.children}
    </FrameSelectionContext.Provider>
  );
};
