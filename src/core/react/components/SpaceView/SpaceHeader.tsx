import { BannerView } from "core/react/components/MarkdownEditor/BannerView";
import React, { useContext } from "react";

import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "core/superstate/superstate";
import { HeaderPropertiesView } from "./Contexts/SpaceEditor/HeaderPropertiesView";
import { TitleComponent } from "./TitleComponent";

export interface SpaceProps {
  path: string;
  superstate: Superstate;
}

export const SpaceHeader = (props: { superstate: Superstate }) => {
  const { readMode } = useContext(PathContext);
  const { spaceState } = useContext(SpaceContext);
  const [repositionMode, setRepositionMode] = React.useState(false);

  return (
    <>
      {props.superstate.settings.banners && (
        <BannerView
          superstate={props.superstate}
          reposition={repositionMode}
          setReposition={setRepositionMode}
        ></BannerView>
      )}
      <div className="mk-space-header">
        <div className="mk-path-context-label">
          <TitleComponent
            superstate={props.superstate}
            readOnly={readMode}
            setReposition={setRepositionMode}
          ></TitleComponent>
        </div>
        {spaceState?.type == "folder" &&
          !readMode &&
          props.superstate.settings.inlineContextProperties && (
            <HeaderPropertiesView
              superstate={props.superstate}
              collapseSpaces={true}
            ></HeaderPropertiesView>
          )}
      </div>
    </>
  );
};
