import { BannerView } from "core/react/components/MarkdownEditor/BannerView";
import React, { useContext, useEffect, useState } from "react";

import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "makemd-core";
import { SpaceExport } from "../SpaceEditor/SpaceExport";
import { SpaceItemProperty } from "../SpaceEditor/SpaceItemProperty";
import { SpaceJoins } from "../SpaceEditor/SpaceJoins";
import { SpaceListProperty } from "../SpaceEditor/SpaceListProperty";
import { SpaceTemplateProperty } from "../SpaceEditor/SpaceTemplateProperty";
import { HeaderPropertiesView } from "./Contexts/SpaceEditor/HeaderPropertiesView";
import { SpaceHeaderBar } from "./SpaceHeaderBar";
import { TitleComponent } from "./TitleComponent";

export interface SpaceProps {
  path: string;
  superstate: Superstate;
}

export const SpaceHeader = (props: { superstate: Superstate }) => {
  const { readMode, pathState } = useContext(PathContext);
  const { spaceState } = useContext(SpaceContext);
  const [repositionMode, setRepositionMode] = React.useState(false);
  const [expandedSection, setExpandedSection] = React.useState<number>(null);
  const [tables, setTables] = useState([]);
  const [templates, setTemplates] = React.useState<string[]>([]);
  useEffect(() => {
    refreshData({ path: pathState?.path });
  }, []);
  useEffect(() => {
    if (spaceState)
      setTemplates(
        props.superstate.spacesIndex.get(spaceState.path)?.templates
      );
  }, [spaceState]);
  const refreshData = (payload: { path: string }) => {
    if (payload.path == pathState?.path)
      props.superstate.spaceManager
        .readAllTables(pathState?.path)
        ?.then((f) => {
          if (f) {
            return (Object.values(f).map((g) => g.schema) ?? []).filter(
              (f) => f.primary != "true"
            );
          }
          return null;
        })
        .then((f) => {
          if (f) setTables(f);
        });
  };
  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "contextStateUpdated",
      refreshData
    );

    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "contextStateUpdated",
        refreshData
      );
    };
  }, [pathState]);
  return (
    <>
      {props.superstate.settings.banners && (
        <BannerView
          superstate={props.superstate}
          reposition={repositionMode}
          setReposition={setRepositionMode}
        ></BannerView>
      )}
      {spaceState && (
        <div className="mk-space-header">
          <div className="mk-path-context-label">
            <TitleComponent
              superstate={props.superstate}
              readOnly={readMode}
              setReposition={setRepositionMode}
            >
              <SpaceHeaderBar
                superstate={props.superstate}
                path={spaceState.path}
                templates={templates}
                expandedSection={expandedSection}
                setExpandedSection={setExpandedSection}
                tables={tables}
              />
            </TitleComponent>
          </div>
          {expandedSection == 0 ? (
            <SpaceItemProperty
              superstate={props.superstate}
              space={spaceState}
              compactMode={false}
            />
          ) : expandedSection == 1 ? (
            <SpaceJoins superstate={props.superstate} space={spaceState} />
          ) : expandedSection == 2 ? (
            <SpaceListProperty
              superstate={props.superstate}
              tables={tables}
            ></SpaceListProperty>
          ) : expandedSection == 3 ? (
            <SpaceTemplateProperty
              superstate={props.superstate}
              templates={templates}
            ></SpaceTemplateProperty>
          ) : expandedSection == 4 ? (
            <SpaceExport
              superstate={props.superstate}
              close={() => setExpandedSection(null)}
            />
          ) : null}
          {spaceState?.type == "folder" &&
            !readMode &&
            props.superstate.settings.inlineContextProperties && (
              <HeaderPropertiesView
                superstate={props.superstate}
                collapseSpaces={true}
              ></HeaderPropertiesView>
            )}
        </div>
      )}
    </>
  );
};
