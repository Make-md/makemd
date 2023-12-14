import t from "core/i18n";
import StickerModal from "core/react/components/UI/Modals/StickerModal";
import { isMouseEvent } from "core/react/hooks/useLongPress";
import { Superstate } from "core/superstate/superstate";
import { savePathSticker } from "core/superstate/utils/label";
import { PathState } from "core/types/superstate";
import { removeIconsForPaths } from "core/utils/emoji";
import React, { useEffect, useState } from "react";
import { SelectOption, defaultMenu } from "../../Menus/menu";

export const PathStickerView = (props: {
  superstate: Superstate;
  pathState: PathState;
}) => {
  const { pathState } = props;
  const sticker = pathState?.label?.sticker;
  const color = pathState?.label?.color;
  const extension = pathState?.type;
  const triggerStickerContextMenu = (e: React.MouseEvent) => {
    if (!pathState) return;
    e.stopPropagation();
    e.preventDefault();
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: t.buttons.changeIcon,
      icon: "lucide//sticker",
      onClick: () => {
        props.superstate.ui.openPalette((_props: { hide: () => void }) => (
          <StickerModal
            ui={props.superstate.ui}
            hide={_props.hide}
            selectedSticker={(emoji) =>
              savePathSticker(props.superstate, pathState?.path, emoji)
            }
          />
        ));
      },
    });

    menuOptions.push({
      name: t.buttons.removeIcon,
      icon: "lucide//file-minus",
      onClick: () => {
        removeIconsForPaths(props.superstate, [pathState.path]);
      },
    });

    props.superstate.ui.openMenu(
      isMouseEvent(e)
        ? { x: e.pageX, y: e.pageY }
        : {
            // @ts-ignore
            x: e.nativeEvent.locationX,
            // @ts-ignore
            y: e.nativeEvent.locationY,
          },
      defaultMenu(props.superstate.ui, menuOptions)
    );

    return false;
  };
  const triggerStickerMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pathState?.type == "space") {
      props.superstate.ui.openPalette((_props: { hide: () => void }) => (
        <StickerModal
          ui={props.superstate.ui}
          hide={_props.hide}
          selectedSticker={(emoji) =>
            savePathSticker(props.superstate, pathState.path, emoji)
          }
        />
      ));

      return;
    }
    props.superstate.ui.openPalette((_props: { hide: () => void }) => (
      <StickerModal
        ui={props.superstate.ui}
        hide={_props.hide}
        selectedSticker={(emoji) =>
          savePathSticker(props.superstate, pathState.path, emoji)
        }
      />
    ));
  };

  return (
    <div
      className={`mk-path-icon ${sticker ? "" : "mk-path-icon-placeholder"}`}
    >
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
                "--icon-color": `var(--text-muted)`,
              } as React.CSSProperties)
        }
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker(sticker),
        }}
        onClick={(e) => triggerStickerMenu(e)}
      ></button>
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
    <PathStickerView superstate={props.superstate} pathState={cache} />
  ) : (
    <></>
  );
};
