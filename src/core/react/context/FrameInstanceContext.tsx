import { Box } from "@air/react-drag-to-select";
import { applyPropsToState } from "core/utils/frames/ast";
import {
  executableChanged,
  stateChangedForProps,
} from "core/utils/frames/frame";
import { executeTreeNode } from "core/utils/frames/runner";
import { renameKey } from "core/utils/objects";
import _, { isEqual, uniqueId } from "lodash";
import { Superstate } from "makemd-core";
import React, {
  MutableRefObject,
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FrameRunInstance, FrameState, StyleAst } from "shared/types/frameExec";
import { FrameTreeProp } from "shared/types/mframe";
import { Edges } from "shared/types/Pos";
import { FramesEditorRootContext } from "./FrameEditorRootContext";
import { FrameRootContext } from "./FrameRootContext";

// Define the context type
type FrameInstanceType = {
  id: string;
  hoverNode: { id: string; node: string; direction: Edges };
  setHoverNode: (node: { id: string; node: string; direction: Edges }) => void;
  selectableNodeBounds: MutableRefObject<Record<string, Box>>;
  runRoot: () => void;
  instance: FrameRunInstance;
  saveState: (state: FrameState, instance: FrameRunInstance) => void;
  fastSaveState: (state: FrameState) => void;
  linkedProps: string[];
};

// Create the context
export const FrameInstanceContext = createContext<FrameInstanceType>({
  id: "",
  hoverNode: { id: null, node: "", direction: null },
  setHoverNode: (node: { node: string; direction: Edges }) => null,
  selectableNodeBounds: { current: {} },
  runRoot: () => null,
  instance: null,
  saveState: (state: FrameState, instance: FrameRunInstance) => null,
  fastSaveState: (state: FrameState) => null,
  linkedProps: [],
});

// Create the context provider component
export const FrameInstanceProvider: React.FC<
  PropsWithChildren<{
    id: string;
    superstate: Superstate;
    props?: FrameTreeProp;
    contexts?: FrameTreeProp;
    propSetters?: {
      [key: string]: (value: any) => void;
    };
    editable: boolean;
  }>
> = (
  props: PropsWithChildren<{
    id: string;
    superstate: Superstate;
    props?: FrameTreeProp;
    contexts?: FrameTreeProp;
    propSetters?: {
      [key: string]: (value: any) => void;
    };
    editable: boolean;
  }>
) => {
  const [hoverNode, setHoverNode] = useState(null);
  const [instance, setInstance] = useState<FrameRunInstance>({
    state: {},
    id: null,
    root: null,
    exec: null,
    slides: {},
    contexts: {},
  });
  const [rootProps, setRootProps] = useState<FrameTreeProp>(props.props);
  useEffect(() => {
    setRootProps((p) => {
      if (_.isEqual(p, props.props)) return p;
      return props.props;
    });
  }, [props.props]);
  const { selectedSlide: _selectedSlide } = useContext(FramesEditorRootContext);
  const selectedSlide = props.editable ? _selectedSlide : null;
  const { root: editableRoot } = useContext(FramesEditorRootContext);
  const { root: nonEditableRoot, path } = useContext(FrameRootContext);
  const root = useMemo(
    () => (props.editable ? editableRoot : nonEditableRoot),
    [props.editable, editableRoot, nonEditableRoot]
  );

  const activeRunID = useRef(null);
  const currentRoot = useRef(null);
  const linkedProps = useMemo(() => {
    return Object.keys(props.propSetters || {});
  }, [props.propSetters]);

  const saveState = (newState: FrameState, instance: FrameRunInstance) => {
    const { root: _root, exec: _exec, id: runID, state } = instance;
    renameKey(newState, "$root", _exec.id);
    if (activeRunID.current != runID) return;
    const { $api, ...prevState } = state;
    executeTreeNode(
      _exec,
      {
        state,
        newState: applyPropsToState(newState, rootProps, _exec.id),
        prevState: _.cloneDeep(prevState),
        slides: {},
      },
      {
        api: props.superstate.api,
        saveState,
        root: _root,
        contexts: props.contexts,
        runID,
        selectedSlide,
        exec: _exec,
        styleAst: instance.styleAst,
      }
    ).then((s) => {
      setInstance((p) => {
        return s;
      });
    });
  };
  useEffect(() => {
    if (instance?.root && props.propSetters)
      stateChangedForProps(
        Object.keys(props.propSetters),
        rootProps,
        instance.state,
        instance.root.id
      ).forEach((f) => {
        props.propSetters[f](instance.state[instance.root.id].props[f]);
      });
  }, [instance]);
  // useEffect(() => {
  //   if (instance && root) saveState(null, { ...instance, state: {} });
  // }, [selectedSlide]);
  const selectableNodeBounds = useRef<Record<string, Box>>({});
  const fastSaveState = (newState: FrameState) => {
    setInstance((p) => {
      return { ...p, state: newState };
    });
  };
  useEffect(
    () => () => {
      activeRunID.current = null;
    },
    []
  );

  const runRoot = () => {
    if (root) {
      const newRoot = _.cloneDeep(root);
      const runID = uniqueId();
      activeRunID.current = runID;
      const defaultStyleAst: StyleAst = {
        sem: "root",
        type: "style",
        selector: "",
        styles: {},
        children: [
          {
            sem: "h1",
            type: "style",
            selector: "",
            styles: {
              "--font-text-size": "var(--h1-size)",
              "--text-normal": "var(--h1-color)",
              "--font-weight": "var(--h1-weight)",
            },
            children: [],
          },
          {
            sem: "h2",
            type: "style",
            selector: "",
            styles: {
              "--font-text-size": "var(--h2-size)",
              "--text-normal": "var(--h2-color)",
              "--font-weight": "var(--h2-weight)",
            },
            children: [],
          },
          {
            sem: "h3",
            type: "style",
            selector: "",
            styles: {
              "--font-text-size": "var(--h3-size)",
              "--text-normal": "var(--h3-color)",
              "--font-weight": "var(--h3-weight)",
            },
            children: [],
          },
          {
            sem: "h4",
            type: "style",
            selector: "",
            styles: {
              "--font-text-size": "var(--h4-size)",
              "--text-normal": "var(--h4-color)",
              "--font-weight": "var(--h4-weight)",
            },
            children: [],
          },
          {
            sem: "h5",
            type: "style",
            selector: "",
            styles: {
              "--font-text-size": "var(--h5-size)",
              "--text-normal": "var(--h5-color)",
              "--font-weight": "var(--h5-weight)",
            },
            children: [],
          },
          {
            sem: "h6",
            type: "style",
            selector: "",
            styles: {
              "--font-text-size": "var(--h6-size)",
              "--text-normal": "var(--h6-color)",
              "--font-weight": "var(--h6-weight)",
            },
            children: [],
          },
          {
            sem: "button",
            type: "style",
            selector: "",
            styles: {
              color: "var(--text-color)",
              backgroundColor: "var(--interactive-normal)",
              boxShadow: "var(--input-shadow)",
              fontSize: "var(--font-ui-small)",
              borderRadius: "var(--button-radius)",
              padding: "var(--size-4-1) var(--size-4-3)",
              height: "var(--input-height)",
              fontWeight: "var(--input-font-weight)",
              cursor: "var(--cursor)",
              display: "flex",
              alignItems: "center",
            },
            children: [],
          },
        ],
      };
      executeTreeNode(
        newRoot,
        {
          prevState: {},
          state: {},
          newState: applyPropsToState({}, rootProps, newRoot.id),
          slides: {},
        },
        {
          api: props.superstate.api,
          contexts: props.contexts,
          saveState,
          root: root,
          exec: newRoot,
          runID,
          selectedSlide,
          styleAst: defaultStyleAst,
        }
      ).then((s) => {
        setInstance((p) => {
          return s;
        });
        activeRunID.current = s.id;
      });
    }
  };

  useEffect(() => {
    if (
      instance.root &&
      !executableChanged(root, instance.root) &&
      isEqual(props.contexts, instance.contexts)
    ) {
      saveState({ [instance.root.id]: { props: rootProps } }, instance);
    } else {
      runRoot();
    }
  }, [rootProps, root, props.contexts]);

  return (
    <FrameInstanceContext.Provider
      value={{
        id: props.id,
        linkedProps,
        hoverNode,
        setHoverNode,
        selectableNodeBounds,
        runRoot,
        instance,
        saveState,
        fastSaveState,
      }}
    >
      {props.children}
    </FrameInstanceContext.Provider>
  );
};
