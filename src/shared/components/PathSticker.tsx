import React, { useEffect, useState } from "react";
import StickerModal from "shared/components/StickerModal";
import { SelectOption } from "shared/types/menu";
import { ISuperstate as Superstate } from "shared/types/superstate";
import { removeIconsForPaths, savePathSticker } from "shared/utils/sticker";
import t from "../i18n";
import { PathState } from "../types/PathState";
import { windowFromDocument } from "../utils/dom";
import { parseStickerString } from "../utils/stickers";
export const PathStickerView = (props: {
  superstate: Superstate;
  pathState: PathState;
  editable?: boolean;
}) => {
  const { pathState } = props;
  const sticker = pathState?.label?.sticker;
  const color = pathState?.label?.color;
  const triggerStickerContextMenu = (e: React.MouseEvent) => {
    if (!pathState) return;

    e.preventDefault();
    e.stopPropagation();
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: t.buttons.changeIcon,
      icon: "ui//sticker",
      onClick: (e) => {
        props.superstate.ui.openPalette(
          <StickerModal
            ui={props.superstate.ui}
            selectedSticker={(emoji) =>
              savePathSticker(props.superstate, pathState?.path, emoji)
            }
          />,
          windowFromDocument(e.view.document)
        );
      },
    });

    menuOptions.push({
      name: t.buttons.removeIcon,
      icon: "ui//file-minus",
      onClick: () => {
        removeIconsForPaths(props.superstate, [pathState.path]);
      },
    });

    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        value: [],
        editable: false,
        options: menuOptions,
        searchable: false,
        showAll: true,
      },
      windowFromDocument(e.view.document)
    );

    return false;
  };
  const triggerStickerMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pathState?.type == "space") {
      props.superstate.ui.openPalette(
        <StickerModal
          ui={props.superstate.ui}
          selectedSticker={(emoji) =>
            savePathSticker(props.superstate, pathState.path, emoji)
          }
        />,
        windowFromDocument(e.view.document)
      );

      return;
    }
    props.superstate.ui.openPalette(
      <StickerModal
        ui={props.superstate.ui}
        selectedSticker={(emoji) =>
          savePathSticker(props.superstate, pathState.path, emoji)
        }
      />,
      windowFromDocument(e.view.document)
    );
  };
  const [stickerType, stickerPath] = parseStickerString(sticker);
  return (
    <div
      className={`mk-path-icon ${sticker ? "" : "mk-path-icon-placeholder"}`}
    >
      {stickerType == "image" ? (
        <img
          src={props.superstate.ui.getUIPath(
            props.superstate.imagesCache.get(stickerPath)
          )}
        />
      ) : (
        <button
          aria-label={t.buttons.changeIcon}
          onContextMenu={triggerStickerContextMenu}
          style={
            color?.length > 0
              ? ({
                  "--label-color": `${color}`,
                  "--icon-color": `#ffffff`,
                } as React.CSSProperties)
              : ({
                  "--icon-color": `var(--mk-ui-text-secondary)`,
                } as React.CSSProperties)
          }
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker(sticker),
          }}
          onClick={(e) => props.editable && triggerStickerMenu(e)}
        ></button>
      )}
    </div>
  );
};

export const PathStickerContainer = (props: {
  superstate: Superstate;
  path: string;
}) => {
  const [cache, setCache] = useState<PathState>(null);
  const reloadCache = () => {
    setCache(props.superstate.pathsIndex.get(props.path));
  };
  const reloadIcon = (payload: { path: string }) => {
    if (payload.path == props.path) {
      reloadCache();
    }
  };

  useEffect(() => {
    reloadCache();
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      reloadIcon
    );

    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        reloadIcon
      );
    };
  }, [props.path]);

  return cache ? (
    <PathStickerView
      superstate={props.superstate}
      pathState={cache}
      editable={true}
    />
  ) : (
    <></>
  );
};
