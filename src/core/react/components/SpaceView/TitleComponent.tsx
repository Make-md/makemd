import { PathStickerContainer } from "core/react/components/UI/Stickers/PathSticker/PathSticker";
import { Superstate } from "core/superstate/superstate";
import { updatePrimaryAlias } from "core/superstate/utils/label";
import { renamePathByName } from "core/superstate/utils/path";
import React, { useEffect, useMemo, useRef } from "react";
import { pathToString } from "utils/path";

export const TitleComponent = (props: {
  superstate: Superstate;
  path: string;
  readOnly: boolean;
}) => {
  const fileNameRef = useRef(null);
  const [pathState, setPathState] = React.useState(
    props.superstate.pathsIndex.get(props.path)
  );
  const name = useMemo(
    () =>
      pathState
        ? props.superstate.settings.spacesUseAlias
          ? pathState?.displayName
          : pathState?.name
        : pathToString(props.path),
    [pathState, props.path]
  );

  const pathStateUpdated = (payload: { path: string }) => {
    if (payload.path == props.path) {
      const _pathState = props.superstate.pathsIndex.get(props.path);
      if (_pathState) setPathState(_pathState);
    }
  };
  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "pathStateUpdated",
      pathStateUpdated
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "pathStateUpdated",
        pathStateUpdated
      );
    };
  }, []);
  const contentEditable = !props.readOnly;

  const onBlur = (e: React.ChangeEvent<HTMLDivElement>) => {
    const newValue = e.target.innerHTML;
    if (newValue != name) {
      if (props.path == "/") {
        props.superstate.settings.systemName = newValue;
        props.superstate.saveSettings();
        props.superstate.reloadSpaceByPath("/");
        return;
      }
      if (props.superstate.settings.spacesUseAlias) {
        updatePrimaryAlias(
          props.superstate,
          props.path,
          pathState.metadata.aliases,
          newValue
        );
      } else {
        renamePathByName(props.superstate, props.path, newValue);
      }
    }
  };
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
      // fileNameRef.current.innerHTML = fileNameToString(file.name);
      (e.target as HTMLDivElement).blur();
      e.preventDefault();
    }
  };

  return (
    <>
      {props.superstate.settings.spacesStickers && (
        <PathStickerContainer superstate={props.superstate} path={props.path} />
      )}
      <div className="mk-title-container">
        {pathState?.type == "tag" ? (
          <div className="mk-title-prefix">#</div>
        ) : (
          ""
        )}
        <div
          className="mk-inline-title inline-title"
          ref={fileNameRef}
          contentEditable={contentEditable}
          onBlur={onBlur}
          onDrop={(e) => e.preventDefault()}
          onKeyDown={onKeyDown}
          onKeyPress={onKeyPress}
          onKeyUp={onKeyUp}
          dangerouslySetInnerHTML={{
            __html: name,
          }}
        ></div>
      </div>
    </>
  );
};
