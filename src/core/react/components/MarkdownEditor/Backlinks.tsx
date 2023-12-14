import i18n from "core/i18n";
import { PathView } from "core/react/components/PathView/PathView";
import { Superstate } from "core/superstate/superstate";
import { eventTypes } from "core/types/types";
import React, { useEffect, useState } from "react";
import { uniq } from "utils/array";
import { pathNameToString } from "utils/path";

const BacklinkItem = (props: {
  path: string;
  superstate: Superstate;
  source: string;
}) => {
  const [block, setBlock] = useState([null, null]);
  const refreshBlock = (path: string) => {
    const fCache = props.superstate.pathsIndex.get(path);
    const link = [
      ...(fCache.metadata.links ?? []),
      ...(fCache.metadata.embeds ?? []),
    ].find((f) => props.source.includes(f.displayText));
    if (link) {
      const block = fCache.metadata.sections.find(
        (f: any) =>
          f.position.start.offset <= link.position.start.offset &&
          f.position.end.offset >= link.position.end.offset
      );
      setBlock([
        Math.max(1, block.position.start.line),
        Math.max(block.position.start.line + 1, block.position.end.line + 1),
      ]);
    } else {
      setBlock([null, null]);
    }
  };
  useEffect(() => {
    refreshBlock(props.path);
  }, []);
  useEffect(() => {
    refreshBlock(props.path);
  }, [props.path]);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div className="mk-path-context-title">
        <button
          className={`mk-collapse mk-inline-button mk-icon-xsmall ${
            collapsed ? "mk-collapsed" : ""
          }`}
          onClick={(e) => {
            setCollapsed(!collapsed);
            e.stopPropagation();
          }}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//mk-ui-collapse"),
          }}
        ></button>
        <div
          onClick={(e) => {
            props.superstate.ui.openPath(props.path, false);
            e.stopPropagation();
          }}
        >
          {pathNameToString(props.path)}
        </div>
      </div>

      {!collapsed ? (
        <div className="mk-path-context-backlink">
          <PathView
            superstate={props.superstate}
            load={true}
            path={props.path}
            properties={{ from: block[0], to: block[1] }}
            classname="mk-path-context-flow"
          ></PathView>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export const Backlinks = (props: { superstate: Superstate; path: string }) => {
  const [collapsed, setCollapsed] = useState(
    !props.superstate.settings.inlineBacklinksExpanded
  );
  const [backlinks, setBacklinks] = useState([]);
  useEffect(() => {
    if (!props.path) return;
    Promise.all(
      uniq([...props.superstate.linksMap.getInverse(props.path)]).map((f) =>
        props.superstate.spaceManager.pathExists(f) ? f : null
      )
    ).then((bls) => setBacklinks(bls.filter((f) => f)));
  }, [props.path]);
  useEffect(() => {
    props.superstate.settings.inlineBacklinksExpanded = !collapsed;
    props.superstate.saveSettings();
  }, [collapsed]);
  const toggleBacklinks = () => {
    setCollapsed(!collapsed);
  };
  useEffect(() => {
    window.addEventListener(eventTypes.toggleBacklinks, toggleBacklinks);
    return () => {
      window.removeEventListener(eventTypes.toggleBacklinks, toggleBacklinks);
    };
  }, [collapsed]);
  return backlinks.length > 0 && props.path ? (
    <div className="mk-path-context-component mk-note-footer">
      <div className="mk-path-context-section">
        <div
          onClick={(e) => {
            setCollapsed(!collapsed);
            e.stopPropagation();
          }}
          className="mk-path-context-title"
        >
          <div
            className={`mk-icon-xsmall`}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-ui-backlink"),
            }}
          ></div>
          {i18n.labels.backlinks}
          <button
            className={`mk-collapse mk-inline-button mk-icon-xsmall ${
              collapsed ? "mk-collapsed" : ""
            }`}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-ui-collapse-sm"),
            }}
          ></button>
        </div>
        <div>
          {!collapsed &&
            backlinks.map((f, i) => (
              <BacklinkItem
                path={f}
                key={i}
                superstate={props.superstate}
                source={props.path}
              ></BacklinkItem>
            ))}
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
};
