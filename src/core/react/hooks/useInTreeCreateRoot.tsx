import { ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Root, createRoot as origCreateRoot } from "react-dom/client";

//https://github.com/bubblydoo/angular-react/blob/e0f370a7ea3563b1d92530aad207575c086ba3ef/projects/angular-react/src/lib/use-in-tree-create-root/use-in-tree-create-root.ts#L11
export function useInTreeCreateRoot() {
  // Use WeakMap to prevent memory leaks - DOM elements can be garbage collected
  const rootsRef = useRef(new WeakMap<Element | DocumentFragment, ReactNode>());
  const rootMapRef = useRef(new WeakMap<Element | DocumentFragment, Root>());
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // Track containers for iteration (since WeakMap is not iterable)
  const [containers, setContainers] = useState<Set<Element | DocumentFragment>>(new Set());
  const getRoot = (container: Element | DocumentFragment) => {
    return rootMapRef.current.get(container);
  };
  const createRoot: typeof origCreateRoot = useCallback(
    (container, options) => {
      const root: Root = {
        render: (children) => {
          rootsRef.current.set(container, children);
          setUpdateCounter(c => c + 1);
        },
        unmount: () => {
          rootsRef.current.delete(container);
          rootMapRef.current.delete(container);
          setContainers(prev => {
            const newSet = new Set(prev);
            newSet.delete(container);
            return newSet;
          });
          setUpdateCounter(c => c + 1);
        },
      };
      
      rootsRef.current.set(container, null);
      rootMapRef.current.set(container, root);
      setContainers(prev => new Set(prev).add(container));
      setUpdateCounter(c => c + 1);
      
      return root;
    },
    []
  );

  const portals = useMemo(() => {
    return [...containers].map((container) => {
      const root = rootsRef.current.get(container);
      return root ? createPortal(root, container) : null;
    }).filter(Boolean);
  }, [containers, updateCounter]);

  return { createRoot, portals, getRoot };
}
