import i18n from "core/i18n";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { Superstate } from "core/superstate/superstate";
import React, { useContext } from "react";
export const HoverMultiMenu = (props: { superstate: Superstate }) => {
  const { selectedNodes, groupNodes, selectNodes, saveNodes } =
    useContext(FramesEditorContext);
  const showSelectNodeMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    const options = selectedNodes.map((f) => ({
      name: f.name,
      value: f.id,
    }));
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options,
        saveOptions: (_: string[], value: string[]) => {
          selectNodes(selectedNodes.filter((f) => f.id == value[0]));
        },
        placeholder: i18n.labels.linkItemSelectPlaceholder,
        detail: true,
        searchable: false,
        showAll: true,
      }
    );
  };
  return (
    <div
      className="mk-frame-props-editor menu"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mk-mark" onClick={(e) => showSelectNodeMenu(e)}>
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("lucide//copy-check"),
          }}
        ></div>
        {i18n.labels.itemsSelected.replace(
          "${1}",
          selectedNodes.length.toString()
        )}
      </div>
      <div className="mk-divider"></div>
      <div
        aria-label="Create Vertical Section"
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//mk-ui-rows"),
        }}
        onClick={() =>
          groupNodes(selectedNodes, {
            layoutAlign: `'left'`,
            gap: `'8px'`,
          })
        }
      ></div>
      <div
        aria-label="Create Horizontal Section"
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("lucide//columns"),
        }}
        onClick={() =>
          groupNodes(selectedNodes, { layout: `'row'`, gap: `'8px'` })
        }
      ></div>
      <div className="mk-divider"></div>
      <div
        className="mk-mark"
        aria-label="Delete"
        onClick={() => saveNodes([], selectedNodes)}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("lucide//trash"),
        }}
      ></div>
    </div>
  );
};
