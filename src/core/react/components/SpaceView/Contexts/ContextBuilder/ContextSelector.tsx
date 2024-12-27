import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { tagSpacePathFromTag } from "core/utils/strings";
import { SelectOption, Superstate } from "makemd-core";
import React from "react";
import i18n from "shared/i18n";
import { windowFromDocument } from "shared/utils/dom";
import { ensureTag } from "utils/tags";
export const ContextSelector = (props: {
  superstate: Superstate;
  tag?: string;
  contexts: string[];
  saveContexts: (context: string[]) => void;
}) => {
  const addContext = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    const f = props.superstate.spaceManager
      .readTags()
      .filter((f) => f != props.tag);
    const addTag = async (tag: string) => {
      const newTag = ensureTag(tag);
      props.saveContexts([
        ...props.contexts.filter((f) => f != newTag),
        newTag,
      ]);
    };
    props.superstate.ui.openMenu(
      offset,
      {
        ui: props.superstate.ui,
        multi: false,
        editable: true,
        value: [],
        options: f.map((m) => ({ name: m, value: m })),
        saveOptions: (_, value) => addTag(value[0]),
        placeholder: i18n.labels.contextItemSelectPlaceholder,
        searchable: true,
        showAll: true,
      },
      windowFromDocument(e.view.document)
    );
  };
  const viewContextMenu = (e: React.MouseEvent, space: string) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.menu.deleteContext,
      icon: "ui//trash",
      onClick: (e) => {
        props.saveContexts(props.contexts.filter((f) => f != space));
      },
    });

    // Trigger
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };

  return (
    <div className="mk-context-selector">
      {props.contexts.map((f, i) => (
        <div
          key={i}
          onContextMenu={(e) => viewContextMenu(e, f)}
          onClick={(e) =>
            props.superstate.ui.openPath(tagSpacePathFromTag(f), false)
          }
        >
          <span className="cm-hashtag cm-hashtag-begin cm-hashtag-end">
            {f}
          </span>
        </div>
      ))}
      <div className="mk-filter" onClick={(e) => addContext(e)}>
        <span>
          <span
            className="mk-icon-xsmall"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//plus"),
            }}
          ></span>
        </span>
      </div>
    </div>
  );
};
