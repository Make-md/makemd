import classNames from "classnames";

import { default as i18n, default as t } from "core/i18n";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import { NavigatorContext } from "core/react/context/SidebarContext";
import { Superstate } from "core/superstate/superstate";
import {
  createSpace,
  newPathInSpace,
  saveSpaceMetadataValue,
} from "core/superstate/utils/spaces";
import { SpaceDefGroup } from "core/types/space";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { showSpaceAddMenu } from "../UI/Menus/navigator/showSpaceAddMenu";
import { triggerSpaceMenu } from "../UI/Menus/navigator/spaceContextMenu";
import { SpaceQuery } from "./SpaceQuery";
interface MainMenuComponentProps {
  superstate: Superstate;
}
export const MainMenu = (props: MainMenuComponentProps) => {
  const { superstate } = props;
  const {
    activeViewSpace,
    setDragPaths,
    activeQuery,
    queryMode,
    setQueryMode,
    setActiveQuery,
  } = useContext(NavigatorContext);

  const [activeViewPath, setActiveViewPath] = useState(
    activeViewSpace && props.superstate.pathsIndex.get(activeViewSpace.path)
  );

  const reloadSpace = () => {
    setActiveViewPath(
      activeViewSpace && props.superstate.pathsIndex.get(activeViewSpace.path)
    );
  };
  useEffect(() => {
    const refreshActiveViewPath = (payload: { path: string }) => {
      if (payload.path == activeViewSpace?.path) reloadSpace();
    };
    reloadSpace();
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      refreshActiveViewPath
    );
    props.superstate.eventsDispatcher.addListener(
      "superstateUpdated",
      reloadSpace
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        refreshActiveViewPath
      );
      props.superstate.eventsDispatcher.removeListener(
        "superstateUpdated",
        reloadSpace
      );
    };
  }, [activeViewSpace]);
  const ref = useRef<HTMLDivElement>();
  const inputRef = useRef<HTMLInputElement>();
  const [queryString, setQueryString] = useState("");
  const [filters, setFilters] = useState<SpaceDefGroup[]>([]);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (queryMode && inputRef.current) inputRef.current.focus();
  }, [queryMode]);
  const queries: SpaceDefGroup[] = useMemo(() => {
    return queryString.length > 0
      ? [
          {
            type: "any",
            trueFalse: true,
            filters: [
              {
                type: "fileprop",
                fType: "text",
                field: "name",
                fn: "include",
                value: queryString,
              },
            ],
          },
          ...filters,
        ]
      : filters;
  }, [queryString, filters]);
  useEffect(() => {
    setActiveQuery(queries);
  }, [queries]);

  const { dragPaths, saveActiveSpace } = useContext(NavigatorContext);
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "none";
    if (dragPaths.length == 1) {
      superstate.ui.setDragLabel(i18n.menu.openSpace);
      setHover(true);
    }
  };
  const dragLeave = () => {
    setHover(false);
  };
  const onDrop = () => {
    if (
      dragPaths.length == 1 &&
      props.superstate.spacesIndex.has(dragPaths[0])
    ) {
      saveActiveSpace(dragPaths[0]);
    }
    setHover(false);
  };
  const saveQuerySpace = (e: React.MouseEvent) => {
    showSpacesMenu(
      e,
      props.superstate,
      (link, isNew) => {
        if (!isNew) {
          saveSpaceMetadataValue(
            props.superstate,
            link,
            "filters",
            activeQuery
          );
        } else {
          createSpace(props.superstate, link, {
            filters: activeQuery,
          }).then((f) => props.superstate.ui.openPath(link, false));
        }
      },
      false,
      true
    );
  };
  return (
    <div className="mk-main-menu-container">
      <div className="mk-main-menu-inner">
        <div className={classNames("mk-main-menu", queryMode && "mk-hidden")}>
          <div
            className={`mk-main-menu-button mk-main-menu-button-primary ${
              hover && "is-active"
            }`}
            ref={ref}
            onClick={(e) =>
              props.superstate.ui.mainMenu(ref.current, superstate)
            }
            onContextMenu={(e) =>
              triggerSpaceMenu(props.superstate, activeViewPath, e, null, null)
            }
            onDragLeave={() => dragLeave()}
            onDragOver={(e) => onDragOver(e)}
            onDrop={() => onDrop()}
          >
            {activeViewPath ? (
              <>
                <div
                  className={classNames("mk-main-menu-sticker")}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(
                      activeViewPath.label.sticker
                    ),
                  }}
                  draggable={true}
                  onDragStart={() => setDragPaths([activeViewPath.path])}
                ></div>
                {activeViewPath.displayName}
              </>
            ) : (
              <></>
            )}
            <div
              className="mk-icon-xsmall"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//mk-ui-collapse"),
              }}
            ></div>
          </div>

          <div
            className="mk-main-menu-button"
            onClick={(e) =>
              e.metaKey
                ? props.superstate.ui.quickOpen()
                : setQueryMode((p) => !p)
            }
          >
            <div
              className="mk-icon-small"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//mk-ui-search"),
              }}
            ></div>
          </div>
        </div>

        <div
          className={classNames(
            "mk-main-menu-search",
            !queryMode && "mk-hidden"
          )}
        >
          <div
            className="mk-main-menu-button"
            onClick={(e) => setQueryMode((p) => !p)}
          >
            <div
              className="mk-icon-small"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("lucide//arrow-left"),
              }}
            ></div>
          </div>
          <input
            onClick={(e) => e.stopPropagation()}
            className="mk-cell-text"
            placeholder={i18n.labels.navigatorSearchPlaceholder}
            ref={inputRef}
            type="text"
            value={queryString as string}
            tabIndex={-1}
            onChange={(e) => setQueryString(e.target.value)}
          />
          <div
            aria-label={i18n.buttons.addToSpace}
            className="mk-main-menu-button"
            onClick={(e) => saveQuerySpace(e)}
          >
            <div
              className="mk-icon-small"
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("lucide//plus-square"),
              }}
            ></div>
          </div>
        </div>

        <button
          aria-label={t.buttons.newNote}
          className="mk-main-menu-button"
          onClick={(e) =>
            e.metaKey
              ? showSpaceAddMenu(props.superstate, e, activeViewSpace)
              : newPathInSpace(superstate, activeViewSpace, "md", null, false)
          }
        >
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-ui-new-note"),
            }}
          ></div>
        </button>
      </div>
      {queryMode && (
        <SpaceQuery
          superstate={superstate}
          filters={filters}
          setFilters={setFilters}
        ></SpaceQuery>
      )}
    </div>
  );
};
