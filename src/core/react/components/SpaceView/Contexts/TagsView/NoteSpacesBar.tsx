import i18n from "core/i18n";
import { showNewPropertyMenu } from "core/react/components/UI/Menus/contexts/newSpacePropertyMenu";
import { SelectOption, defaultMenu } from "core/react/components/UI/Menus/menu";
import { Superstate } from "core/superstate/superstate";
import { PathState } from "core/types/superstate";
import React, { useEffect, useState } from "react";
import { defaultContextSchemaID } from "schemas/mdb";
import { SpaceProperty } from "types/mdb";
export const NoteSpacesBar = (props: {
  superstate: Superstate;
  path: string;
  addSpace?: (tag: string) => void;
  removeSpace?: (tag: string) => void;
}) => {
  const showContextMenu = (e: React.MouseEvent, path: string) => {
    const space = props.superstate.spacesIndex.get(path);
    if (!space) return;
    e.stopPropagation();
    e.preventDefault();
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.menu.openSpace,
      icon: "lucide//layout-grid",
      onClick: (e) => {
        props.superstate.ui.openPath(space.path, e.metaKey);
      },
    });
    menuOptions.push({
      name: i18n.labels.newProperty,
      icon: "lucide//plus",
      onClick: (e) => {
        newProperty(e, space.path);
      },
    });

    if (props.removeSpace)
      menuOptions.push({
        name: i18n.menu.removeFromSpace,
        icon: "lucide//trash",
        onClick: (e) => {
          props.removeSpace(space.path);
        },
      });

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      defaultMenu(props.superstate.ui, menuOptions)
    );
  };

  const spacesFromPath = (path: string) => {
    return [...props.superstate.spacesMap.get(path)]
      .map((f) => props.superstate.spacesIndex.get(f))
      .filter((f) => f && f.type != "default" && f.path != "/")
      .map((f) => props.superstate.pathsIndex.get(f.path))
      .sort((f, k) =>
        path.startsWith(f.path) ? -1 : path.startsWith(k.path) ? 1 : 0
      )
      .filter((f) => f);
  };

  const [spaces, setSpaces] = useState<PathState[]>(spacesFromPath(props.path));

  const saveField = (source: string, field: SpaceProperty) => {
    if (source == "fm") {
      props.superstate.spaceManager.addProperty(props.path, field);
      return;
    }

    props.superstate.spaceManager.addSpaceProperty(source, field);
  };

  const newProperty = (e: React.MouseEvent, space: string) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showNewPropertyMenu(
      props.superstate,
      { x: offset.left, y: offset.top + 30 },
      [],
      [],
      saveField,
      defaultContextSchemaID,
      space
    );
  };

  useEffect(() => {
    const pathStateUpdated = (payload: { path: string }) => {
      if (payload.path == props.path) {
        setSpaces(spacesFromPath(props.path));
      }
    };
    setSpaces(spacesFromPath(props.path));
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      pathStateUpdated
    );
    props.superstate.eventsDispatcher.addListener(
      "spaceDeleted",
      pathStateUpdated
    );
    props.superstate.eventsDispatcher.addListener(
      "spaceChanged",
      pathStateUpdated
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        pathStateUpdated
      );
      props.superstate.eventsDispatcher.removeListener(
        "spaceDeleted",
        pathStateUpdated
      );
      props.superstate.eventsDispatcher.removeListener(
        "spaceChanged",
        pathStateUpdated
      );
    };
  }, [props.path, setSpaces]);
  return spaces.length > 0 ? (
    <div className="mk-tag-selector">
      {spaces.map((f, i) => (
        <div
          key={i}
          onContextMenu={(e) => showContextMenu(e, f.path)}
          onClick={(e) =>
            props.superstate.ui.openPath(
              f.path,
              e.ctrlKey || e.metaKey ? (e.altKey ? "split" : "tab") : false
            )
          }
          style={
            f.label?.color?.length > 0
              ? ({
                  "--tag-background": f.label?.color,
                  "--tag-color": "var(--color-white)",
                } as React.CSSProperties)
              : {}
          }
        >
          <span className="cm-hashtag cm-hashtag-begin mk-space-icon">
            <div
              className={`mk-icon-xsmall`}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker(f.label?.sticker),
              }}
            ></div>
          </span>
          <span className="cm-hashtag cm-hashtag-end">{f.name}</span>
        </div>
      ))}
    </div>
  ) : (
    <></>
  );
};
