import { TagChangeModal } from "components/ui/modals/tagChangeModal";
import { isMouseEvent } from "hooks/useLongPress";
import { uniq } from "lodash";
import MakeMDPlugin from "main";
import { Menu, TFile, TFolder } from "obsidian";
import React, { useEffect, useMemo, useState } from "react";
import { eventTypes } from "types/types";
import {
  getAbstractFileAtPath,
  getFolderPathFromString,
  openTagContext,
} from "utils/file";
import { uiIconSet } from "utils/icons";
import { deleteTag, tagPathToTag } from "utils/metadata/tags";
import { fileNameToString, stringFromTag } from "utils/strings";
import { compareByFieldCaseInsensitive } from "utils/tree";

type FlattendTagNode = {
  tag: string;
  name: string;
  parent: string;
  depth: number;
};

export const TagContextList = (props: { plugin: MakeMDPlugin }) => {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allQueries, setAllQueries] = useState<string[]>([]);
  const openContextMenu = async (e: React.MouseEvent, tag: string) => {
    const fileMenu = new Menu();
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle("Rename Tag");
      menuItem.setIcon("edit");
      menuItem.onClick((ev: MouseEvent) => {
        const vaultChangeModal = new TagChangeModal(
          props.plugin,
          "rename",
          tag
        );
        vaultChangeModal.open();
      });
    });
    fileMenu.addItem((menuItem) => {
      menuItem.setTitle("Delete Tag");
      menuItem.setIcon("trash");
      menuItem.onClick((ev: MouseEvent) => {
        deleteTag(props.plugin, tag, true);
      });
    });

    if (isMouseEvent(e)) {
      fileMenu.showAtPosition({ x: e.pageX, y: e.pageY });
    } else {
      fileMenu.showAtPosition({
        // @ts-ignore
        x: e.nativeEvent.locationX,
        // @ts-ignore
        y: e.nativeEvent.locationY,
      });
    }
  };
  const openContextView = async (tag: string) => {
    openTagContext(tag, props.plugin, false);
  };
  useEffect(() => {
    window.addEventListener(eventTypes.spacesChange, refreshData);

    return () => {
      window.removeEventListener(eventTypes.spacesChange, refreshData);
    };
  }, []);

  const refreshData = () => {
    refreshTags();
  };
  const refreshTags = () => {
    const folder =
      props.plugin.settings.tagContextFolder == ""
        ? app.vault.getRoot()
        : (getAbstractFileAtPath(
            app,
            getFolderPathFromString(props.plugin.settings.tagContextFolder)
          ) as TFolder);
    const f =
      folder?.children
        .filter(
          (f) =>
            f instanceof TFile &&
            f.extension == "mdb" &&
            f.name.charAt(0) == "#"
        )
        .map((f) => tagPathToTag(fileNameToString(f.name))) ?? [];
    setAllTags(
      uniq([...f.filter((g) => g), ...Object.keys(app.metadataCache.getTags())])
    );
  };

  useEffect(() => {
    refreshData();
  }, []);
  const tags: FlattendTagNode[] = useMemo(() => {
    return uniq(
      allTags.reduce((p, c) => {
        const r = c.split("/");
        const allSubTags = r.reduce((a, b, i, array) => {
          return [...a, array.slice(0, i + 1).join("/")];
        }, []);
        return [...p, ...allSubTags];
      }, [])
    )
      .map((f) => {
        const r = f.split("/");
        return {
          tag: f,
          name: stringFromTag(r[r.length - 1]),
          parent: r.length > 1 ? r.slice(0, r.length - 1).join("/") : null,
          depth: r.length - 1,
        };
      })
      .sort(compareByFieldCaseInsensitive("tag", true));
  }, [allTags]);
  const indentationWidth = 24;
  return (
    <div className="tag-container mk-context-tree">
      <div className="mk-tree-wrapper">
        <div className="mk-section">
          <div className="mk-section-title">
            <div className="mk-tree-text">Tags</div>
          </div>

          <div>
            <button
              aria-label={"New Tag"}
              className="mk-inline-button"
              onClick={() => {
                const vaultChangeModal = new TagChangeModal(
                  props.plugin,
                  "create tag"
                );
                vaultChangeModal.open();
              }}
              dangerouslySetInnerHTML={{
                __html: uiIconSet["mk-ui-plus"],
              }}
            ></button>
          </div>
        </div>
      </div>
      <div className="tree-item">
        {tags.map((f, i) => (
          <div
            key={i}
            className="tree-item-self is-clickable mk-context-item"
            onContextMenu={(e) => openContextMenu(e, f.tag)}
            onClick={() => openContextView(f.tag)}
            style={
              {
                "--spacing": `${indentationWidth * f.depth}px`,
              } as React.CSSProperties
            }
          >
            <div className="mk-file-icon">
              <button
                dangerouslySetInnerHTML={{
                  __html: uiIconSet["mk-ui-tags"],
                }}
              ></button>
            </div>
            {f.name}
          </div>
        ))}
      </div>
    </div>
  );
};
