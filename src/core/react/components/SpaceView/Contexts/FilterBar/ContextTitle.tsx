import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { Superstate } from "makemd-core";
import React, { useContext } from "react";
import { stickerForDBSchema } from "schemas/mdb";
import StickerModal from "shared/components/StickerModal";
import { windowFromDocument } from "shared/utils/dom";
import { safelyParseJSON } from "shared/utils/json";
import { contextPathForSpace } from "shared/utils/makemd/embed";
export const ContextTitle = (props: { superstate: Superstate }) => {
  const { dbSchema, source } = useContext(ContextEditorContext);

  const triggerStickerMenu = (e: React.MouseEvent) => {
    props.superstate.ui.openPalette(
      <StickerModal
        ui={props.superstate.ui}
        selectedSticker={(emoji) =>
          props.superstate.spaceManager.saveTableSchema(
            source,
            dbSchema.id,
            () => ({
              ...dbSchema,
              def: JSON.stringify({
                ...(safelyParseJSON(dbSchema?.def) ?? {}),
                icon: emoji,
              }),
            })
          )
        }
      />,
      windowFromDocument(e.view.document)
    );
  };
  const name = dbSchema?.name;
  const onBlur = (e: React.ChangeEvent<HTMLDivElement>) => {
    const newValue = e.target.innerText;

    if (newValue != name) {
      props.superstate.spaceManager.saveTableSchema(
        source,
        dbSchema.id,
        () => ({
          ...dbSchema,
          name: newValue,
        })
      );
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
      (e.target as HTMLDivElement).blur();
      e.preventDefault();
    }
  };
  return (
    <div className="mk-context-title">
      <div
        className="mk-path-icon"
        onClick={(e) => triggerStickerMenu(e)}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker(stickerForDBSchema(dbSchema)),
        }}
      ></div>
      <div
        contentEditable
        dangerouslySetInnerHTML={{ __html: dbSchema?.name }}
        onBlur={onBlur}
        onKeyPress={onKeyPress}
        onKeyUp={onKeyUp}
        onKeyDown={onKeyDown}
      ></div>
      <button
        className="mk-toolbar-button"
        onClick={() =>
          props.superstate.ui.openPath(
            contextPathForSpace(
              props.superstate.spacesIndex.get(source),
              dbSchema.id
            )
          )
        }
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//expand"),
        }}
      ></button>
    </div>
  );
};
