import { frontMatterKeys } from "adapters/obsidian/filetypes/frontmatter/frontMatterKeys";
import { BannerView } from "core/react/components/MarkdownEditor/BannerView";
import { DataPropertyView } from "core/react/components/SpaceView/Contexts/DataTypeView/DataPropertyView";
import { CellEditMode } from "core/react/components/SpaceView/Contexts/TableView/TableView";
import { PathProvider } from "core/react/context/PathContext";
import { Superstate } from "makemd-core";
import React, { useEffect, useMemo, useState } from "react";
import { SpaceTableColumn } from "shared/types/mdb";
import { PathState } from "shared/types/PathState";
import { uniqCaseInsensitive } from "shared/utils/array";
import { parseProperty } from "utils/parsers";
import { pathNameToString } from "utils/path";
import { detectPropertyType, yamlTypeToMDBType } from "utils/properties";

export const RemoteMarkdownHeaderView = (props: {
  superstate: Superstate;
  name: string;
  fm: any;
}) => {
  const { name, fm } = props;

  const [collapsed, setCollapsed] = useState(false);
  const tags = fm.tags ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [columns, setColumns] = useState([]);
  useEffect(() => {
    const newCols = [];
    const newValues: Record<string, string> = {};
    const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));
    const cols: SpaceTableColumn[] = fmKeys.map((f) => ({
      table: "",
      name: f,
      schemaId: "",
      type: yamlTypeToMDBType(detectPropertyType(fm[f], f)),
    }));
    if (fm) {
      newCols.push(...cols);
      Object.keys(fm).forEach((c) => {
        newValues[c] = parseProperty(c, fm[c]);
      });
    }
    setValues(newValues);
    setColumns(newCols);
  }, []);

  const pathState: PathState = useMemo(
    () => ({
      name: name,
      path: name,
      readOnly: true,
      type: "note",
      label: {
        sticker: fm.sticker,
        color: fm.color,
        name: name,
      },
      metadata: {
        property: {
          banner: fm.banner,
        },
      },
    }),
    [fm, name]
  );

  return (
    <PathProvider
      superstate={props.superstate}
      path={props.name}
      pathState={pathState}
      readMode={true}
    >
      {pathState.metadata.property.banner &&
        props.superstate.settings.banners && (
          <BannerView superstate={props.superstate}></BannerView>
        )}
      <div className="mk-path-context-component">
        <div
          className={`mk-path-context-label ${
            props.superstate.settings.inlineContextNameLayout == "horizontal"
              ? "mk-path-context-file-horizontal"
              : ""
          }`}
        >
          <>
            {fm.sticker ? (
              <div className="mk-header-icon">
                <div className={`mk-path-icon`}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: props.superstate.ui.getSticker(fm.sticker),
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <></>
            )}
            <div className="mk-inline-title inline-title">
              {pathNameToString(name)}
            </div>
          </>
        </div>
      </div>
      {!collapsed ? (
        <div className="mk-path-context-component">
          <>
            {columns.map((f, i) => (
              <DataPropertyView
                key={i}
                superstate={props.superstate}
                initialValue={values[f.name]}
                row={{}}
                column={{ ...f, table: "" }}
                editMode={CellEditMode.EditModeView}
                updateValue={() => {
                  /*empty*/
                }}
                updateFieldValue={(fieldValue, value) => {
                  /*empty*/
                }}
                contextTable={{}}
              ></DataPropertyView>
            ))}
          </>
        </div>
      ) : (
        <></>
      )}
    </PathProvider>
  );
};
