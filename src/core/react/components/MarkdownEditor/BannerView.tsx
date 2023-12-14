import i18n from "core/i18n";
import { EmbedFrameView } from "core/react/components/SpaceView/Editor/EmbedView/EmbedContextViewComponent";
import ImageModal from "core/react/components/UI/Modals/ImageModal";
import { isMouseEvent } from "core/react/hooks/useLongPress";
import { Superstate } from "core/superstate/superstate";
import { savePathBanner } from "core/superstate/utils/label";
import React, { MouseEvent, useEffect, useState } from "react";
import { URI } from "types/path";
import { SelectOption, defaultMenu } from "../UI/Menus/menu";

export const BannerView = (props: {
  superstate: Superstate;
  bannerPath: string;
  itemPath?: string;
}) => {
  const [banner, setBanner] = useState<URI>(null);

  useEffect(() => {
    if (props.bannerPath) {
      const path = props.superstate.spaceManager.uriByString(props.bannerPath);
      setBanner(path);
    } else {
      setBanner(null);
    }
  }, [props.bannerPath]);
  const triggerBannerContextMenu = (e: React.MouseEvent) => {
    if (!props.itemPath) return;
    e.preventDefault();
    const menuOptions: SelectOption[] = [
      {
        name: i18n.buttons.changeBanner,
        value: "change",
        icon: "lucide//image",
        onClick: (ev: MouseEvent) => {
          props.superstate.ui.openPalette((_props: { hide: () => void }) => (
            <ImageModal
              superstate={props.superstate}
              hide={_props.hide}
              selectedPath={(image) =>
                savePathBanner(props.superstate, props.itemPath, image)
              }
            ></ImageModal>
          ));
        },
      },
      {
        name: i18n.buttons.removeBanner,
        value: "remove",
        icon: "lucide//file-minus",
        onClick: (ev: MouseEvent) => {
          props.superstate.spaceManager.deleteProperty(
            props.itemPath,
            props.superstate.settings.fmKeyBanner
          );
        },
      },
    ];

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

  return banner ? (
    <div className={`mk-note-header`} onContextMenu={triggerBannerContextMenu}>
      {!banner.refType ? (
        <img src={props.superstate.ui.getUIPath(banner.basePath)} />
      ) : banner.refType == "frame" ? (
        <EmbedFrameView
          source={props.itemPath}
          superstate={props.superstate}
          path={banner}
        ></EmbedFrameView>
      ) : (
        <></>
      )}
    </div>
  ) : (
    <></>
  );
};
