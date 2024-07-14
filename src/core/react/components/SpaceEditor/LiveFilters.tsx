import { saveSpaceCache } from "core/superstate/utils/spaces";
import { Metadata } from "core/types/metadata";
import { SpaceDefGroup, SpaceDefinition } from "core/types/space";
import { SpaceState } from "core/types/superstate";
import { Superstate, i18n } from "makemd-core";
import React, { useEffect, useState } from "react";
import { SpaceQuery } from "./SpaceQuery";
export const LiveFilters = (props: {
  superstate: Superstate;
  space: SpaceState;
}) => {
  const [metadata, setMetadata] = useState<SpaceDefinition>(
    props.space.metadata ?? {}
  );

  const saveQuery = (q: SpaceDefGroup[]) => {
    saveMetadata({
      ...metadata,
      filters: q,
    });
  };

  const saveMetadata = (metadata: SpaceDefinition) => {
    setMetadata(metadata);
    saveSpaceCache(props.superstate, props.space.space, metadata);
  };
  const metadataProperties = props.superstate.allMetadata;
  const allOptions: Metadata[] = [];
  Object.keys(metadataProperties).forEach((type) => {
    metadataProperties[type].properties.forEach((field) => {
      allOptions.push(field);
    });
  });
  const sections = Object.keys(metadataProperties).map((f) => {
    return {
      name: metadataProperties[f].name,
      value: f,
    };
  });
  useEffect(() => {
    const updateSpace = (payload: { path: string }) => {
      if (payload.path == props.space.path) {
        const newMetadata = props.superstate.spacesIndex.get(
          props.space.path
        )?.metadata;
        if (newMetadata) setMetadata(newMetadata);
      }
    };
    props.superstate.eventsDispatcher.addListener(
      "spaceStateUpdated",
      updateSpace
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "spaceStateUpdated",
        updateSpace
      );
    };
  }, [props.space]);
  return (
    metadata?.filters?.length > 0 && (
      <div className="mk-path-context-row">
        <div className="mk-path-context-field">
          <div
            className="mk-path-context-field-icon"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//live"),
            }}
          ></div>
          <div className="mk-path-context-field-key">
            {i18n.subViews.smartSearch}
          </div>
        </div>
        <div className="mk-path-context-value">
          <div className="mk-props-value">
            <div className="mk-props-list">
              <div className="mk-space-editor-smart">
                {metadata?.filters?.length > 0 && (
                  <SpaceQuery
                    superstate={props.superstate}
                    filters={metadata.filters ?? []}
                    setFilters={saveQuery}
                    removeable={true}
                    fields={allOptions}
                    sections={sections}
                    linkProps={props.space.propertyTypes}
                  ></SpaceQuery>
                )}
                <button
                  className="mk-filter-add"
                  aria-label={i18n.buttons.addSmartSearch}
                  onClick={(e) =>
                    saveMetadata({
                      ...metadata,
                      filters: [
                        ...(metadata.filters ?? []),
                        {
                          type: "any",
                          trueFalse: true,
                          filters: [],
                        },
                      ],
                    })
                  }
                >
                  <div
                    className="mk-icon-xsmall"
                    dangerouslySetInnerHTML={{
                      __html: props.superstate.ui.getSticker("ui//plus"),
                    }}
                  ></div>
                  {i18n.buttons.addSmartSearch}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};
