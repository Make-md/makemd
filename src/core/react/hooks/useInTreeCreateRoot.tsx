import { ReactNode, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Root, createRoot as origCreateRoot } from "react-dom/client";

//https://github.com/bubblydoo/angular-react/blob/e0f370a7ea3563b1d92530aad207575c086ba3ef/projects/angular-react/src/lib/use-in-tree-create-root/use-in-tree-create-root.ts#L11
export function useInTreeCreateRoot() {
  const [roots, setRoots] = useState<
    Map<Element | DocumentFragment, ReactNode>
  >(new Map());
  const [rootMap, setRootMap] = useState<Map<Element | DocumentFragment, Root>>(
    new Map()
  );
  const getRoot = (container: Element | DocumentFragment) => {
    return rootMap.get(container);
  };
  const createRoot: typeof origCreateRoot = useCallback(
    (container, options) => {
      const root: Root = {
        render: (children) => {
          setRoots((roots) => {
            const newRoots = new Map(roots);
            newRoots.set(container, children);
            return newRoots;
          });
        },
        unmount: () => {
          setRoots((roots) => {
            const newRoots = new Map(roots);
            newRoots.delete(container);
            return newRoots;
          });
          setRootMap((roots) => {
            const newRoots = new Map(roots);
            newRoots.delete(container);
            return newRoots;
          });
        },
      };
      setRoots((roots) => {
        return new Map(roots).set(container, null);
      });
      setRootMap((r) => {
        return new Map(r).set(container, root);
      });
      return root;
    },
    []
  );

  const portals = useMemo(() => {
    return [...roots.entries()].map(([container, root]) => {
      return createPortal(root, container);
    });
  }, [roots]);

  return { createRoot, portals, getRoot };
}
