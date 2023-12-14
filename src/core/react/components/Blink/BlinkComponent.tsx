import t from "core/i18n";
import { PathView } from "core/react/components/PathView/PathView";
import SelectMenu, {
  SelectMenuProps,
  SelectOption,
} from "core/react/components/UI/Menus/menu";
import { Superstate } from "core/superstate/superstate";
import React, { useEffect, useMemo, useState } from "react";
import { pathNameToString, pathToString } from "utils/path";
const BlinkComponent = React.forwardRef(
  (props: { superstate: Superstate; hide: () => void }, ref: any) => {
    const [previewPath, setPreviewPath] = useState<string>(null);
    const [allItems, setAllItems] = useState([]);
    const defaultOptions: SelectOption[] = useMemo(
      () =>
        props.superstate.ui.navigationHistory().map((f) => ({
          description: f,
          value: f,
          name: pathToString(f),
        })),
      []
    );
    useEffect(() => {
      const allTags: SelectOption[] = props.superstate.spaceManager
        .readTags()
        .map((f) => ({
          value: f,
          name: f,
        }));
      const allNotes: SelectOption[] = props.superstate.spaceManager
        .allPaths()
        .map((f) => ({
          name: pathNameToString(f),
          description: f,
          value: f,
        }));
      setAllItems([...allNotes, ...allTags]);
    }, []);
    const loadPreview = (path: string): void => {
      if (previewPath != path) {
        setPreviewPath(path);
      }
    };

    const hoverItem = (item: string) => {
      loadPreview(item);
    };

    const selectItem = (item: string, modifiers: boolean) => {
      if (!item) return;
      props.superstate.ui.openPath(item, modifiers);
    };

    const optionProps: SelectMenuProps = {
      multi: false,
      editable: true,
      ui: props.superstate.ui,
      onHover: hoverItem,
      value: [],
      options: allItems,
      defaultOptions: defaultOptions,
      saveOptions: (_, items: string[], modifiers) => {
        selectItem(items[0], modifiers);
      },
      placeholder: t.labels.blinkPlaceholder,
      searchable: true,
      showAll: true,
    };

    return (
      <>
        <SelectMenu
          ref={ref}
          ui={props.superstate.ui}
          {...optionProps}
          hide={props.hide}
          previewComponent={
            previewPath && (
              <div className="mk-blink-preview">
                <PathView
                  superstate={props.superstate}
                  path={previewPath}
                  load={true}
                ></PathView>
              </div>
            )
          }
        ></SelectMenu>
      </>
    );
  }
);

BlinkComponent.displayName = "BlinkComponent";

export default BlinkComponent;
