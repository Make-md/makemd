import classNames from "classnames";
import { PathContext } from "core/react/context/PathContext";
import { SpaceContext } from "core/react/context/SpaceContext";
import {
  savePathBanner,
  updatePrimaryAlias,
} from "core/superstate/utils/label";
import { renamePathByName } from "core/superstate/utils/path";
import { savePathIcon } from "core/utils/emoji";
import { isPhone } from "core/utils/ui/screen";
import { i18n, Superstate } from "makemd-core";
import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PathStickerContainer } from "shared/components/PathSticker";
import { PathState } from "shared/types/PathState";
import { windowFromDocument } from "shared/utils/dom";
import { sanitizeFileName } from "shared/utils/sanitizers";
import { stringFromTag } from "utils/tags";
import StickerModal from "../../../../shared/components/StickerModal";
import ImageModal from "../UI/Modals/ImageModal";

export const TitleComponent = (
  props: PropsWithChildren<{
    superstate: Superstate;
    readOnly: boolean;
    setReposition: React.Dispatch<React.SetStateAction<boolean>>;
  }>
) => {
  const { pathState } = useContext(PathContext);
  const { spaceState } = useContext(SpaceContext);

  const aliases: string[] = pathState?.metadata.property?.aliases ?? [];
  const [aliasMode, setAliasMode] = useState(
    props.superstate.settings.spacesUseAlias && aliases?.[0]?.length > 0
  );
  const name = useMemo(
    () =>
      pathState
        ? aliasMode
          ? aliases?.[0]
          : pathState.subtype == "tag"
          ? stringFromTag(pathState?.name)
          : pathState?.name
        : null,
    [pathState, aliasMode]
  );

  useEffect(() => {
    if (props.superstate.settings.spacesUseAlias && aliases?.[0]?.length > 0) {
      setAliasMode(true);
    } else {
      setAliasMode(false);
    }
  }, [pathState]);

  const ref = useRef(null);
  const contentEditable = !props.readOnly && spaceState?.type != "default";

  const onBlur = (e: React.ChangeEvent<HTMLDivElement>) => {
    const newValue = e.target.innerText;

    if (newValue != name) {
      if (pathState.path == "/") {
        props.superstate.settings.systemName = newValue;
        props.superstate.saveSettings();
        props.superstate.reloadPath("/", true);
        return;
      }
      if (aliasMode) {
        updatePrimaryAlias(
          props.superstate,
          pathState.path,
          pathState.metadata?.property?.aliases,
          newValue
        );
      } else {
        const sanitizedName = sanitizeFileName(newValue);

        renamePathByName(props.superstate, pathState.path, sanitizedName).then(
          (f) => {
            if (f && sanitizedName != newValue) {
              updatePrimaryAlias(
                props.superstate,
                f,
                pathState.metadata?.property?.aliases,
                newValue
              );
            }
          }
        );
      }
    }
  };
  useEffect(() => {
    if (!ref?.current) return;
    if (ref.current.innerText.startsWith("Untitled")) {
      ref.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ref.current as HTMLDivElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, []);
  const onKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.key == "a" && e.metaKey) {
      e.preventDefault();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(e.target as HTMLDivElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    if (e.key == "Enter") {
      (e.target as HTMLDivElement).blur();
      e.preventDefault();
    }
    if (e.key == "Escape") {
      (e.target as HTMLDivElement).blur();
      e.preventDefault();
    }
  };
  const hasSticker =
    pathState?.metadata.label?.[props.superstate.settings.fmKeySticker]
      ?.length > 0;
  const hasBanner =
    pathState?.metadata.property?.[props.superstate.settings.fmKeyBanner];
  const isMobile = isPhone(props.superstate.ui);

  return (
    pathState && (
      <>
        {!isMobile && (
          <HeaderLabelActions
            superstate={props.superstate}
            pathState={pathState}
            hasBanner={hasBanner}
            hasSticker={hasSticker}
          />
        )}
        {props.superstate.settings.spacesStickers && hasSticker && (
          <div
            className="mk-header-icon"
            style={
              hasBanner
                ? ({
                    "--label-color": "var(--mk-ui-background)",
                  } as React.CSSProperties)
                : {}
            }
          >
            <PathStickerContainer
              superstate={props.superstate}
              path={pathState.path}
            />
          </div>
        )}

        <div className="mk-title-container">
          {pathState?.subtype == "tag" ? (
            <div className="mk-title-prefix">#</div>
          ) : (
            ""
          )}
          <div
            ref={ref}
            className="mk-inline-title inline-title"
            contentEditable={contentEditable}
            onBlur={onBlur}
            onDrop={(e) => e.preventDefault()}
            onKeyDown={onKeyDown}
            onKeyPress={onKeyPress}
            onKeyUp={onKeyUp}
            dangerouslySetInnerHTML={{
              __html: name,
            }}
            data-ph={aliasMode ? i18n.hintText.alias : i18n.hintText.fileName}
          ></div>
          {isMobile ? (
            <></>
          ) : (
            <button
              className={classNames("mk-title-alias", aliasMode && "mk-active")}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//alias"),
              }}
              aria-label={i18n.buttons.alias}
              onClick={() => setAliasMode(!aliasMode)}
            ></button>
          )}
          {props.children}
        </div>
      </>
    )
  );
};

const HeaderLabelActions = (props: {
  superstate: Superstate;
  pathState: PathState;
  hasBanner: boolean;
  hasSticker: boolean;
}) => {
  const { pathState, hasBanner, hasSticker } = props;
  return (
    <div className="mk-header-label-actions">
      {props.superstate.settings.spacesStickers && !hasSticker && (
        <button
          className="mk-inline-button"
          onClick={(e) =>
            props.superstate.ui.openPalette(
              <StickerModal
                ui={props.superstate.ui}
                selectedSticker={(emoji) =>
                  savePathIcon(props.superstate, pathState.path, emoji)
                }
              />,
              windowFromDocument(e.view.document)
            )
          }
        >
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//smile"),
            }}
          ></div>
          {i18n.buttons.addIcon}
        </button>
      )}
      {!hasBanner && (
        <button
          className="mk-inline-button"
          onClick={(e) =>
            props.superstate.ui.openPalette(
              <ImageModal
                superstate={props.superstate}
                selectedPath={(image) =>
                  savePathBanner(props.superstate, pathState.path, image)
                }
              ></ImageModal>,
              windowFromDocument(e.view.document)
            )
          }
        >
          <div
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-make-image"),
            }}
          ></div>
          {i18n.buttons.addCover}
        </button>
      )}
    </div>
  );
};
