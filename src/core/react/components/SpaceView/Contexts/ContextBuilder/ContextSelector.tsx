import i18n from "core/i18n";
import { SelectOption, defaultMenu } from "core/react/components/UI/Menus/menu";
import { isMouseEvent } from "core/react/hooks/useLongPress";
import { Superstate } from "core/superstate/superstate";
import { tagSpacePathFromTag } from "core/utils/strings";
import React from "react";
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
      { x: offset.left, y: offset.top + 30 },
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
      }
    );
  };
  const viewContextMenu = (e: React.MouseEvent, space: string) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: "Delete Context",
      icon: "lucide//trash",
      onClick: (e) => {
        props.saveContexts(props.contexts.filter((f) => f != space));
      },
    });

    // Trigger
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
              __html: props.superstate.ui.getSticker("ui//mk-ui-plus"),
            }}
          ></span>
        </span>
      </div>
    </div>
  );
};
