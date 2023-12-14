import React, { useContext, useMemo } from "react";

import { PathView } from "core/react/components/PathView/PathView";
import { PathStickerContainer } from "core/react/components/UI/Stickers/PathSticker/PathSticker";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { Superstate } from "core/superstate/superstate";
import { PathPropertyName } from "core/types/context";
import { pathNameToString } from "utils/path";

export const FlowListView = (props: { superstate: Superstate }) => {
  const { filteredData: data } = useContext(ContextEditorContext);

  const flowItems = useMemo(() => {
    return data.map((f) => f[PathPropertyName]);
  }, [data]);

  return (
    <div className="mk-flow-container">
      {flowItems.map((f, i) => (
        <div key={i}>
          <span onClick={() => props.superstate.ui.openPath(f, false)}>
            <PathStickerContainer
              superstate={props.superstate}
              path={f}
            ></PathStickerContainer>
            {pathNameToString(f)}
          </span>
          <PathView
            superstate={props.superstate}
            path={f}
            load={true}
          ></PathView>
        </div>
      ))}
    </div>
  );
};
