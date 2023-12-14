import i18n from "core/i18n";
import { showLinkMenu } from "core/react/components/UI/Menus/properties/linkMenu";
import { Superstate } from "core/superstate/superstate";
import { saveSpaceCache } from "core/superstate/utils/spaces";
import { Predicate } from "core/types/predicate";
import { SpaceDefGroup, SpaceDefinition } from "core/types/space";
import { SpaceState } from "core/types/superstate";
import { defaultPredicate } from "core/utils/contexts/predicate/predicate";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PathStickerView } from "../UI/Stickers/PathSticker/PathSticker";
import { SpaceQuery } from "./SpaceQuery";
const SpaceEditor = (props: {
  superstate: Superstate;
  space?: SpaceState;
  parent?: SpaceState;
  metadata?: SpaceDefinition;
  dontOpen?: boolean;
  close: () => void;
}) => {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (e.key == "Enter") {
      saveSpace();
      e.preventDefault();
    }
  };
  const ref = useRef(null);
  const [metadata, setMetadata] = useState<SpaceDefinition>(
    props.metadata ?? {}
  );

  const [predicate, setPredicate] = useState<Predicate>(defaultPredicate);
  const [name, setName] = useState(props.space?.name ?? "");
  const saveMetadata = (metadata: SpaceDefinition) => {
    setMetadata(metadata);
  };
  const saveQuery = (q: SpaceDefGroup[]) => {
    saveMetadata({
      ...metadata,
      filters: q,
    });
  };
  const linkCaches = useMemo(
    () =>
      (metadata?.links ?? [])
        .map((f) => props.superstate.pathsIndex.get(f))
        .filter((f) => f),
    [metadata]
  );

  const saveSpace = async () => {
    let pathState = props.superstate.pathsIndex.get(props.space?.path);
    if (!pathState) {
      pathState = props.superstate.pathsIndex.get("/");
    }
    const newName = name.replace(/\//g, "");
    const parentPath = pathState.parent
      ? pathState.parent
      : props.parent?.type == "folder"
      ? props.parent.path
      : "/";

    const newPath =
      !parentPath || parentPath == "/" ? newName : parentPath + "/" + newName;
    if (newName.length == 0) {
      props.superstate.ui.notify(i18n.notice.newSpaceName);
      return;
    }
    if (
      props.superstate.spacesIndex.has(newPath) &&
      (!props.space || newPath != props.space.path)
    ) {
      props.superstate.ui.notify(i18n.notice.duplicateSpaceName);
      return;
    }
    props.close();
    if (props.space) {
      saveSpaceCache(props.superstate, props.space.space, metadata).then(
        (f) => {
          if (newName != props.space.name)
            props.superstate.spaceManager.renameSpace(
              props.space.path,
              newName
            );
        }
      );
    } else {
      await props.superstate.spaceManager.createSpace(
        newName,
        parentPath,
        metadata
      );
      if (!props.dontOpen) props.superstate.ui.openPath(newPath, false);
    }
  };
  useEffect(() => {
    if (ref.current && name.length == 0) {
      ref.current.focus();
    }
  }, []);

  return (
    <>
      <div className="mk-space-editor">
        <div className="mk-space-editor-appearance">
          <input
            type="text"
            ref={ref}
            className="mk-input mk-input-large"
            placeholder="Space Name"
            value={name}
            onKeyDown={(e) => onKeyDown(e)}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mk-space-editor-section">
          <div className="mk-space-editor-title">
            {i18n.labels.pinnedItems}
            <span></span>
            <button
              aria-label="Add Smart Search"
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
              {i18n.buttons.addSmartSearch}
            </button>
            <button
              onClick={(e) =>
                showLinkMenu(e, props.superstate, (link) =>
                  saveMetadata({
                    ...metadata,
                    links: [...(metadata.links ?? []), link],
                  })
                )
              }
            >
              {i18n.buttons.addItem}
            </button>
          </div>
          {props.space?.type == "tag" ? (
            <></>
          ) : (
            <div className="mk-space-editor-contents">
              {linkCaches.map((f, i) => (
                <div key={i} className="mk-space-editor-link">
                  <PathStickerView
                    superstate={props.superstate}
                    pathState={f}
                  ></PathStickerView>
                  {f.name}
                  <span></span>
                  <div
                    className="mk-icon-small"
                    dangerouslySetInnerHTML={{
                      __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
                    }}
                    onClick={(e) => {
                      saveMetadata({
                        ...metadata,
                        links: [
                          ...(metadata.links ?? []).filter((g) => g != f.path),
                        ],
                      });
                    }}
                  ></div>
                </div>
              ))}
              {metadata?.filters?.length > 0 && (
                <SpaceQuery
                  superstate={props.superstate}
                  filters={metadata.filters ?? []}
                  setFilters={saveQuery}
                ></SpaceQuery>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mk-layout-row mk-layout-justify-end mk-gap-16">
        <button
          className="mod-cta"
          onClick={() => {
            saveSpace();
          }}
        >
          {i18n.buttons.saveSpace}
        </button>
        <button onClick={() => props.close()}>{i18n.buttons.cancel}</button>
      </div>
    </>
  );
};

export default SpaceEditor;
