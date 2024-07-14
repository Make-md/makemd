import i18n from "core/i18n";
import { Superstate } from "core/superstate/superstate";
import { eventTypes } from "core/types/types";
import React, { useEffect, useState } from "react";
import { uniq } from "utils/array";
import { NoteView } from "../PathView/NoteView";
import { PathCrumb } from "../UI/Crumbs/PathCrumb";
import { CollapseToggle } from "../UI/Toggles/CollapseToggle";

const BacklinkItem = (props: {
  path: string;
  superstate: Superstate;
  source: string;
}) => {
  const [block, setBlock] = useState(null);
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
      <div className="mk-path-backlink-title">
        <PathCrumb superstate={props.superstate} path={props.path}>
          <CollapseToggle
            superstate={props.superstate}
            collapsed={collapsed}
            onToggle={(c) => setCollapsed(c)}
          ></CollapseToggle>
        </PathCrumb>
      </div>

      {!collapsed && block ? (
        <div className="mk-path-context-backlink">
          <NoteView
            load={true}
            superstate={props.superstate}
            path={props.path}
            properties={{ from: block[0], to: block[1] }}
            classname="mk-path-context-flow"
          ></NoteView>
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
    setBacklinks(
      uniq([...props.superstate.linksMap.getInverse(props.path)]).map(
        (f) => props.superstate.pathsIndex.get(f).path
      )
    );
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
      <div
        onClick={(e) => {
          setCollapsed(!collapsed);
          e.stopPropagation();
        }}
        className="mk-path-context-title"
      >
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//backlink"),
          }}
        ></div>
        {i18n.labels.backlinks}
      </div>
      <div className="mk-fold">
        <CollapseToggle
          superstate={props.superstate}
          collapsed={collapsed}
          onToggle={(c) => toggleBacklinks()}
        ></CollapseToggle>
      </div>
      <div className="mk-path-backlinks">
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
  ) : (
    <></>
  );
};
