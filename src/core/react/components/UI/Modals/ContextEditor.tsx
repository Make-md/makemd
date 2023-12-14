import i18n from "core/i18n";
import { ContextFrameView } from "core/react/components/SpaceView/Contexts/ContextBuilder/ContextFrameView";
import { SpacePropertyEditor } from "core/react/components/SpaceView/Contexts/ContextBuilder/SpacePropertyEditor";
import {
  ContextEditorContext,
  ContextEditorProvider,
} from "core/react/context/ContextEditorContext";
import {
  ContextMDBContext,
  ContextMDBProvider,
} from "core/react/context/ContextMDBContext";
import { FramesMDBProvider } from "core/react/context/FramesMDBContext";
import {
  SpaceContext,
  SpaceContextProvider,
} from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { saveSpaceMetadataValue } from "core/superstate/utils/spaces";
import React, { useContext, useMemo } from "react";
import { SpaceInfo } from "types/mdb";

export const openContextEditorModal = (
  superstate: Superstate,
  space: SpaceInfo,
  db: string,
  view: string,
  type: number
) => {
  superstate.ui.openModal(
    type == 0 ? i18n.labels.properties : i18n.labels.view,
    (props: { hide: () => void }) => (
      <SpaceContextProvider superstate={superstate} space={space}>
        <ContextMDBProvider superstate={superstate} schema={db}>
          <FramesMDBProvider superstate={superstate}>
            <ContextEditorProvider superstate={superstate} schema={view}>
              {type == 0 ? (
                <SpacePropertyEditorContext
                  superstate={superstate}
                ></SpacePropertyEditorContext>
              ) : (
                <ContextFrameView superstate={superstate}></ContextFrameView>
              )}
            </ContextEditorProvider>
          </FramesMDBProvider>
        </ContextMDBProvider>
      </SpaceContextProvider>
    )
  );
};

export const SpacePropertyEditorContext = (props: {
  superstate: Superstate;
}) => {
  const { spaceState: spaceCache } = useContext(SpaceContext);
  const {
    predicate,
    savePredicate,
    sortedColumns,
    hideColumn,
    delColumn,
    saveColumn,
  } = useContext(ContextEditorContext);
  const { tableData } = useContext(ContextMDBContext);
  const columns = useMemo(() => {
    return (tableData?.cols ?? []).sort(
      (a, b) =>
        predicate.colsOrder.findIndex((x) => x == a.name) -
        predicate.colsOrder.findIndex((x) => x == b.name)
    );
  }, [tableData, predicate]);
  const saveContexts = (contexts: string[]) => {
    saveSpaceMetadataValue(
      props.superstate,
      spaceCache.path,
      "contexts",
      contexts
    );
  };
  return (
    <SpacePropertyEditor
      superstate={props.superstate}
      colsOrder={predicate.colsOrder}
      setColumnOrder={(cols) =>
        savePredicate({ ...predicate, colsOrder: cols })
      }
      colsHidden={predicate.colsHidden}
      columns={columns}
      contexts={spaceCache?.contexts ?? []}
      saveContexts={saveContexts}
      hideColumn={hideColumn}
      delColumn={delColumn}
      saveColumn={saveColumn}
    ></SpacePropertyEditor>
  );
};
