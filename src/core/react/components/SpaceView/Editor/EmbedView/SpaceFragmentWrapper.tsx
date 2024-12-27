import { Superstate } from "makemd-core";
import React, { PropsWithChildren, useEffect } from "react";

import classNames from "classnames";
import { PathContext } from "core/react/context/PathContext";
import { uriToSpaceFragmentSchema } from "core/superstate/utils/spaces";
import {
  frameSchemaToTableSchema,
  mdbSchemaToFrameSchema,
} from "core/utils/frames/nodes";
import { useContext, useRef } from "react";
import { SpaceFragmentSchema } from "shared/types/spaceFragment";

export const SpaceFragmentTitleComponent = (props: {
  superstate: Superstate;
  readOnly: boolean;
  name: string;
  sticker: string;
  saveName: (name: string) => void;
  saveSticker: (sticker: string) => void;
}) => {
  const { pathState } = useContext(PathContext);
  const fileNameRef = useRef(null);

  const contentEditable = true;

  const onBlur = (e: React.ChangeEvent<HTMLDivElement>) => {
    const newValue = e.target.innerHTML;
    if (newValue != props.name) {
      props.saveName(newValue);
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
    <div>
      <div className="mk-header-icon">
        {/* <div
          className={`mk-path-icon ${
            props.sticker ? "" : "mk-path-icon-placeholder"
          }`}
        >
          <button
            aria-label={i18n.buttons.changeIcon}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker(props.sticker),
            }}
            onClick={(e) => triggerStickerMenu(e)}
          ></button>
        </div> */}
      </div>

      <div className="mk-title-container">
        {pathState?.subtype == "tag" ? (
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
            __html: props.name,
          }}
        ></div>
      </div>
    </div>
  );
};

export const SpaceFragmentWrapper = (
  props: PropsWithChildren<{
    superstate: Superstate;
    path: string;
  }>
) => {
  const [schema, setSchema] = React.useState<SpaceFragmentSchema>(null);

  useEffect(() => {
    uriToSpaceFragmentSchema(props.superstate, props.path).then((f) =>
      setSchema(f)
    );
  }, [props.path]);
  const saveName = (name: string) => {
    if (schema.type == "context") {
      props.superstate.spaceManager.saveTableSchema(
        schema.path,
        schema.id,
        (schema) => ({ ...schema, name })
      );
    }
    if (schema.type == "frame") {
      props.superstate.spaceManager.saveFrameSchema(
        schema.path,
        schema.id,
        (schema) => ({ ...schema, name })
      );
    }
    if (schema.type == "action") {
      props.superstate.spaceManager.saveCommand(
        schema.path,
        schema.id,
        (command) => ({ ...command, schema: { ...command.schema, name } })
      );
    }
  };

  const saveSticker = (name: string) => {
    if (schema.type == "frame") {
      props.superstate.spaceManager.saveFrameSchema(
        schema.path,
        schema.id,
        (schema) => {
          const frameSchema = mdbSchemaToFrameSchema(schema);
          const newFrameSchema = {
            ...frameSchema,
            def: { ...frameSchema.def, icon: name },
          };
          return frameSchemaToTableSchema(newFrameSchema);
        }
      );
    }
    if (schema.type == "action") {
      props.superstate.spaceManager.saveCommand(
        schema.path,
        schema.id,
        (command) => {
          return {
            ...command,
            schema: {
              ...command.schema,
              def: { ...(command.schema?.def ?? {}), icon: name },
            },
          };
        }
      );
    }
  };
  return (
    <div
      className={classNames(
        "mk-editor-space-fragment markdown-source-view mod-cm6",
        props.superstate.settings.readableLineWidth
          ? "is-readable-line-width"
          : ""
      )}
    >
      <div className="mk-editor-header">
        {schema && (
          <SpaceFragmentTitleComponent
            superstate={props.superstate}
            readOnly={true}
            name={schema.name}
            sticker={schema.sticker}
            saveName={saveName}
            saveSticker={saveSticker}
          ></SpaceFragmentTitleComponent>
        )}
      </div>
      {props.children}
    </div>
  );
};
