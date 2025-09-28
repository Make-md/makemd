import { SelectSection, Superstate } from "makemd-core";
import React, { useState } from "react";
import i18n from "shared/i18n";
import { SpaceProperty } from "shared/types/mdb";
import { Metadata } from "shared/types/metadata";
import { FilterGroupDef } from "shared/types/spaceDef";
import { SpaceQuery } from "../SpaceQuery";

export type FilterEditorProps = {
  superstate: Superstate;
  filters: FilterGroupDef[];
  joinType?: "any" | "all";
  setJoinType?: (type: "any" | "all") => void;
  saveFilters: (filters: FilterGroupDef[]) => void;
  fields: Metadata[];
  sections?: SelectSection[];
  linkProps?: SpaceProperty[];
  hide?: () => void;
};

export const FilterEditor = (props: FilterEditorProps) => {
  const [filters, setFilters] = useState<FilterGroupDef[]>(props.filters ?? []);
  const [joinType, setJoinType] = useState<"any" | "all">(
    props.joinType ?? "all"
  );

  const handleSetFilters = (newFilters: FilterGroupDef[]) => {
    setFilters(newFilters);
  };

  const handleSetJoinType = (type: "any" | "all") => {
    setJoinType(type);
    if (props.setJoinType) {
      props.setJoinType(type);
    }
  };

  const save = () => {
    props.saveFilters(filters);
    if (props.hide) {
      props.hide();
    }
  };

  const addFilterGroup = () => {
    const newFilters = [
      ...filters,
      {
        type: "any" as const,
        trueFalse: true,
        filters: [] as any[],
      },
    ];
    setFilters(newFilters);
  };

  return (
    <div className="mk-filter-editor">
      <div className="mk-filter-editor-header">
        <span>{i18n.menu.filters}</span>
        <button
          aria-label={i18n.labels.done}
          onClick={save}
          className="mk-toolbar-button"
        >
          {i18n.labels.done}
        </button>
      </div>

      <div className="mk-filter-editor-content">
        <SpaceQuery
          superstate={props.superstate}
          filters={filters}
          joinType={joinType}
          setJoinType={props.setJoinType ? handleSetJoinType : undefined}
          setFilters={handleSetFilters}
          fields={props.fields}
          sections={props.sections ?? []}
          linkProps={props.linkProps}
          removeable={true}
        >
          <button
            className="mk-toolbar-button"
            aria-label={i18n.buttons.addFilter}
            onClick={addFilterGroup}
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
    </div>
  );
};
