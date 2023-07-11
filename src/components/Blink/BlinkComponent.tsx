import { FlowView } from "components/FlowEditor/FlowView";
import SelectMenu, {
  SelectMenuProps,
  SelectOption,
} from "components/ui/menus/selectMenu";
import t from "i18n";
import MakeMDPlugin from "main";
import React, { useEffect, useMemo, useState } from "react";
import { getAbstractFileAtPath, getAllAbstractFilesInVault } from "utils/file";
import { loadTags } from "utils/metadata/tags";
import { openPath, pathByString } from "utils/path";
import { fileNameToString, filePathToString } from "utils/strings";
const BlinkComponent = React.forwardRef(
  (props: { plugin: MakeMDPlugin; hide: () => void }, ref: any) => {
    const [previewPath, setPreviewPath] = useState<string>(null);
    const [allItems, setAllItems] = useState([]);
    const defaultOptions: SelectOption[] = useMemo(
      () =>
        app.workspace
          .getLastOpenFiles()
          .filter((f) => getAbstractFileAtPath(app, f))
          .map((f) => ({
            description: f,
            value: f,
            name: filePathToString(f),
          })),
      []
    );
    useEffect(() => {
      const allTags: SelectOption[] = loadTags(props.plugin).map((f) => ({
        value: f,
        name: f,
      }));
      const allNotes: SelectOption[] = getAllAbstractFilesInVault(
        props.plugin,
        app
      ).map((f) => ({
        name: fileNameToString(f.name),
        description: f.path,
        value: f.path,
      }));
      setAllItems([...allNotes, ...allTags]);
    }, []);
    const loadPreview = (path: string): void => {
      if (previewPath != path && getAbstractFileAtPath(app, path)) {
        setPreviewPath(path);
      }
    };

    const hoverItem = (item: string) => {
      loadPreview(item);
    };

    const selectItem = (item: string) => {
      if (!item) return;
      openPath(props.plugin, pathByString(item));
    };

    const optionProps: SelectMenuProps = {
      multi: false,
      editable: true,
      onHover: hoverItem,
      value: [],
      options: allItems,
      defaultOptions: defaultOptions,
      saveOptions: (_, items: string[]) => selectItem(items[0]),
      placeholder: t.labels.blinkPlaceholder,
      searchable: true,
      showAll: true,
    };

    return (
      <>
        <SelectMenu
          ref={ref}
          {...optionProps}
          hide={props.hide}
          previewComponent={
            previewPath && (
              <div className="mk-blink-preview">
                <FlowView
                  plugin={props.plugin}
                  path={previewPath}
                  load={true}
                ></FlowView>
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
