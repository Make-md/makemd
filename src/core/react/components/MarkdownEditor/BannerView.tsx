import i18n from "core/i18n";
import ImageModal from "core/react/components/UI/Modals/ImageModal";
import { PathContext } from "core/react/context/PathContext";
import { Superstate } from "core/superstate/superstate";
import { savePathBanner } from "core/superstate/utils/label";
import {
  metadataPathForSpace,
  saveProperties,
} from "core/superstate/utils/spaces";
import { isTouchScreen } from "core/utils/ui/screen";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { URI } from "types/path";
import { windowFromDocument } from "utils/dom";
import { InputModifier } from "../SpaceView/Frames/Setters/StepSetter";
import { SelectOption, defaultMenu } from "../UI/Menus/menu/SelectionMenu";

export const BannerView = (props: {
  superstate: Superstate;
  reposition?: boolean;
  setReposition?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [hasSticker, setHasSticker] = useState(false);
  const { pathState } = useContext(PathContext);

  const [banner, setBanner] = useState<URI>(
    props.superstate.spaceManager.uriByString(
      pathState?.metadata.property?.[props.superstate.settings.fmKeyBanner]
    )
  );
  const readOnly = pathState.readOnly;
  useEffect(() => {
    const banner = props.superstate.spaceManager.uriByString(
      pathState?.metadata.property?.[props.superstate.settings.fmKeyBanner]
    );
    const hasSticker =
      pathState?.metadata.property?.[props.superstate.settings.fmKeySticker]
        ?.length > 0;
    setHasSticker(hasSticker);
    if (banner) {
      setBanner(banner);
    } else {
      setBanner(null);
    }
  }, [pathState]);

  const [offset, setOffset] = useState(
    pathState?.metadata.property?.[props.superstate.settings.fmKeyBannerOffset]
      ? `${(
          parseFloat(
            pathState?.metadata.property?.[
              props.superstate.settings.fmKeyBannerOffset
            ]
          ) * 100
        ).toString()}%`
      : "center"
  );
  const changeCover = (ev: React.MouseEvent) => {
    props.superstate.ui.openPalette(
      <ImageModal
        superstate={props.superstate}
        selectedPath={(image) =>
          savePathBanner(props.superstate, pathState.path, image)
        }
      ></ImageModal>,
      windowFromDocument(ev.view.document)
    );
  };
  const triggerBannerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const menuOptions: SelectOption[] = [
      {
        name: i18n.buttons.changeBanner,
        value: "change",
        icon: "ui//image",
        onClick: (ev: React.MouseEvent) => {
          changeCover(ev);
        },
      },
      {
        name: i18n.buttons.removeBanner,
        value: "remove",
        icon: "ui//file-minus",
        onClick: (ev: React.MouseEvent) => {
          if (props.superstate.spacesIndex.has(pathState.path)) {
            props.superstate.spaceManager.deleteProperty(
              metadataPathForSpace(
                props.superstate,
                props.superstate.spacesIndex.get(pathState.path).space
              ),
              props.superstate.settings.fmKeyBanner
            );
          }
          props.superstate.spaceManager.deleteProperty(
            pathState.path,
            props.superstate.settings.fmKeyBanner
          );
        },
      },
    ];

    props.superstate.ui.openMenu(
      {
        x: e.clientX,
        y: e.clientY,
        width: 0,
        height: 0,
      },

      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
    return false;
  };
  const [modifier, setModifier] = useState<InputModifier>(null);
  const startValue = useRef(offset == "center" ? 50 : parseFloat(offset));
  const currentValue = useRef(offset == "center" ? 50 : parseFloat(offset));
  const saveOffset = (offset: number) => {
    setOffset(offset + "%");
    saveProperties(props.superstate, pathState.path, {
      [props.superstate.settings.fmKeyBannerOffset]: offset.toString(),
    });
  };
  const [, setStartPos] = useState<[number, number]>([0, 0]);
  const step = 0.5;
  const handleMove = useCallback(
    (e: MouseEvent) => {
      setStartPos((pos) => {
        const { clientX: x2, clientY: y2 } = e;
        const [x1, y1] = pos;

        const a = x2 - x1;
        const b = y1 - y2;

        const mod = 1;

        const stepModifer = step * mod;

        let delta = Math.sqrt((((a + b) / 2) * (a + b)) / 2) * stepModifer;
        if (a + b < 0) delta = -delta;

        delta = b * stepModifer;
        let newValue = startValue.current + delta;

        newValue = Math.max(newValue, 0);
        newValue = Math.min(newValue, 100);
        currentValue.current = newValue;

        saveOffset(newValue);

        return pos;
      });
      e.stopPropagation();
    },
    [modifier, step]
  );

  const handleMoveEnd = useCallback(
    (e: MouseEvent) => {
      const captureClick = (e: MouseEvent) => {
        e.stopPropagation(); // Stop the click from being propagated.
        window.removeEventListener("click", captureClick, true); // cleanup
      };
      window.addEventListener(
        "click",
        captureClick,
        true // <-- This registeres this listener for the capture
        //     phase instead of the bubbling phase!
      );
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMoveEnd);
      saveOffset(currentValue.current);
      e.preventDefault();
      e.stopPropagation();
    },
    [handleMove]
  );

  const handleDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!props.reposition) return;
      startValue.current = offset == "center" ? 50 : parseFloat(offset);

      setStartPos([e.clientX, e.clientY]);

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleMoveEnd);
      e.stopPropagation();
    },
    [handleMove, handleMoveEnd, offset, props.reposition]
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey) {
      setModifier("metaKey");
    } else if (e.ctrlKey) {
      setModifier("ctrlKey");
    } else if (e.altKey) {
      setModifier("altKey");
    } else if (e.shiftKey) {
      setModifier("shiftKey");
    }
  };
  const handleKeyUp = () => {
    setModifier(null);
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMoveEnd);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return banner ? (
    <>
      <div
        className={`mk-space-banner`}
        onContextMenu={!readOnly && triggerBannerContextMenu}
        style={
          {
            "--mk-banner-height": props.superstate.settings.bannerHeight + "px",
            backgroundImage: `url("${
              banner.scheme == "vault"
                ? props.superstate.ui.getUIPath(banner.basePath)
                : banner.fullPath
            }")`,
            backgroundPositionY: offset,
            cursor: props.reposition ? "grab" : "inherit",
          } as React.CSSProperties
        }
        onMouseDown={handleDown}
      ></div>
      {props.setReposition && (
        <div className="mk-space-banner-buttons">
          {props.reposition ? (
            <button
              className="mk-hover-button"
              onClick={() => props.setReposition(false)}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//check"),
                }}
              ></div>
              {i18n.labels.done}
            </button>
          ) : (
            <button
              className="mk-hover-button"
              onClick={() => props.setReposition(true)}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("ui//move"),
                }}
              ></div>
              {i18n.labels.reposition}
            </button>
          )}
          <button className="mk-hover-button" onClick={(e) => changeCover(e)}>
            <div
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//edit"),
              }}
            ></div>
            {i18n.labels.changeCoverShort}
          </button>
          <button
            className="mk-hover-button"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//options"),
            }}
            onClick={(e) => triggerBannerContextMenu(e)}
          ></button>
        </div>
      )}
      <div
        className={`mk-spacer`}
        style={
          {
            "--mk-header-height":
              (
                (isTouchScreen(props.superstate.ui) ? 1 : 0) * 26 +
                (props.superstate.settings.bannerHeight - 62) +
                (!props.superstate.settings.spacesStickers ||
                props.superstate.settings.inlineContextNameLayout ==
                  "horizontal"
                  ? 50
                  : hasSticker
                  ? 0
                  : 40)
              ).toString() + "px",
          } as React.CSSProperties
        }
        onContextMenu={(e) => e.preventDefault()}
      ></div>
    </>
  ) : (
    <></>
  );
};
