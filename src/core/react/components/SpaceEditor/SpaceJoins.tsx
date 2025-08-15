import { saveSpaceCache } from "core/superstate/utils/spaces";
import { Superstate, i18n } from "makemd-core";
import React, { useEffect, useState } from "react";
import { Metadata } from "shared/types/metadata";
import { SpaceState } from "shared/types/PathState";
import { JoinDefGroup, SpaceDefinition } from "shared/types/spaceDef";
import { windowFromDocument } from "shared/utils/dom";
import { PathCrumb } from "../UI/Crumbs/PathCrumb";
import { Dropdown } from "../UI/Dropdown";
import { showSpacesMenu } from "../UI/Menus/properties/selectSpaceMenu";
import { CollapseToggleSmall } from "../UI/Toggles/CollapseToggleSmall";
import { SpaceQuery } from "./SpaceQuery";
export const SpaceJoins = (props: {
  superstate: Superstate;
  space: SpaceState;
}) => {
  const [metadata, setMetadata] = useState<SpaceDefinition>(
    props.space.metadata ?? {}
  );

  const saveQuery = (q: JoinDefGroup[]) => {
    saveMetadata({
      ...metadata,
      joins: q,
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
    <div className="mk-space-editor-smart">
      {metadata?.joins?.map((f, i) => (
        <div key={i} className="mk-space-editor-smart-join">
          <div className="mk-space-editor-smart-join-header">
            <div
              className="mk-icon-small"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//merge"),
              }}
            ></div>
            <span>{i18n.labels.joinItemsFrom}</span>
            <PathCrumb
              superstate={props.superstate}
              path={f.path}
              onClick={(e) =>
                showSpacesMenu(
                  e.currentTarget.getBoundingClientRect(),
                  windowFromDocument(e.view.document),
                  props.superstate,
                  (path) =>
                    saveQuery(
                      metadata.joins.map((f, j) =>
                        i == j ? { ...f, path: path } : f
                      )
                    ),
                  true
                )
              }
            >
              {f.path ? (
                <CollapseToggleSmall
                  superstate={props.superstate}
                  collapsed={true}
                ></CollapseToggleSmall>
              ) : (
                i18n.labels.selectSpace
              )}
            </PathCrumb>
            <Dropdown
              superstate={props.superstate}
              options={[
                { name: i18n.labels.notIncludingSubfolders, value: "false" },
                { name: i18n.labels.includingSubfolders, value: "true" },
              ]}
              value={f.recursive ? "true" : "false"}
              selectValue={(v) =>
                saveQuery(
                  metadata.joins.map((f, j) =>
                    i == j ? { ...f, recursive: v == "true" } : f
                  )
                )
              }
            ></Dropdown>
            <div className="mk-spacer"></div>
            <button
              className="mk-toolbar-button"
              aria-label={i18n.buttons.delete}
              onClick={(e) =>
                saveQuery(metadata.joins.filter((f, j) => j != i))
              }
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//trash"),
                }}
              ></div>
              {i18n.buttons.delete}
            </button>
          </div>
          <SpaceQuery
            superstate={props.superstate}
            filters={f.groups ?? []}
            joinType={f.type}
            setJoinType={(type: "any" | "all") => {
              saveQuery(
                metadata.joins.map((f, j) =>
                  i == j ? { ...f, type: type } : f
                )
              );
            }}
            setFilters={(fg) =>
              saveQuery(
                metadata.joins.map((f, j) =>
                  i == j ? { ...f, groups: fg } : f
                )
              )
            }
            removeable={true}
            fields={allOptions}
            sections={sections}
            linkProps={props.space.propertyTypes}
          >
            <button
              className="mk-toolbar-button"
              aria-label={i18n.buttons.addFilter}
              onClick={(e) =>
                saveQuery(
                  metadata.joins.map((f, j) =>
                    i == j
                      ? {
                          ...f,
                          groups: [
                            ...f.groups,
                            {
                              type: "any",
                              trueFalse: true,
                              filters: [],
                            },
                          ],
                        }
                      : f
                  )
                )
              }
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//plus"),
                }}
              ></div>
              {i18n.buttons.addFilter}
            </button>
          </SpaceQuery>
        </div>
      ))}
      <button
        className="mk-toolbar-button"
        aria-label={i18n.buttons.addSmartSearch}
        onClick={(e) => {
          saveMetadata({
            ...metadata,
            joins: [
              ...(metadata.joins ?? []),
              {
                path: "",
                recursive: false,
                type: "any",
                groups: [
                  {
                    type: "any",
                    trueFalse: true,
                    filters: [],
                  },
                ],
              },
            ],
          });
        }}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//plus"),
          }}
        ></div>
        {i18n.buttons.addSmartSearch}
      </button>
    </div>
  );
};
