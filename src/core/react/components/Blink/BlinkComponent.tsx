import { SelectOption } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { PathProvider } from "core/react/context/PathContext";
import { Superstate } from "core/superstate/superstate";
import { Metadata } from "core/types/metadata";
import { SpaceDefGroup } from "core/types/space";
import { PathState } from "core/types/superstate";
import { allMetadata } from "core/utils/metadata";
import { debounce } from "lodash";
import { i18n } from "makemd-core";
import React, { useEffect, useMemo, useState } from "react";

import classNames from "classnames";
import {
  createSpace,
  defaultSpace,
  newPathInSpace,
} from "core/superstate/utils/spaces";
import { searchPath } from "core/superstate/workers/search/impl";
import { PathView } from "../PathView/PathView";
import { SpaceQuery } from "../SpaceEditor/SpaceQuery";
import { PathCrumb } from "../UI/Crumbs/PathCrumb";
import { BlinkMode } from "./Blink";

type BlinkItem = {
  type: string;
  sticker?: string;
  label: string;
  description?: string;
  value?: string;
  cache?: PathState;
};

export const BlinkComponent = (props: {
  superstate: Superstate;
  mode: BlinkMode;
  onSelect?: (path: string) => void;
  hide?: () => void;
  parentSpace?: string;
}) => {
  const [previewPath, setPreviewPath] = useState<string>(null);
  const [showBlink, setShowBlink] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const onChange = (query: string) => {
    setQuery(query);
  };
  const [filters, setFilters] = useState([]);
  const queries: SpaceDefGroup[] = useMemo(() => {
    return query.length > 0
      ? [
          {
            type: "any",
            trueFalse: true,
            filters: [
              {
                type: "file",
                fType: "text",
                field: "name",
                fn: "include",
                value: query,
              },
            ],
          },
          ...filters,
        ]
      : filters;
  }, [query, filters]);
  const pathToBlinkItem = (pathState: PathState): BlinkItem => {
    return {
      type: "path",
      value: pathState.path,
      cache: pathState,
      sticker: pathState.label.sticker,
      description: pathState.label.preview,
      label: pathState.name,
    };
  };
  const parentChildren = props.parentSpace
    ? [
        {
          type: "section",
          label: "Items",
        },
        ...[...props.superstate.spacesMap.getInverse(props.parentSpace)]
          .map((f) => props.superstate.pathsIndex.get(f))
          .filter((f) => f && !f.hidden)
          .map((f) => pathToBlinkItem(f)),
      ]
    : [];
  const recentPaths = [
    {
      type: "section",
      label: "Recent",
    },
    ...props.superstate.ui
      .navigationHistory()
      .map((f) => props.superstate.pathsIndex.get(f))
      .filter((f) => f && !f.hidden)
      .map((f) => pathToBlinkItem(f)),
  ];

  const [suggestions, setFilteredPaths] = useState<BlinkItem[]>(
    props.parentSpace ? parentChildren : recentPaths
  );

  useEffect(() => {
    const runQuery = (path: string, _queries: SpaceDefGroup[]) => {
      if (path.length == 0 && query.length == 0) {
        setFilteredPaths(props.parentSpace ? parentChildren : recentPaths);
        return;
      }

      if (filters.length == 0) {
        props.superstate.searcher
          .run<PathState[]>({
            type: "fastSearch",
            path: path,
            payload: { query: query, count: 10 },
          })
          .then((g) =>
            setFilteredPaths([
              {
                type: "section",
                label: "Results",
              },
              ...g.map((f) => pathToBlinkItem(f)),
              {
                type: "section",
                label: "Create New",
              },
              {
                type: "new-note",
                sticker: "ui//edit",
                value: query,
                label: "New Note",
              },
              {
                type: "new-space",
                sticker: "ui//folder-plus",
                value: query,
                label: "New Space",
              },
            ])
          );
        return;
      }

      if (!props.superstate.settings.searchWorker) {
        const results = searchPath({
          queries: _queries,
          count: 10,
          pathsIndex: props.superstate.pathsIndex,
        });
        setFilteredPaths([
          {
            type: "section",
            label: "Results",
          },
          ...results.map((f) => pathToBlinkItem(f)),
          {
            type: "new-note",
            sticker: "ui//plus",
            value: query,
            label: "New Note",
          },
          {
            type: "new-space",
            sticker: "ui//plus",
            value: query,
            label: "New Space",
          },
        ]);
        return;
      }
      props.superstate.searcher
        .run<PathState[]>({
          type: "search",
          path: path,
          payload: { queries: _queries, count: 10 },
        })
        .then((g) => setFilteredPaths(g.map((f) => pathToBlinkItem(f))));
    };
    debounce(() => runQuery(query, queries), 300)();

    // Define an async function to filter the paths
  }, [query, queries]);

  useEffect(() => {
    if (!suggestions[index]) return;
    if (suggestions[index].type != "path") return;
    const path = suggestions[index]?.cache?.path;
    if (!path || path == previewPath) return;
    setPreviewPath(suggestions[index]?.cache?.path);
  }, [index, suggestions]);

  const selectItem = (item: BlinkItem, force?: boolean) => {
    if (!item) return;
    if (item.type == "section") return;
    if (item.type == "new-note") {
      if (props.parentSpace) {
        const parentSpace = props.superstate.spacesIndex.get(props.parentSpace);
        if (parentSpace) {
          newPathInSpace(props.superstate, parentSpace, "md", query).then(
            (f) => {
              if (props.mode == BlinkMode.Open) {
                props.onSelect(f);
              }
              props.hide();
            }
          );
          return;
        }
      }
      defaultSpace(
        props.superstate,
        props.superstate.pathsIndex.get(props.superstate.ui.activePath)
      ).then((f) =>
        newPathInSpace(props.superstate, f, "md", query).then((f) => {
          if (props.mode == BlinkMode.Open) {
            props.onSelect(f);
          }
          props.hide();
        })
      );
      return;
    }
    if (item.type == "new-space") {
      const pathState =
        props.superstate.pathsIndex.get(props.parentSpace) ??
        props.superstate.pathsIndex.get("/");
      const newName = query.replace(/\//g, "");
      const parentPath =
        pathState?.subtype == "folder"
          ? pathState.path
          : pathState.parent
          ? pathState.parent
          : "/";

      const newPath =
        !parentPath || parentPath == "/" ? newName : parentPath + "/" + newName;
      if (newName.length == 0) {
        props.superstate.ui.notify(i18n.notice.newSpaceName);
        return;
      }
      if (props.superstate.spacesIndex.has(newPath)) {
        props.superstate.ui.notify(i18n.notice.duplicateSpaceName);
        return;
      }
      createSpace(props.superstate, newPath, {}).then((f) => {
        if (props.mode == BlinkMode.Open) {
          props.onSelect(f.path);
        }
        props.hide();
      });
      return;
    }
    if (item.cache) {
      if (props.mode == BlinkMode.Open) {
        props.onSelect(item.cache?.path);
        props.hide();
        return;
      }
      if (!showBlink || force) {
        props.superstate.ui.openPath(item.cache?.path);
        props.hide();
        return;
      }
    }

    setIndex(suggestions.findIndex((f) => f.cache?.path == item.cache?.path));
  };

  const sections: SelectOption[] = [];

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key == "Tab") {
      if (sections) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    if (e.key == "ArrowUp") {
      const size = 0;
      const newIndex = index <= size ? suggestions.length - 1 : index - 1;
      if (suggestions.length == 0) return;
      if (!suggestions[newIndex] || suggestions[newIndex].type == "section") {
        setIndex(newIndex < size ? suggestions.length - 1 : newIndex - 1);
      } else {
        setIndex(newIndex);
      }
      e.preventDefault();
    }
    if (e.key == "ArrowDown") {
      const size = suggestions.length - 1;
      const newIndex = index >= size ? 0 : index + 1;
      if (!suggestions[newIndex] || suggestions[newIndex].type == "section") {
        setIndex(newIndex >= size ? 0 : newIndex + 1);
      } else {
        setIndex(newIndex);
      }
      setIndex(newIndex);
      e.preventDefault();
    }
    if (e.key == "Enter") {
      selectItem(suggestions[index], true);
      e.preventDefault();
    }
  };

  const ref = React.useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, [ref.current]);

  const metadataProperties = allMetadata(props.superstate);
  const allOptions: Metadata[] = [];
  Object.keys(metadataProperties).forEach((type) => {
    metadataProperties[type].properties.forEach((field) => {
      allOptions.push({ ...field });
    });
  });
  const allSections = Object.keys(metadataProperties).map((f) => {
    return {
      name: metadataProperties[f].name,
      value: f,
    };
  });
  return (
    <>
      <div className="mk-blink-input-container">
        <div
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//search"),
          }}
        ></div>
        <div
          data-placeholder={i18n.labels.blinkPlaceholder}
          onInput={(e) => onChange(e.currentTarget.innerText)}
          onKeyDown={(e) => keyDown(e)}
          ref={ref}
          contentEditable
          className="mk-blink-input"
        ></div>
        {props.mode == BlinkMode.Blink && (
          <>
            <button
              onClick={() => setShowBlink((f) => !f)}
              className="mk-toolbar-button"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//blink"),
              }}
            ></button>
            <button
              className="mk-toolbar-button"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//filter"),
              }}
              onClick={() => setShowFilters(!showFilters)}
            ></button>
          </>
        )}
      </div>
      {showFilters && (
        <div className="mk-blink-filters">
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//filter"),
            }}
          ></div>
          <SpaceQuery
            superstate={props.superstate}
            filters={filters}
            setFilters={setFilters}
            fields={allOptions}
            sections={allSections}
          ></SpaceQuery>
        </div>
      )}
      <div className={`mk-blink-suggester`} style={{} as React.CSSProperties}>
        <div className="mk-blink-suggestions">
          {suggestions.map((f, i) => (
            <div
              key={i}
              className={classNames(
                f.type == "section"
                  ? "mk-blink-section"
                  : "mk-blink-suggestion",
                index == i && "mk-active"
              )}
              onClick={(e) => selectItem(f)}
            >
              {f.type == "section" ? (
                <div className="mk-blink-suggestion-title">{f.label}</div>
              ) : (
                <>
                  <div
                    className="mk-blink-suggestion-icon"
                    dangerouslySetInnerHTML={{
                      __html: props.superstate.ui.getSticker(f.sticker),
                    }}
                  ></div>
                  <div className="mk-blink-suggestion-text">
                    <div className="mk-blink-suggestion-title">{f.label}</div>
                    <div className="mk-blink-suggestion-description">
                      {f.value}
                    </div>
                    {f.description && (
                      <div className="mk-blink-suggestion-preview">
                        {f.description}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        {props.mode == 1 && showBlink && (
          <BlinkPathWrapper superstate={props.superstate} path={previewPath} />
        )}
      </div>
    </>
  );
};

export const BlinkPathWrapper = (props: {
  superstate: Superstate;
  path: string;
}) => {
  const ref = React.useRef(null);
  const [showProperties, setShowProperties] = useState(false);
  return (
    <div className="mk-blink-preview" ref={ref}>
      <div className="mk-blink-preview-title">
        <PathCrumb superstate={props.superstate} path={props.path}></PathCrumb>
        <span></span>
        <button
          className={
            showProperties ? "is-active mk-icon-small" : "mk-icon-small"
          }
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//list"),
          }}
          onClick={() => setShowProperties(!showProperties)}
        ></button>
      </div>
      <PathView
        id="blink"
        superstate={props.superstate}
        path={props.path}
        containerRef={ref}
        styles={{}}
        readOnly={true}
      ></PathView>

      {showProperties && (
        <div className="mk-blink-properties">
          <div className="mk-blink-properties-header">Properties</div>
          <PathProvider
            path={props.path}
            superstate={props.superstate}
            readMode={false}
          ></PathProvider>
        </div>
      )}
    </div>
  );
};
