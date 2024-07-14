import classNames from "classnames";
import { NavigatorContext } from "core/react/context/SidebarContext";
import { createSpace } from "core/superstate/utils/spaces";
import { Area } from "core/types/area";
import { i18n, Superstate } from "makemd-core";
import React, { useContext, useEffect, useState } from "react";
import { windowFromDocument } from "utils/dom";
import { showSpacesMenu } from "../../UI/Menus/properties/selectSpaceMenu";
import StickerModal from "../../UI/Modals/StickerModal";
export const SpaceAreaEditor = (props: {
  superstate: Superstate;
  area: Area;
  saveArea: (area: Area) => void;
}) => {
  const {
    saveActiveSpace,
    editArea,
    activeArea,
    setWaypoints,
    waypoints,
    setEditArea,
  } = useContext(NavigatorContext);
  const [area, setArea] = useState<Area>(props.area);
  useEffect(() => {
    setArea(props.area);
  }, [props.area]);
  return area && props.area ? (
    props.area.name?.length == 0 || editArea ? (
      <div className="mk-path-tree-area">
        <div
          className={classNames("mk-waypoints-item")}
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker(area.sticker),
          }}
          onClick={(e) =>
            props.superstate.ui.openPalette(
              (_props: { hide: () => void }) => (
                <StickerModal
                  ui={props.superstate.ui}
                  hide={_props.hide}
                  selectedSticker={(emoji) => {
                    setArea({ ...area, sticker: emoji });
                  }}
                />
              ),
              windowFromDocument(e.view.document)
            )
          }
        ></div>
        <input
          value={area.name}
          onChange={(e) => setArea({ ...area, name: e.target.value })}
        ></input>
        <div className="mk-button-group">
          <button onClick={() => props.saveArea(area)}>
            {i18n.buttons.save}
          </button>
          <button
            onClick={() => {
              if (props.area.name.length == 0) {
                setWaypoints(waypoints.filter((f, i) => i != activeArea));
                props.superstate.saveSettings();
              } else {
                setEditArea(false);
              }
            }}
          >
            {i18n.buttons.cancel}
          </button>
        </div>
      </div>
    ) : (
      <div className="mk-path-tree-empty">
        <div className="mk-empty-state-title">Open a Space</div>
        <div className="mk-empty-state-description">
          Open an existing folders and tags as a space or create a new one
        </div>
        <button
          onClick={(e) => {
            const offset = (e.target as HTMLElement).getBoundingClientRect();
            showSpacesMenu(
              offset,
              windowFromDocument(e.view.document),
              props.superstate,
              (link) => {
                const isNew = !props.superstate.spacesIndex.has(link);
                if (isNew) {
                  createSpace(props.superstate, link, {}).then((f) => {
                    saveActiveSpace(link);
                    props.superstate.ui.openPath(link, false);
                  });
                  return;
                }
                saveActiveSpace(link);
              },
              true,
              true
            );
          }}
        >
          Open a Space
        </button>
      </div>
    )
  ) : (
    <></>
  );
};
