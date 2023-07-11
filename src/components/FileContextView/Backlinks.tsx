import { FlowView } from "components/FlowEditor/FlowView";
import i18n from "i18n";
import MakeMDPlugin from "main";
import { TAbstractFile } from "obsidian";
import React, { useEffect, useMemo, useState } from "react";
import { eventTypes } from "types/types";
import { uniq } from "utils/array";
import {
  abstractFileAtPathExists,
  getAbstractFileAtPath,
  openAFile,
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { fileNameToString } from "utils/strings";

const BacklinkItem = (props: {
  path: string;
  plugin: MakeMDPlugin;
  source: string;
}) => {
  const file = useMemo(
    () => getAbstractFileAtPath(app, props.path),
    [props.path]
  );
  const [block, setBlock] = useState([null, null]);
  const refreshBlock = (path: string) => {
    const fCache = app.metadataCache.getCache(path);
    const link = [...(fCache.links ?? []), ...(fCache.embeds ?? [])].find((f) =>
      props.source.includes(f.displayText)
    );
    if (link) {
      const block = fCache.sections.find(
        (f) =>
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
      <div className="mk-file-context-title">
        <button
          className={`mk-collapse mk-inline-button mk-icon-xsmall ${
            collapsed ? "mk-collapsed" : ""
          }`}
          onClick={(e) => {
            setCollapsed(!collapsed);
            e.stopPropagation();
          }}
          dangerouslySetInnerHTML={{
            __html: uiIconSet["mk-ui-collapse"],
          }}
        ></button>
        <div
          onClick={(e) => {
            openAFile(file, props.plugin, false);
            e.stopPropagation();
          }}
        >
          {fileNameToString(file.name)}
        </div>
      </div>

      {!collapsed ? (
        <div className="mk-file-context-backlink">
          <FlowView
            plugin={props.plugin}
            load={true}
            path={props.path}
            from={block[0]}
            to={block[1]}
          ></FlowView>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export const Backlinks = (props: {
  plugin: MakeMDPlugin;
  file: TAbstractFile;
}) => {
  const [collapsed, setCollapsed] = useState(
    !props.plugin.settings.inlineBacklinksExpanded
  );
  const [backlinks, setBacklinks] = useState([]);
  useEffect(() => {
    if (!props.file) return;
    const bls = uniq([
      ...props.plugin.index.linksMap.getInverse(props.file.path),
      ...Object.keys(app.metadataCache.resolvedLinks).filter(
        (f) => props.file.path in app.metadataCache.resolvedLinks[f]
      ),
    ]).filter((f) => abstractFileAtPathExists(app, f));
    setBacklinks(bls);
  }, [props.file]);
  useEffect(() => {
    props.plugin.settings.inlineBacklinksExpanded = !collapsed;
    props.plugin.saveSettings();
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
  return backlinks.length > 0 && props.file ? (
    <div className="mk-file-context-component mk-note-footer">
      <div className="mk-file-context-section">
        <div
          onClick={(e) => {
            setCollapsed(!collapsed);
            e.stopPropagation();
          }}
          className="mk-file-context-title"
        >
          <div
            className={`mk-icon-xsmall`}
            dangerouslySetInnerHTML={{
              __html: uiIconSet["mk-ui-backlink"],
            }}
          ></div>
          {i18n.labels.backlinks}
          <button
            className={`mk-collapse mk-inline-button mk-icon-xsmall ${
              collapsed ? "mk-collapsed" : ""
            }`}
            dangerouslySetInnerHTML={{
              __html: uiIconSet["mk-ui-collapse-sm"],
            }}
          ></button>
        </div>
        <div>
          {!collapsed &&
            backlinks.map((f, i) => (
              <BacklinkItem
                path={f}
                key={i}
                plugin={props.plugin}
                source={props.file?.path}
              ></BacklinkItem>
            ))}
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
};
